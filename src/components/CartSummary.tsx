import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatBaht } from '../utils/calculateTotal'

export default function CartSummary() {
  const { count, total } = useCart()
  const navigate = useNavigate()
  return (
    <div className="summary-bar">
      <Link to="/cart" className="summary-info" aria-label="ดูตะกร้า">
        <span className="cart-icon">🛒<b className="count">{count}</b></span>
        <span>
          <small>ยอดรวม</small>
          <strong>{formatBaht(total)}</strong>
        </span>
      </Link>
      <button className="primary" disabled={count === 0} onClick={() => navigate('/review')}>
        สั่งอาหาร
      </button>
    </div>
  )
}
