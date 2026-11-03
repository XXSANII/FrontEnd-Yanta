import { MOCK_PRODUCTS } from '../data/mockProducts'
import type { SubmitOrderInput, SubmitOrderResult } from '../types'
import { cartTotal } from '../utils/calculateTotal'
import { supabase } from './supabaseClient'

export class OrderError extends Error {
  constructor(message: string, readonly sessionInvalid = false) {
    super(message)
  }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * ส่งคำสั่งซื้อ — ราคา/สถานะสินค้าถูกตรวจซ้ำฝั่งเซิร์ฟเวอร์ (RPC place_order)
 * request_id ใช้ป้องกันออเดอร์ซ้ำเมื่อกดยืนยันซ้ำหรือ retry
 */
export async function submitOrder(input: SubmitOrderInput): Promise<SubmitOrderResult> {
  if (input.lines.length === 0) throw new OrderError('ตะกร้าว่างเปล่า')

  if (!supabase) return mockSubmit(input)

  const { data, error } = await supabase.rpc('place_order', {
    p_request_id: input.requestId,
    p_table_session_id: input.tableSessionId,
    p_items: input.lines.map((l) => ({
      product_id: l.product.id,
      quantity: l.quantity,
    })),
  })
  if (error) {
    const known = ['SESSION_CLOSED', 'SESSION_REQUIRED', 'RATE_LIMITED', 'PRODUCT_UNAVAILABLE', 'EMPTY_ORDER']
    if (known.some((k) => error.message.includes(k))) {
      throw new OrderError(
        messageFor(error.message),
        /SESSION_(CLOSED|REQUIRED)/.test(error.message),
      )
    }
    throw error
  }
  const row = Array.isArray(data) ? data[0] : data
  return { orderId: row.order_id, totalAmount: Number(row.total_amount) }
}

function messageFor(raw: string) {
  if (raw.includes('SESSION_CLOSED')) return 'โต๊ะนี้ปิดการสั่งอาหารแล้ว กรุณาสแกน QR ที่โต๊ะใหม่อีกครั้ง'
  if (raw.includes('SESSION_REQUIRED')) return 'กรุณาสแกน QR ที่โต๊ะก่อนสั่งอาหาร'
  if (raw.includes('RATE_LIMITED')) return 'สั่งถี่เกินไป กรุณารอสักครู่แล้วลองอีกครั้ง'
  if (raw.includes('PRODUCT_UNAVAILABLE')) return 'มีสินค้าบางรายการหมดหรือไม่พร้อมจำหน่าย กรุณาตรวจสอบตะกร้า'
  return 'ไม่สามารถส่งคำสั่งซื้อได้'
}

// ---- mock mode: เก็บออเดอร์ใน localStorage แทนฐานข้อมูล ----
const MOCK_KEY = 'mock_orders'
interface MockOrder { request_id: string; id: string; total: number }

async function mockSubmit(input: SubmitOrderInput): Promise<SubmitOrderResult> {
  await delay(900)
  const orders: MockOrder[] = JSON.parse(localStorage.getItem(MOCK_KEY) ?? '[]')
  const dup = orders.find((o) => o.request_id === input.requestId)
  if (dup) return { orderId: dup.id, totalAmount: dup.total }

  for (const l of input.lines) {
    const real = MOCK_PRODUCTS.find((p) => p.id === l.product.id)
    if (!real || !real.is_available) throw new OrderError(messageFor('PRODUCT_UNAVAILABLE'))
  }
  // คิดราคาจากแคตตาล็อก ไม่ใช่ราคาที่ส่งมาจากตะกร้า
  const total = cartTotal(
    input.lines.map((l) => ({
      ...l,
      product: MOCK_PRODUCTS.find((p) => p.id === l.product.id)!,
    })),
  )
  const id = `MOCK-${String(orders.length + 1).padStart(4, '0')}`
  orders.push({ request_id: input.requestId, id, total })
  localStorage.setItem(MOCK_KEY, JSON.stringify(orders))
  return { orderId: id, totalAmount: total }
}
