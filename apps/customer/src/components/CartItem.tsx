import { useCart } from '../context/CartContext'
import type { CartLine } from '../types'
import { invalidReasonText } from '../utils/syncLines'
import { formatBaht, lineTotal, unitPrice } from '../utils/calculateTotal'

export function describeOptions(line: CartLine): string {
  return line.options
    .map((o) => (o.price_delta > 0 ? `${o.name} ${formatBaht(o.price_delta)}` : o.name))
    .join(' · ')
}

export default function CartItem({ line }: { line: CartLine }) {
  const { increment, decrement, remove } = useCart()
  const { product, quantity } = line
  return (
    <li className="cart-item">
      <div className="ci-info">
        <strong>{product.name}</strong>
        {line.options.length > 0 && <span className="muted">{describeOptions(line)}</span>}
        {line.note && <span className="muted">หมายเหตุ: {line.note}</span>}
        <span className="muted">
          {formatBaht(unitPrice(line))} × {quantity}
        </span>
        {!product.is_available && (
          <span className="line-invalid" role="alert" style={{ color: '#c0392b' }}>
            {invalidReasonText[line.invalidReason ?? 'product']}
          </span>
        )}
      </div>
      <div className="qty">
        <button onClick={() => decrement(line.key)} aria-label="ลดจำนวน">−</button>
        <span>{quantity}</span>
        <button onClick={() => increment(line.key)} aria-label="เพิ่มจำนวน">+</button>
      </div>
      <div className="ci-total">{formatBaht(lineTotal(line))}</div>
      <button className="remove" onClick={() => remove(line.key)} aria-label={`ลบ ${product.name}`}>
        ✕
      </button>
    </li>
  )
}
