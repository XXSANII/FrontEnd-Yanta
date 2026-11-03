-- Schema + RPC สำหรับ Customer Frontend (รันใน Supabase SQL editor)

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('congee','breakfast','milk-tea','coffee')),
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  image_url text,
  is_available boolean not null default true
);

-- โต๊ะจริง: QR ติดโต๊ะเก็บแค่ token (สุ่ม) ไม่ใช่เลขโต๊ะ
create table if not exists tables (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  token text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  is_enabled boolean not null default true
);

-- session = ช่วงที่โต๊ะนั้นเปิดสั่งอาหาร; ปิดเมื่อพนักงานเช็กบิลหรือหมดอายุ
create table if not exists table_sessions (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references tables(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '4 hours',
  closed_at timestamptz
);
-- มี session ที่ยังไม่ปิดได้แค่ 1 อันต่อโต๊ะ
create unique index if not exists one_open_session_per_table
  on table_sessions(table_id) where closed_at is null;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,            -- idempotency key
  table_session_id uuid references table_sessions(id),
  status text not null default 'pending'
    check (status in ('pending','preparing','served','cancelled')),
  total_amount numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  product_name text not null,
  quantity int not null check (quantity > 0),
  unit_price numeric(10,2) not null,
  subtotal numeric(10,2) not null
);

alter table products enable row level security;
alter table tables enable row level security;
alter table table_sessions enable row level security;
-- ไม่มี policy บน tables / table_sessions / orders / order_items → ลูกค้าเข้าถึงได้เฉพาะผ่านฟังก์ชันด้านล่าง
alter table orders enable row level security;
alter table order_items enable row level security;

-- ลูกค้าอ่านเมนูได้อย่างเดียว; ไม่มี policy insert/update บน orders → ต้องสั่งผ่าน place_order เท่านั้น
create policy "public read products" on products for select using (true);

-- คิดราคาจากตาราง products ฝั่งเซิร์ฟเวอร์ ไม่เชื่อราคาจาก client
create or replace function place_order(
  p_request_id uuid,
  p_table_session_id uuid,
  p_items jsonb
) returns table (order_id uuid, total_amount numeric)
language plpgsql security definer set search_path = public as $$
declare
  v_order orders%rowtype;
  v_total numeric := 0;
  v_item jsonb;
  v_prod products%rowtype;
  v_qty int;
begin
  select * into v_order from orders where request_id = p_request_id;
  if found then
    return query select v_order.id, v_order.total_amount;
    return;
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ORDER';
  end if;

  if p_table_session_id is null then
    raise exception 'SESSION_REQUIRED';
  end if;

  if not exists (
    select 1 from table_sessions
    where id = p_table_session_id and closed_at is null and expires_at > now()
  ) then
    raise exception 'SESSION_CLOSED';
  end if;

  -- กันยิงออเดอร์ถี่ผิดปกติ: ไม่เกิน 10 ออเดอร์/นาที/session
  if (select count(*) from orders
      where table_session_id = p_table_session_id
        and created_at > now() - interval '1 minute') >= 10 then
    raise exception 'RATE_LIMITED';
  end if;

  insert into orders (request_id, table_session_id, total_amount)
  values (p_request_id, p_table_session_id, 0)
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    select * into v_prod from products where id = (v_item->>'product_id')::uuid;
    if not found or not v_prod.is_available or v_qty < 1 then
      raise exception 'PRODUCT_UNAVAILABLE';
    end if;
    insert into order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
    values (v_order.id, v_prod.id, v_prod.name, v_qty, v_prod.price, v_prod.price * v_qty);
    v_total := v_total + v_prod.price * v_qty;
  end loop;

  update orders set total_amount = v_total where id = v_order.id;
  return query select v_order.id, v_total;
end $$;

grant execute on function place_order(uuid, uuid, jsonb) to anon, authenticated;

-- ให้ฝั่งร้านรับออเดอร์ใหม่แบบ realtime
alter publication supabase_realtime add table orders;

-- สแกน QR: แลก token เป็น session (ใช้ session เดิมของโต๊ะถ้ายังเปิดอยู่)
create or replace function open_table_session(p_token text)
returns table (session_id uuid, table_label text)
language plpgsql security definer set search_path = public as $$
declare
  v_table tables%rowtype;
  v_session table_sessions%rowtype;
begin
  select * into v_table from tables where token = p_token and is_enabled;
  if not found then raise exception 'INVALID_TOKEN'; end if;

  -- ปิด session ที่หมดอายุแล้วของโต๊ะนี้ก่อน
  update table_sessions set closed_at = now()
  where table_id = v_table.id and closed_at is null and expires_at <= now();

  select * into v_session from table_sessions
  where table_id = v_table.id and closed_at is null;
  if not found then
    insert into table_sessions (table_id) values (v_table.id) returning * into v_session;
  end if;
  return query select v_session.id, v_table.label;
end $$;

-- ตรวจ session ที่เก็บไว้ในเครื่องลูกค้า: คืนเลขโต๊ะถ้ายังเปิดอยู่ ไม่งั้นคืน null
create or replace function get_session_info(p_session_id uuid)
returns text language sql security definer set search_path = public stable as $$
  select t.label from table_sessions s join tables t on t.id = s.table_id
  where s.id = p_session_id and s.closed_at is null and s.expires_at > now();
$$;

-- พนักงานปิดโต๊ะตอนเช็กบิล (เรียกจากฝั่งร้านที่ล็อกอินแล้วเท่านั้น)
create or replace function close_table_session(p_table_id uuid)
returns void language sql security definer set search_path = public as $$
  update table_sessions set closed_at = now()
  where table_id = p_table_id and closed_at is null and is_staff();
$$;

revoke all on function open_table_session(text), get_session_info(uuid), close_table_session(uuid) from public;
grant execute on function open_table_session(text), get_session_info(uuid) to anon, authenticated;
grant execute on function close_table_session(uuid) to authenticated;


-- ===================== ฝั่งร้านค้า (apps/staff) =====================
-- พนักงาน = ผู้ใช้ Supabase Auth ที่อยู่ในตารางนี้ (เพิ่มด้วยมือ/SQL โดยเจ้าของร้าน)
create table if not exists staff_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table staff_users enable row level security;

create or replace function is_staff()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from staff_users where user_id = auth.uid());
$$;
grant execute on function is_staff() to anon, authenticated;

-- policy เฉพาะพนักงาน (ลูกค้าเป็น anon จึงไม่ผ่านเงื่อนไข is_staff())
create policy "staff read orders" on orders for select to authenticated using (is_staff());
create policy "staff update order status" on orders for update to authenticated
  using (is_staff()) with check (is_staff());
create policy "staff read order_items" on order_items for select to authenticated using (is_staff());
create policy "staff read tables" on tables for select to authenticated using (is_staff());
create policy "staff read sessions" on table_sessions for select to authenticated using (is_staff());
create policy "staff update products" on products for update to authenticated
  using (is_staff()) with check (is_staff());

-- พนักงานเปลี่ยนได้แค่สถานะ (ไม่ให้แก้ยอดเงิน/โต๊ะ)
revoke update on orders from authenticated;
grant update (status) on orders to authenticated;

-- เพิ่มพนักงานคนแรก (แทน <user-uuid> ด้วย id จากหน้า Authentication):
--   insert into staff_users(user_id) values ('<user-uuid>');
