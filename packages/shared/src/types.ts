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

export type OrderStatus = 'pending' | 'preparing' | 'served' | 'cancelled'

export interface OrderItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface Order {
  id: string
  status: OrderStatus
  total_amount: number
  created_at: string
  table_label: string | null
  items: OrderItem[]
}
