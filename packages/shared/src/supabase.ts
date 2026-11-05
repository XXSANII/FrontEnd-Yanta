import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** คืน null เมื่อไม่ได้ตั้งค่า env → ไม่ใช้ Supabase (ล็อกอิน/อัปโหลดรูปจะใช้ไม่ได้) */
export function createSupabase(url?: string, key?: string): SupabaseClient | null {
  return url && key ? createClient(url, key) : null
}
