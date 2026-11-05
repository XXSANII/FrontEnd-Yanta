import { ApiError, mapOrder, ORDER_STATUS_LABEL, type Order, type OrderDto } from '@yanta/shared'
import type { SubmitOrderInput, SubmitOrderResult } from '../types'
import { api } from './apiClient'

export class OrderError extends Error {
  constructor(message: string, readonly sessionInvalid = false) {
    super(message)
  }
}

/**
 * ส่งคำสั่งซื้อ — ราคา/สถานะสินค้าถูกตรวจซ้ำฝั่งเซิร์ฟเวอร์ (POST /api/customer/orders)
 * Backend กันซ้ำด้วยการ disable ปุ่มระหว่างส่ง
 */
export async function submitOrder(input: SubmitOrderInput): Promise<SubmitOrderResult> {
  if (input.lines.length === 0) throw new OrderError('ตะกร้าว่างเปล่า')

  if (!input.sessionToken) throw new OrderError(messageFor('SESSION_REQUIRED'), true)

  try {
    const o = await api<OrderDto>('/api/customer/orders', {
      method: 'POST',
      sessionToken: input.sessionToken,
      body: {
        items: input.lines.map((l) => ({
          productId: l.product.id,
          quantity: l.quantity,
          optionIds: l.options.map((o) => o.id),
          note: l.note.trim() || undefined,
        })),
      },
    })
    return { orderId: `#${o.orderNumber}`, totalAmount: Number(o.totalAmount) }
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 401) throw new OrderError(messageFor('SESSION_REQUIRED'), true)
      // 409: โต๊ะปิดแล้ว (session ใช้ไม่ได้) หรือตัวเลือก/เมนูไม่พร้อมขาย (แสดงข้อความจาก Backend ตรงๆ)
      if (e.status === 409) throw new OrderError(e.message, e.message.includes('โต๊ะ') && e.message.includes('ปิดแล้ว'))
      if (e.status === 400) throw new OrderError(e.message)
    }
    throw e
  }
}

// ---------- ประวัติออเดอร์ของโต๊ะ / เช็คบิล ----------

export interface MyBill {
  billRequested: boolean
  total: number
  unpaid: number
}

export async function fetchMyOrders(sessionToken: string): Promise<Order[]> {
  try {
    return (await api<OrderDto[]>('/api/customer/orders', { sessionToken })).map(mapOrder)
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) throw new OrderError(messageFor('SESSION_CLOSED'), true)
    throw e
  }
}

export async function fetchMyBill(sessionToken: string): Promise<MyBill> {
  const s = await api<{ billRequestedAt: string | null; totalAmount: number; unpaidAmount: number }>(
    '/api/customer/session', { sessionToken })
  return { billRequested: s.billRequestedAt !== null, total: Number(s.totalAmount), unpaid: Number(s.unpaidAmount) }
}

export async function requestBill(sessionToken: string): Promise<void> {
  try {
    await api('/api/customer/bill-request', { method: 'POST', sessionToken })
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) throw new OrderError(messageFor('SESSION_CLOSED'), true)
    throw e
  }
}

export const statusLabel = ORDER_STATUS_LABEL

function messageFor(raw: string) {
  if (raw.includes('SESSION_CLOSED')) return 'โต๊ะนี้ปิดการสั่งอาหารแล้ว กรุณาสแกน QR ที่โต๊ะใหม่อีกครั้ง'
  if (raw.includes('SESSION_REQUIRED')) return 'กรุณาสแกน QR ที่โต๊ะก่อนสั่งอาหาร'
  return 'ไม่สามารถส่งคำสั่งซื้อได้'
}
