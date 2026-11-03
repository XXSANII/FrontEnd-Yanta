import { useEffect, useState } from 'react'
import { fetchTableLabel } from '../services/tableService'

const ID_KEY = 'table_session_id'
const LABEL_KEY = 'table_label'

/**
 * อ่านรหัสเซสชันโต๊ะจาก QR (?session=...) และเลขโต๊ะ (?table=...)
 * แล้วเก็บไว้ใน sessionStorage — ไม่มีค่า = สั่งแบบไม่ผูกโต๊ะ
 */
export function getTableSessionId(): string | null {
  try {
    const q = new URLSearchParams(window.location.search)
    const id = q.get('session')
    const table = q.get('table')
    if (id) {
      sessionStorage.setItem(ID_KEY, id)
      sessionStorage.removeItem(LABEL_KEY) // สแกนโต๊ะใหม่ → ล้างเลขโต๊ะเก่า
    }
    if (table) sessionStorage.setItem(LABEL_KEY, table)
    return sessionStorage.getItem(ID_KEY)
  } catch {
    return null
  }
}

const storedLabel = () => {
  try { return sessionStorage.getItem(LABEL_KEY) } catch { return null }
}

export function useTableSession() {
  const sessionId = getTableSessionId()
  const [tableLabel, setTableLabel] = useState<string | null>(storedLabel)

  useEffect(() => {
    if (!sessionId || tableLabel) return
    fetchTableLabel(sessionId).then((label) => {
      if (!label) return
      setTableLabel(label)
      try { sessionStorage.setItem(LABEL_KEY, label) } catch { /* ignore */ }
    })
  }, [sessionId, tableLabel])

  return { sessionId, tableLabel }
}
