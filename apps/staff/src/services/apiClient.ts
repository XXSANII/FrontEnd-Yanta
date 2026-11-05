import { createApi, type ApiOptions } from '@yanta/shared'
import { supabase } from './supabaseClient'

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || '/'
const base = createApi(API_URL)

/** เรียก Backend พร้อมแนบ access_token ของพนักงาน (Supabase ต่ออายุให้อัตโนมัติ) */
export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { data } = (await supabase?.auth.getSession()) ?? { data: null }
  return base<T>(path, { ...options, token: data?.session?.access_token })
}
