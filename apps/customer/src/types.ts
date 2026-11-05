import type { Product } from '@yanta/shared'

export type { Category, CategoryId, Product } from '@yanta/shared'

export interface CartOption {
  id: string
  group_name: string
  name: string
  price_delta: number
}

export interface CartLine {
  /** lineKey(productId, optionIds, note) — เมนู+ตัวเลือก+หมายเหตุเดียวกัน = บรรทัดเดียวกัน */
  key: string
  product: Product
  quantity: number
  options: CartOption[]
  note: string
  /** เหตุผลที่บรรทัดนี้ใช้สั่งไม่ได้ (ตั้งโดย syncLines; ไม่มี = บรรทัดปกติ) */
  invalidReason?: 'product' | 'option' | 'required'
}

export interface SubmitOrderInput {
  lines: CartLine[]
  tableSessionId: string | null
  /** token จากการสแกน QR (header X-Session-Token) */
  sessionToken: string | null
  requestId: string
}

export interface SubmitOrderResult {
  orderId: string
  totalAmount: number
}
