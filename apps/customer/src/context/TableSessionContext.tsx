import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchSessionLabel, type TableSession } from '../services/tableService'
import { isMockMode } from '../services/apiClient'

const KEY = 'table_session_v3'

interface Value {
  session: TableSession | null
  /** กำลังตรวจ session ที่เก็บไว้กับเซิร์ฟเวอร์ */
  checking: boolean
  /** ใน production ต้องมี session ที่เปิดอยู่ถึงสั่งได้ */
  canOrder: boolean
  setSession: (s: TableSession) => void
  clearSession: () => void
}

const Ctx = createContext<Value | null>(null)

function load(): TableSession | null {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    return raw?.sessionId && raw?.label && raw?.token ? raw : null
  } catch {
    return null
  }
}

export function TableSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<TableSession | null>(load)
  const [checking, setChecking] = useState(() => load() !== null)

  const setSession = useCallback((s: TableSession) => {
    localStorage.setItem(KEY, JSON.stringify(s))
    setSessionState(s)
  }, [])
  const clearSession = useCallback(() => {
    localStorage.removeItem(KEY)
    setSessionState(null)
  }, [])

  // เปิดแอปซ้ำ/รีเฟรช: ตรวจว่า session ยังเปิดอยู่ และใช้เลขโต๊ะจากเซิร์ฟเวอร์
  useEffect(() => {
    const saved = load()
    if (!saved) return
    fetchSessionLabel(saved)
      .then((label) => (label ? setSession({ ...saved, label }) : clearSession()))
      .catch(() => { /* ออฟไลน์: คงค่าเดิม ตัวตัดสินจริงคือตอนส่งออเดอร์ */ })
      .finally(() => setChecking(false))
  }, [setSession, clearSession])

  const value = useMemo<Value>(
    () => ({ session, checking, canOrder: isMockMode || session !== null, setSession, clearSession }),
    [session, checking, setSession, clearSession],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTableSession() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useTableSession must be used within TableSessionProvider')
  return v
}
