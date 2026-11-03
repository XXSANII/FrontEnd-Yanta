import type { CartLine } from '../types'

export const lineTotal = (line: CartLine) => line.product.price * line.quantity

export const cartTotal = (lines: CartLine[]) =>
  lines.reduce((sum, l) => sum + lineTotal(l), 0)

export const cartCount = (lines: CartLine[]) =>
  lines.reduce((sum, l) => sum + l.quantity, 0)

export const formatBaht = (n: number) =>
  `฿${n.toLocaleString('th-TH', { maximumFractionDigits: 2 })}`
