import type { Product } from '@yanta/shared'

export type { Category, CategoryId, Product } from '@yanta/shared'

export interface CartLine {
  product: Product
  quantity: number
}

export interface SubmitOrderInput {
  lines: CartLine[]
  tableSessionId: string | null
  requestId: string
}

export interface SubmitOrderResult {
  orderId: string
  totalAmount: number
}
