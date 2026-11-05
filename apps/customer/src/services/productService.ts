import { MOCK_CATEGORIES, mapCategory, mapProduct, type CategoryDto, type ProductDto } from '@yanta/shared'
import { MOCK_PRODUCTS } from '../data/mockProducts'
import type { Category, Product } from '../types'
import { api } from './apiClient'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function fetchCategories(): Promise<Category[]> {
  if (!api) return MOCK_CATEGORIES
  return (await api<CategoryDto[]>('/api/categories')).map(mapCategory)
}

/** เมนูที่พร้อมขายเท่านั้น (Backend ซ่อนเมนูที่ปิดขาย) */
export async function fetchProducts(): Promise<Product[]> {
  if (!api) {
    await delay(300)
    return MOCK_PRODUCTS
  }
  return (await api<ProductDto[]>('/api/products')).map(mapProduct)
}

/** เมนูที่ไม่อยู่ในผลลัพธ์ = ถูกปิดขายหรือถูกลบแล้ว (หน้าตรวจรายการจะแจ้งลูกค้า) */
export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return []
  const all = await fetchProducts()
  return all.filter((p) => ids.includes(p.id))
}
