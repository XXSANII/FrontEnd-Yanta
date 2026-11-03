import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { isMockMode, supabase } from '../services/supabaseClient'

interface Value {
  loading: boolean
  signedIn: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const Ctx = createContext<Value | null>(null)

/** ตรวจว่าผู้ใช้ที่ล็อกอินอยู่ในตาราง staff_users จริง (ฝั่งเซิร์ฟเวอร์) */
async function isStaff(): Promise<boolean> {
  const { data, error } = await supabase!.rpc('is_staff')
  return !error && data === true
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(!isMockMode)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(async ({ data }) => {
      setSignedIn(!!data.session && (await isStaff()))
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) setSignedIn(false)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signIn: Value['signIn'] = async (email, password) => {
    if (!supabase) {
      setSignedIn(true)
      return null
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
    if (!(await isStaff())) {
      await supabase.auth.signOut()
      return 'บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานฝั่งร้าน'
    }
    setSignedIn(true)
    return null
  }

  const signOut = async () => {
    await supabase?.auth.signOut()
    setSignedIn(false)
  }

  return <Ctx.Provider value={{ loading, signedIn, signIn, signOut }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}
