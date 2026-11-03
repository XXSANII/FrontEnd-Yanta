import { supabase } from './supabaseClient'

/** ดึงหมายเลขโต๊ะจาก table_session (ผ่าน RPC เพราะลูกค้าอ่านตารางตรงๆ ไม่ได้) */
export async function fetchTableLabel(sessionId: string): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('get_table_label', { p_session_id: sessionId })
  if (error) return null
  return (data as string | null) ?? null
}
