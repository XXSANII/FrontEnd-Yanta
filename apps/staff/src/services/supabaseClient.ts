import { createSupabase } from '@yanta/shared'

/** ใช้ล็อกอินพนักงาน (Supabase Auth) และอัปโหลดรูปเมนูเท่านั้น — ข้อมูลอื่นเรียกผ่าน Backend */
export const supabase = createSupabase(
  import.meta.env.VITE_SUPABASE_URL as string | undefined,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
)
export const CUSTOMER_URL = (import.meta.env.VITE_CUSTOMER_URL as string) || 'http://localhost:5173'
