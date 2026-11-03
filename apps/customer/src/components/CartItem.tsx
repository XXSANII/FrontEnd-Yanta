import { useCart } from '../context/CartContext'
import type { CartLine } from '../types'
import { formatBaht, lineTotal } from '../utils/calculateTotal'

export default function CartItem({ line }: { line: CartLine }) {
  const { increment, decrement, remove } = useCart()
  const { product, quantity } = line
  return (
    <li className="cart-item">
      <div className="ci-info">
        <strong>{product.name}</strong>
        <span className="muted">
          {formatBaht(product.price)} × {quantity}
        </span>
      </div>
      <div className="qty">
        <button onClick={() => decrement(product.id)} aria-label="ลดจำนวน">−</button>
        <span>{quantity}</span>
        <button onClick={() => increment(product.id)} aria-label="เพิ่มจำนวน">+</button>
      </div>
      <div className="ci-total">{formatBaht(lineTotal(line))}</div>
      <button className="remove" onClick={() => remove(product.id)} aria-label={`ลบ ${product.name}`}>
        ✕
      </button>
    </li>
  )
}
