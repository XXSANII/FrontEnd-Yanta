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

create table if not exists table_sessions (
  id uuid primary key default gen_random_uuid(),
  table_label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,            -- idempotency key
  table_session_id uuid references table_sessions(id),
  status text not null default 'pending',
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
alter table table_sessions enable row level security;
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

  if p_table_session_id is not null and not exists (
    select 1 from table_sessions where id = p_table_session_id and is_active
  ) then
    raise exception 'SESSION_CLOSED';
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

-- คืนหมายเลขโต๊ะของเซสชันที่ยังเปิดอยู่ (ใช้แสดงผลหลังสแกน QR)
create or replace function get_table_label(p_session_id uuid)
returns text language sql security definer set search_path = public stable as $$
  select table_label from table_sessions where id = p_session_id and is_active;
$$;
grant execute on function get_table_label(uuid) to anon, authenticated;
