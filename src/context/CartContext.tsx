import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type { CartLine, Product } from '../types'
import { cartCount, cartTotal } from '../utils/calculateTotal'

type Action =
  | { type: 'add'; product: Product }
  | { type: 'increment'; id: string }
  | { type: 'decrement'; id: string }
  | { type: 'remove'; id: string }
  | { type: 'sync'; products: Product[] }
  | { type: 'clear' }

function reducer(state: CartLine[], action: Action): CartLine[] {
  switch (action.type) {
    case 'add': {
      if (!action.product.is_available) return state
      const found = state.find((l) => l.product.id === action.product.id)
      if (found) {
        return state.map((l) =>
          l === found ? { ...l, quantity: l.quantity + 1 } : l,
        )
      }
      return [...state, { product: action.product, quantity: 1 }]
    }
    case 'increment':
      return state.map((l) =>
        l.product.id === action.id ? { ...l, quantity: l.quantity + 1 } : l,
      )
    case 'decrement':
      return state
        .map((l) =>
          l.product.id === action.id ? { ...l, quantity: Math.max(0, l.quantity - 1) } : l,
        )
        .filter((l) => l.quantity > 0)
    case 'remove':
      return state.filter((l) => l.product.id !== action.id)
    case 'sync': {
      // อัปเดตราคา/สถานะจากฐานข้อมูล และตัดสินค้าที่ถูกลบออกจากเมนู
      const byId = new Map(action.products.map((p) => [p.id, p]))
      return state
        .filter((l) => byId.has(l.product.id))
        .map((l) => ({ ...l, product: byId.get(l.product.id)! }))
    }
    case 'clear':
      return []
  }
}

interface CartContextValue {
  lines: CartLine[]
  count: number
  total: number
  add: (p: Product) => void
  increment: (id: string) => void
  decrement: (id: string) => void
  remove: (id: string) => void
  sync: (products: Product[]) => void
  clear: () => void
  quantityOf: (id: string) => number
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = 'cart_v1'

function load(): CartLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(reducer, undefined, load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
  }, [lines])

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: cartCount(lines),
      total: cartTotal(lines),
      add: (product) => dispatch({ type: 'add', product }),
      increment: (id) => dispatch({ type: 'increment', id }),
      decrement: (id) => dispatch({ type: 'decrement', id }),
      remove: (id) => dispatch({ type: 'remove', id }),
      sync: (products) => dispatch({ type: 'sync', products }),
      clear: () => dispatch({ type: 'clear' }),
      quantityOf: (id) => lines.find((l) => l.product.id === id)?.quantity ?? 0,
    }),
    [lines],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
