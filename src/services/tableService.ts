import { supabase } from './supabaseClient'

export interface TableSession {
  sessionId: string
  label: string
}

export class InvalidTableError extends Error {}

/** สแกน QR → แลก token เป็น session จากเซิร์ฟเวอร์ (เลขโต๊ะมาจากฐานข้อมูลเท่านั้น) */
export async function openTableSession(token: string): Promise<TableSession> {
  if (!supabase) {
    // mock mode: token รูปแบบ "mock-5" → โต๊ะ 5
    const label = token.replace(/^\D*/, '') || token
    return { sessionId: `mock-session-${label}`, label }
  }
  const { data, error } = await supabase.rpc('open_table_session', { p_token: token })
  if (error) {
    if (error.message.includes('INVALID_TOKEN')) throw new InvalidTableError()
    throw error
  }
  const row = Array.isArray(data) ? data[0] : data
  return { sessionId: row.session_id, label: row.table_label }
}

/** คืนเลขโต๊ะถ้า session ยังเปิดอยู่, null ถ้าปิด/หมดอายุแล้ว (error เครือข่ายจะ throw) */
export async function fetchSessionLabel(sessionId: string, cached: string): Promise<string | null> {
  if (!supabase) return cached
  const { data, error } = await supabase.rpc('get_session_info', { p_session_id: sessionId })
  if (error) throw error
  return (data as string | null) ?? null
}
