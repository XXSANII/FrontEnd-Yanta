# Customer Frontend (React + TypeScript + Supabase)

```bash
npm install
npm run dev
```

- ไม่ตั้งค่า `.env` = **mock mode** (เมนูตัวอย่าง, ออเดอร์เก็บใน localStorage)
- ใช้ Supabase: ใส่ `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` ใน `.env` และรัน `supabase/schema.sql`
- QR ประจำโต๊ะ: พิมพ์ลิงก์ `https://<โดเมน>/t/<token>` (token จากตาราง `tables`) — mock mode ลอง `/t/mock-5`
- เลขโต๊ะมาจากเซิร์ฟเวอร์เท่านั้น (`open_table_session`), session ปิดเมื่อพนักงานเรียก `close_table_session` หรือหมดอายุ 4 ชม.
- ราคา/สถานะสินค้าถูกตรวจซ้ำที่หน้าตรวจสอบรายการ และคิดราคาใหม่ในฟังก์ชัน `place_order` ฝั่งเซิร์ฟเวอร์
- กดยืนยันซ้ำปลอดภัย: ใช้ `request_id` (idempotency) ตัวเดียวกันทุกครั้งที่ retry
