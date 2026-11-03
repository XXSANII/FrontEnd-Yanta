export type CategoryId = 'congee' | 'breakfast' | 'milk-tea' | 'coffee'

export interface Category {
  id: CategoryId
  name: string
}

export interface Product {
  id: string
  category: CategoryId
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
}

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
