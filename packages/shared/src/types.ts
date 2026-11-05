/** id ของหมวดหมู่ (uuid จาก Backend) */
export type CategoryId = string

export interface Category {
  id: CategoryId
  name: string
}

export type OptionKind = 'addon' | 'remove' | 'single'

export interface ProductOption {
  id: string
  name: string
  price_delta: number
  is_available: boolean
}

export interface OptionGroup {
  id: string
  name: string
  kind: OptionKind
  is_required: boolean
  options: ProductOption[]
}

export interface Product {
  id: string
  category: CategoryId
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
  option_groups: OptionGroup[]
}

/** pending -> complete -> paid (หรือ cancelled) */
export type OrderStatus = 'pending' | 'complete' | 'paid' | 'cancelled'

/** ตัวเลือกที่ลูกค้าเลือกในบรรทัดออเดอร์ (snapshot ตอนสั่ง) */
export interface OrderItemOption {
  group_name: string
  name: string
  price_delta: number
}

export interface OrderItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
  status: 'active' | 'cancelled'
  options: OrderItemOption[]
  note: string | null
}

export interface Order {
  id: string
  order_number: number
  status: OrderStatus
  total_amount: number
  created_at: string
  table_label: string | null
  session_id: string | null
  note: string | null
  items: OrderItem[]
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'รอดำเนินการ',
  complete: 'ทำเสร็จแล้ว',
  paid: 'ชำระเงินแล้ว',
  cancelled: 'ยกเลิก',
}
