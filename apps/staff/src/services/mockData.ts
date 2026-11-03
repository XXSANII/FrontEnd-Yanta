import type { Order, Product } from '@yanta/shared'

export interface StaffTable {
  id: string
  label: string
  token: string
  hasOpenSession: boolean
}

const ago = (m: number) => new Date(Date.now() - m * 60000).toISOString()

export const mockOrders: Order[] = [
  {
    id: 'MOCK-0001', status: 'pending', total_amount: 150, created_at: ago(2), table_label: '5',
    items: [
      { id: 'i1', product_id: 'c1', product_name: 'ข้าวต้มหมูสับ', quantity: 2, unit_price: 50, subtotal: 100 },
      { id: 'i2', product_id: 'm1', product_name: 'ชาไทยเย็น', quantity: 1, unit_price: 40, subtotal: 40 },
    ],
  },
  {
    id: 'MOCK-0002', status: 'preparing', total_amount: 110, created_at: ago(9), table_label: '2',
    items: [{ id: 'i3', product_id: 'k4', product_name: 'ลาเต้', quantity: 1, unit_price: 60, subtotal: 60 },
            { id: 'i4', product_id: 'b3', product_name: 'ขนมจีบหมู', quantity: 1, unit_price: 45, subtotal: 45 }],
  },
]
mockOrders[1].total_amount = 105

export const mockTables: StaffTable[] = ['1', '2', '3', '4', '5'].map((l) => ({
  id: `t${l}`, label: l, token: `mock-${l}`, hasOpenSession: l === '2' || l === '5',
}))

export const mockProducts: Product[] = [
  { id: 'c1', category: 'congee', name: 'ข้าวต้มหมูสับ', description: null, price: 50, image_url: null, is_available: true },
  { id: 'c3', category: 'congee', name: 'ข้าวต้มกุ้ง', description: null, price: 70, image_url: null, is_available: true },
  { id: 'b3', category: 'breakfast', name: 'ขนมจีบหมู', description: null, price: 45, image_url: null, is_available: true },
  { id: 'm1', category: 'milk-tea', name: 'ชาไทยเย็น', description: null, price: 40, image_url: null, is_available: true },
  { id: 'k4', category: 'coffee', name: 'ลาเต้', description: null, price: 60, image_url: null, is_available: false },
]
