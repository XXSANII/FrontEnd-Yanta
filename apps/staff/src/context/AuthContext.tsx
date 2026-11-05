import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { ApiError } from '@yanta/shared'
import { fetchMe, type Me } from '../services/staffService'
import { supabase } from '../services/supabaseClient'

interface Value {
  loading: boolean
  signedIn: boolean
  me: Me | null
  can: (permission: string) => boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const Ctx = createContext<Value | null>(null)

/** ถามสิทธิ์จาก Backend: คืน null ถ้าไม่ใช่พนักงาน (403) */
async function loadMe(): Promise<Me | null> {
  try {
    return await fetchMe()
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return null
    throw e
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState<Me | null>(null)

  useEffect(() => {
    if (!supabase) return setLoading(false)
    supabase.auth.getSession()
      .then(async ({ data }) => setMe(data.session ? await loadMe() : null))
      .catch(() => setMe(null))
      .finally(() => setLoading(false))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) setMe(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signIn: Value['signIn'] = async (email, password) => {
    if (!supabase) return 'ยังไม่ได้ตั้งค่า Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)'
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
    try {
      const profile = await loadMe()
      if (!profile) {
        await supabase.auth.signOut()
        return 'บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานฝั่งร้าน'
      }
      setMe(profile)
      return null
    } catch {
      await supabase.auth.signOut()
      return 'เชื่อมต่อ Backend ไม่ได้ กรุณาตรวจสอบว่าเปิด YantaBackEnd อยู่'
    }
  }

  const signOut = async () => {
    await supabase?.auth.signOut()
    setMe(null)
  }

  const can = (permission: string) => !!me && (me.isAdmin || me.permissions.includes(permission))

  return <Ctx.Provider value={{ loading, signedIn: !!me, me, can, signIn, signOut }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}
