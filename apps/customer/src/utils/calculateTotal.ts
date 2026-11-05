import { formatBaht } from '@yanta/shared'
import type { CartLine } from '../types'

export const lineKey = (productId: string, optionIds: string[], note: string) =>
  `${productId}|${[...optionIds].sort().join(',')}|${note.trim()}`

export const unitPrice = (line: CartLine) =>
  line.product.price + line.options.reduce((sum, o) => sum + o.price_delta, 0)

export const lineTotal = (line: CartLine) => unitPrice(line) * line.quantity

export const cartTotal = (lines: CartLine[]) =>
  lines.reduce((sum, l) => sum + lineTotal(l), 0)

export const cartCount = (lines: CartLine[]) =>
  lines.reduce((sum, l) => sum + l.quantity, 0)

export { formatBaht }
