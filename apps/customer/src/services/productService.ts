import { MOCK_PRODUCTS } from '../data/mockProducts'
import type { Product } from '../types'
import { supabase } from './supabaseClient'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function fetchProducts(): Promise<Product[]> {
  if (!supabase) {
    await delay(300)
    return MOCK_PRODUCTS
  }
  const { data, error } = await supabase
    .from('products')
    .select('id, category, name, description, price, image_url, is_available')
    .order('name')
  if (error) throw error
  return (data ?? []).map((r) => ({ ...r, price: Number(r.price) })) as Product[]
}

export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return []
  if (!supabase) return MOCK_PRODUCTS.filter((p) => ids.includes(p.id))
  const { data, error } = await supabase
    .from('products')
    .select('id, category, name, description, price, image_url, is_available')
    .in('id', ids)
  if (error) throw error
  return (data ?? []).map((r) => ({ ...r, price: Number(r.price) })) as Product[]
}
