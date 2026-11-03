import type { CategoryId, Order, OrderStatus, Product } from '@yanta/shared'
import { mockOrders, mockProducts, mockTables, type StaffTable } from './mockData'
import { supabase } from './supabaseClient'

export type { StaffTable }

// ---------- orders ----------
export async function fetchOrders(): Promise<Order[]> {
  if (!supabase) return [...mockOrders].sort((a, b) => b.created_at.localeCompare(a.created_at))
  const { data, error } = await supabase
    .from('orders')
    .select('id, status, total_amount, created_at, order_items(*), table_sessions(tables(label))')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return (data ?? []).map((r: any) => ({
    id: r.id,
    status: r.status,
    total_amount: Number(r.total_amount),
    created_at: r.created_at,
    table_label: r.table_sessions?.tables?.label ?? null,
    items: (r.order_items ?? []).map((i: any) => ({
      ...i,
      unit_price: Number(i.unit_price),
      subtotal: Number(i.subtotal),
    })),
  }))
}

/** แจ้งเมื่อมีออเดอร์ใหม่/เปลี่ยนสถานะ (Supabase Realtime) คืนฟังก์ชันยกเลิก */
export function subscribeOrders(onChange: () => void): () => void {
  if (!supabase) return () => {}
  const channel = supabase
    .channel('orders-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onChange)
    .subscribe()
  return () => { supabase!.removeChannel(channel) }
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  if (!supabase) {
    const o = mockOrders.find((x) => x.id === id)
    if (o) o.status = status
    return
  }
  const { error } = await supabase.from('orders').update({ status }).eq('id', id)
  if (error) throw error
}

// ---------- tables ----------
export async function fetchTables(): Promise<StaffTable[]> {
  if (!supabase) return mockTables.map((t) => ({ ...t }))
  const { data, error } = await supabase
    .from('tables')
    .select('id, label, token, table_sessions(closed_at, expires_at)')
    .eq('is_enabled', true)
    .order('label')
  if (error) throw error
  const now = Date.now()
  return (data ?? []).map((t: any) => ({
    id: t.id,
    label: t.label,
    token: t.token,
    hasOpenSession: (t.table_sessions ?? []).some(
      (s: any) => !s.closed_at && new Date(s.expires_at).getTime() > now,
    ),
  }))
}

export async function closeTable(tableId: string): Promise<void> {
  if (!supabase) {
    const t = mockTables.find((x) => x.id === tableId)
    if (t) t.hasOpenSession = false
    return
  }
  const { error } = await supabase.rpc('close_table_session', { p_table_id: tableId })
  if (error) throw error
}

// ---------- menu ----------
export async function fetchProducts(): Promise<Product[]> {
  if (!supabase) return mockProducts.map((p) => ({ ...p }))
  const { data, error } = await supabase
    .from('products')
    .select('id, category, name, description, price, image_url, is_available')
    .order('name')
  if (error) throw error
  return (data ?? []).map((r) => ({ ...r, price: Number(r.price) })) as Product[]
}

export async function setAvailability(id: string, is_available: boolean): Promise<void> {
  if (!supabase) {
    const p = mockProducts.find((x) => x.id === id)
    if (p) p.is_available = is_available
    return
  }
  const { error } = await supabase.from('products').update({ is_available }).eq('id', id)
  if (error) throw error
}

export interface ProductInput {
  name: string
  description: string | null
  price: number
  category: CategoryId
  image_url: string | null
  is_available: boolean
}

export async function createProduct(input: ProductInput): Promise<Product> {
  if (!supabase) {
    const p: Product = { id: `p${Date.now()}`, ...input }
    mockProducts.push(p)
    return { ...p }
  }
  const { data, error } = await supabase.from('products').insert(input).select().single()
  if (error) throw error
  return { ...data, price: Number(data.price) } as Product
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  if (!supabase) {
    const i = mockProducts.findIndex((x) => x.id === id)
    if (i >= 0) mockProducts[i] = { id, ...input }
    return
  }
  const { error } = await supabase.from('products').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteProduct(id: string): Promise<void> {
  if (!supabase) {
    const i = mockProducts.findIndex((x) => x.id === id)
    if (i >= 0) mockProducts.splice(i, 1)
    return
  }
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

/** อัปโหลดรูปไป Storage แล้วคืน public URL (mock: คืน data URL) */
export async function uploadProductImage(file: File): Promise<string> {
  if (!supabase) {
    return new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result as string)
      r.onerror = reject
      r.readAsDataURL(file)
    })
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('product-images').upload(path, file, {
    contentType: file.type,
    cacheControl: '31536000',
  })
  if (error) throw error
  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
}
