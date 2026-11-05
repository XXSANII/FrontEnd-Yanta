import { ApiError } from '@yanta/shared'
import { api } from './apiClient'

export interface TableSession {
  sessionId: string
  label: string
  /** ส่งใน header X-Session-Token ทุกครั้งที่เรียก API ฝั่งลูกค้า */
  token: string
}

export class InvalidTableError extends Error {}

interface ScanResponse {
  sessionToken: string
  sessionId: string
  tableNumber: string
}

/** สแกน QR → แลก qrToken เป็น session token จากเซิร์ฟเวอร์ (เลขโต๊ะมาจากฐานข้อมูลเท่านั้น) */
export async function openTableSession(qrToken: string): Promise<TableSession> {
  if (!api) {
    // mock mode: token รูปแบบ "mock-5" → โต๊ะ 5
    const label = qrToken.replace(/^\D*/, '') || qrToken
    return { sessionId: `mock-session-${label}`, label, token: 'mock' }
  }
  try {
    const r = await api<ScanResponse>('/api/customer/scan', { method: 'POST', body: { qrToken } })
    return { sessionId: r.sessionId, label: r.tableNumber, token: r.sessionToken }
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 400)) throw new InvalidTableError()
    throw e
  }
}

/** คืนเลขโต๊ะถ้า session ยังเปิดอยู่, null ถ้าปิด/หมดอายุแล้ว (error เครือข่ายจะ throw) */
export async function fetchSessionLabel(session: TableSession): Promise<string | null> {
  if (!api) return session.label
  try {
    const r = await api<{ tableNumber: string }>('/api/customer/session', { sessionToken: session.token })
    return r.tableNumber
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null
    throw e
  }
}
