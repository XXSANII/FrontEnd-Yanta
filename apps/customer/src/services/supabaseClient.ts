import { createSupabase } from '@yanta/shared'

export const supabase = createSupabase(
  import.meta.env.VITE_SUPABASE_URL as string | undefined,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
)
export const isMockMode = supabase === null
