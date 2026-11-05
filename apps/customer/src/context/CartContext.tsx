import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type { CartLine, CartOption, Product } from '../types'
import { cartCount, cartTotal, lineKey } from '../utils/calculateTotal'
import { syncLines } from '../utils/syncLines'

export interface AddSelection {
  options: CartOption[]
  note: string
  quantity: number
}

const MAX_QTY = 99

type Action =
  | { type: 'add'; product: Product; selection?: AddSelection }
  | { type: 'increment'; key: string }
  | { type: 'decrement'; key: string }
  | { type: 'remove'; key: string }
  | { type: 'sync'; products: Product[] }
  | { type: 'clear' }

function reducer(state: CartLine[], action: Action): CartLine[] {
  switch (action.type) {
    case 'add': {
      if (!action.product.is_available) return state
      const options = action.selection?.options ?? []
      const note = (action.selection?.note ?? '').trim()
      const qty = Math.max(1, action.selection?.quantity ?? 1)
      const key = lineKey(action.product.id, options.map((o) => o.id), note)
      const found = state.find((l) => l.key === key)
      if (found) {
        return state.map((l) =>
          l === found ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + qty) } : l,
        )
      }
      return [
        ...state,
        { key, product: action.product, quantity: Math.min(MAX_QTY, qty), options, note },
      ]
    }
    case 'increment':
      return state.map((l) =>
        l.key === action.key ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + 1) } : l,
      )
    case 'decrement':
      return state
        .map((l) =>
          l.key === action.key ? { ...l, quantity: Math.max(0, l.quantity - 1) } : l,
        )
        .filter((l) => l.quantity > 0)
    case 'remove':
      return state.filter((l) => l.key !== action.key)
    case 'sync':
      return syncLines(state, action.products)
    case 'clear':
      return []
  }
}

interface CartContextValue {
  lines: CartLine[]
  count: number
  total: number
  add: (p: Product, selection?: AddSelection) => void
  increment: (key: string) => void
  decrement: (key: string) => void
  remove: (key: string) => void
  sync: (products: Product[]) => void
  clear: () => void
  /** จำนวนรวมของเมนูนี้ทุกบรรทัด (ทุกชุดตัวเลือก) */
  quantityOf: (productId: string) => number
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = 'cart_v2'

function isValidLine(l: unknown): l is CartLine {
  if (!l || typeof l !== 'object') return false
  const x = l as Partial<CartLine>
  return (
    typeof x.key === 'string' &&
    !!x.product && typeof x.product === 'object' &&
    typeof x.quantity === 'number' &&
    Array.isArray(x.options) &&
    typeof x.note === 'string'
  )
}

function load(): CartLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(raw) ? raw.filter(isValidLine) : []
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
      add: (product, selection) => dispatch({ type: 'add', product, selection }),
      increment: (key) => dispatch({ type: 'increment', key }),
      decrement: (key) => dispatch({ type: 'decrement', key }),
      remove: (key) => dispatch({ type: 'remove', key }),
      sync: (products) => dispatch({ type: 'sync', products }),
      clear: () => dispatch({ type: 'clear' }),
      quantityOf: (productId) =>
        lines.filter((l) => l.product.id === productId).reduce((s, l) => s + l.quantity, 0),
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
