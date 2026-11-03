import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** คืน null เมื่อไม่ได้ตั้งค่า env → แอปเข้าสู่ mock mode */
export function createSupabase(url?: string, key?: string): SupabaseClient | null {
  return url && key ? createClient(url, key) : null
}
