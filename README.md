# Yanta — ระบบสั่งอาหาร (monorepo)

```text
apps/customer    หน้าลูกค้า (สแกน QR → สั่งอาหาร)          :5173
apps/staff       หลังร้าน (ออเดอร์ realtime, โต๊ะ/QR, เมนู)  :5174
packages/shared  types / formatBaht / Supabase client ที่ใช้ร่วมกัน
supabase/        schema.sql (ตาราง, RLS, RPC)
```

```bash
npm install
npm run dev:customer     # หรือ dev:staff
npm run build            # build ทั้งสองแอป
```

## Mock mode
ไม่ตั้ง `.env` = ใช้ข้อมูลตัวอย่าง ไม่ต้องมี Supabase
- ลูกค้า: เปิด `/t/mock-5` จะได้โต๊ะ 5
- หลังร้าน: ล็อกอินอะไรก็ได้

## ใช้ Supabase จริง
1. รัน `supabase/schema.sql` ใน SQL editor
2. ใส่โต๊ะ: `insert into tables(label) values ('1'),('2');`
3. สร้างผู้ใช้พนักงานใน Authentication แล้ว `insert into staff_users(user_id) values ('<uuid>');`
4. ใส่ `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` ใน `.env` ของแต่ละแอป (ดู `.env.example`);
   `apps/staff/.env` ตั้ง `VITE_CUSTOMER_URL` เป็นโดเมนหน้าลูกค้าสำหรับสร้าง QR

## ความปลอดภัยโดยย่อ
- QR เก็บ token สุ่มประจำโต๊ะ → `open_table_session` แลกเป็น session; เลขโต๊ะมาจากเซิร์ฟเวอร์เท่านั้น
- ลูกค้า (anon) เขียนตารางไม่ได้ ต้องสั่งผ่าน `place_order` (คิดราคาฝั่งเซิร์ฟเวอร์, idempotent, rate limit)
- พนักงานต้องอยู่ใน `staff_users` และแก้ได้เฉพาะคอลัมน์ `status` ของออเดอร์
