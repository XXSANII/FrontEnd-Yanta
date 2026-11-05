import type { Category, Order, OptionGroup, Product } from './types'

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  /** JWT ของพนักงาน (Supabase access_token) → Authorization: Bearer */
  token?: string | null
  /** token ลูกค้าจากการสแกน QR → X-Session-Token */
  sessionToken?: string | null
  query?: Record<string, string | string[] | undefined>
}

export type ApiFn = <T>(path: string, options?: ApiOptions) => Promise<T>

/** สร้างตัวเรียก Backend (YantaBackEnd) ข้อผิดพลาดทุกแบบโยนเป็น ApiError (status 0 = ต่อเซิร์ฟเวอร์ไม่ได้) */
export function createApi(baseUrl: string): ApiFn {
  const root = baseUrl.replace(/\/$/, '')

  return async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
    // baseUrl ว่าง/"/" = เรียก origin เดียวกัน (ผ่าน proxy ของ Vite)
    const url = new URL(root + path, window.location.origin)
    for (const [k, v] of Object.entries(options.query ?? {})) {
      for (const item of Array.isArray(v) ? v : v === undefined ? [] : [v]) url.searchParams.append(k, item)
    }

    const headers: Record<string, string> = {}
    if (options.body !== undefined) headers['Content-Type'] = 'application/json'
    if (options.token) headers.Authorization = `Bearer ${options.token}`
    if (options.sessionToken) headers['X-Session-Token'] = options.sessionToken

    let res: Response
    try {
      res = await fetch(url, {
        method: options.method ?? 'GET',
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      })
    } catch {
      throw new ApiError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', 0)
    }

    if (res.status === 204) return undefined as T

    const text = await res.text()
    const data = text ? safeJson(text) : null

    if (!res.ok) {
      const title = data && typeof data === 'object' && 'title' in data ? String((data as { title: unknown }).title) : ''
      throw new ApiError(title || `เกิดข้อผิดพลาด (${res.status})`, res.status)
    }
    return data as T
  }
}

function safeJson(text: string): unknown {
  try { return JSON.parse(text) } catch { return null }
}

// ---------- DTO จาก Backend (camelCase) -> รูปแบบที่ UI ใช้ (snake_case) ----------

export interface CategoryDto { id: string; name: string; description: string | null; sortOrder: number }

export interface OptionGroupDto {
  id: string
  name: string
  kind: OptionGroup['kind']
  isRequired: boolean
  sortOrder: number
  options?: {
    id: string
    groupId: string
    name: string
    priceDelta: number
    isAvailable: boolean
    sortOrder: number
  }[]
}

export interface ProductDto {
  id: string
  categoryId: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  isAvailable: boolean
  optionGroups?: OptionGroupDto[]
}

export interface OrderDto {
  id: string
  orderNumber: number
  sessionId: string | null
  tableNumber: string | null
  status: Order['status']
  totalAmount: number
  note: string | null
  createdAt: string
  items: {
    id: string
    productId: string
    productName: string
    unitPrice: number
    quantity: number
    subtotal: number
    status: 'active' | 'cancelled'
    options?: { groupName: string; name: string; priceDelta: number }[]
    note?: string | null
  }[]
}

export const mapCategory = (c: CategoryDto): Category => ({ id: c.id, name: c.name })

export const mapOptionGroup = (g: OptionGroupDto): OptionGroup => ({
  id: g.id,
  name: g.name,
  kind: g.kind,
  is_required: g.isRequired,
  options: (g.options ?? []).map((o) => ({
    id: o.id,
    name: o.name,
    price_delta: Number(o.priceDelta),
    is_available: o.isAvailable,
  })),
})

export const mapProduct = (p: ProductDto): Product => ({
  id: p.id,
  category: p.categoryId,
  name: p.name,
  description: p.description,
  price: Number(p.price),
  image_url: p.imageUrl,
  is_available: p.isAvailable,
  option_groups: (p.optionGroups ?? []).map(mapOptionGroup),
})

export const mapOrder = (o: OrderDto): Order => ({
  id: o.id,
  order_number: o.orderNumber,
  status: o.status,
  total_amount: Number(o.totalAmount),
  created_at: o.createdAt,
  table_label: o.tableNumber,
  session_id: o.sessionId,
  note: o.note,
  items: o.items.map((i) => ({
    id: i.id,
    product_id: i.productId,
    product_name: i.productName,
    quantity: i.quantity,
    unit_price: Number(i.unitPrice),
    subtotal: Number(i.subtotal),
    status: i.status,
    options: (i.options ?? []).map((o) => ({
      group_name: o.groupName,
      name: o.name,
      price_delta: Number(o.priceDelta),
    })),
    note: i.note ?? null,
  })),
})
