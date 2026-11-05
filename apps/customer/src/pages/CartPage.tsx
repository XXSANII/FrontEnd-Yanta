import { Link, useNavigate } from 'react-router-dom'
import TableBadge from '../components/TableBadge'
import CartItem from '../components/CartItem'
import { useCart } from '../context/CartContext'
import { formatBaht } from '../utils/calculateTotal'

export default function CartPage() {
  const { lines, count, total } = useCart()
  const navigate = useNavigate()
  return (
    <div className="page narrow">
      <header className="top">
        <Link to="/" className="back">← เมนู</Link>
        <div className="title-row"><h1>ตะกร้าของฉัน</h1><TableBadge /></div>
      </header>
      <main>
        {lines.length === 0 ? (
          <div className="state">ตะกร้าว่าง — <Link to="/">เลือกอาหาร</Link></div>
        ) : (
          <ul className="cart-list">
            {lines.map((l) => <CartItem key={l.key} line={l} />)}
          </ul>
        )}
      </main>
      <div className="summary-bar">
        <div className="summary-info">
          <span>
            <small>{count} รายการ</small>
            <strong>{formatBaht(total)}</strong>
          </span>
        </div>
        <button className="primary" disabled={count === 0} onClick={() => navigate('/review')}>
          สั่งอาหาร
        </button>
      </div>
    </div>
  )
}
