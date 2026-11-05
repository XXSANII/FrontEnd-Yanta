import { mapCategory, mapProduct, type CategoryDto, type ProductDto } from '@yanta/shared'
import type { Category, Product } from '../types'
import { api } from './apiClient'

export async function fetchCategories(): Promise<Category[]> {
  return (await api<CategoryDto[]>('/api/categories')).map(mapCategory)
}

/** เมนูที่พร้อมขายเท่านั้น (Backend ซ่อนเมนูที่ปิดขาย) */
export async function fetchProducts(): Promise<Product[]> {
  return (await api<ProductDto[]>('/api/products')).map(mapProduct)
}

/** เมนูที่ไม่อยู่ในผลลัพธ์ = ถูกปิดขายหรือถูกลบแล้ว (หน้าตรวจรายการจะแจ้งลูกค้า) */
export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return []
  const all = await fetchProducts()
  return all.filter((p) => ids.includes(p.id))
}
