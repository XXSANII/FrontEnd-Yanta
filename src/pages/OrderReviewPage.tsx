import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TableBadge from '../components/TableBadge'
import { useCart } from '../context/CartContext'
import { useTableSession } from '../hooks/useTableSession'
import { OrderError, submitOrder } from '../services/orderService'
import { fetchProductsByIds } from '../services/productService'
import { formatBaht, lineTotal } from '../utils/calculateTotal'

type Status = 'idle' | 'checking' | 'submitting' | 'done'

export default function OrderReviewPage() {
  const { lines, count, total, sync, clear } = useCart()
  const navigate = useNavigate()
  const { sessionId: tableSessionId, tableLabel } = useTableSession()
  const [status, setStatus] = useState<Status>('checking')
  const [message, setMessage] = useState<string | null>(null)
  const [done, setDone] = useState<{ orderId: string; total: number } | null>(null)
  // request id คงเดิมทุกครั้งที่ retry เพื่อกันออเดอร์ซ้ำ
  const requestId = useRef(crypto.randomUUID())

  // ตรวจราคา/สถานะล่าสุดจากฐานข้อมูลก่อนให้ลูกค้ายืนยัน
  useEffect(() => {
    if (done) return
    const ids = lines.map((l) => l.product.id)
    if (ids.length === 0) return setStatus('idle')
    fetchProductsByIds(ids)
      .then((fresh) => {
        const changed = lines.some((l) => {
          const f = fresh.find((p) => p.id === l.product.id)
          return !f || f.price !== l.product.price || f.is_available !== l.product.is_available
        })
        if (changed) {
          sync(fresh)
          setMessage('ราคาหรือสถานะสินค้าบางรายการมีการเปลี่ยนแปลง กรุณาตรวจสอบรายการอีกครั้ง')
        }
      })
      .catch(() => setMessage('ตรวจสอบราคาล่าสุดไม่สำเร็จ ระบบจะตรวจซ้ำอีกครั้งตอนยืนยัน'))
      .finally(() => setStatus('idle'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const unavailable = lines.filter((l) => !l.product.is_available)
  const canConfirm = count > 0 && unavailable.length === 0 && status === 'idle'

  const confirm = async () => {
    if (!canConfirm) return
    setStatus('submitting')
    setMessage(null)
    try {
      const res = await submitOrder({ lines, tableSessionId, requestId: requestId.current })
      clear() // ล้างตะกร้าหลังบันทึกสำเร็จเท่านั้น
      setDone({ orderId: res.orderId, total: res.totalAmount })
      setStatus('done')
    } catch (e) {
      setStatus('idle')
      setMessage(
        e instanceof OrderError ? e.message : 'ส่งคำสั่งซื้อไม่สำเร็จ กรุณาลองอีกครั้ง',
      )
    }
  }

  if (done) {
    return (
      <div className="page narrow">
        <main className="success">
          <div className="check">✓</div>
          <h1>ส่งคำสั่งซื้อเรียบร้อยแล้ว</h1>
          {tableLabel && <p><strong>โต๊ะ {tableLabel}</strong></p>}
          <p className="muted">เลขที่ออเดอร์ {done.orderId}</p>
          <p>ยอดรวม <strong>{formatBaht(done.total)}</strong></p>
          <p className="muted">ร้านได้รับออเดอร์ของคุณแล้ว กรุณารอพนักงานดำเนินการ</p>
          <button className="primary" onClick={() => navigate('/')}>สั่งเพิ่ม</button>
        </main>
      </div>
    )
  }

  return (
    <div className="page narrow">
      <header className="top">
        <Link to="/" className="back">← เลือกอาหารเพิ่มเติม</Link>
        <div className="title-row"><h1>ตรวจสอบรายการที่สั่ง</h1><TableBadge /></div>
      </header>
      <main>
        {message && <div className="notice" role="alert">{message}</div>}
        {unavailable.length > 0 && (
          <div className="notice error">
            มีสินค้าไม่พร้อมจำหน่าย: {unavailable.map((l) => l.product.name).join(', ')} — กรุณาลบออกจากตะกร้า
            <Link to="/cart"> แก้ไขตะกร้า</Link>
          </div>
        )}
        {lines.length === 0 ? (
          <div className="state">ไม่มีสินค้าในตะกร้า — <Link to="/">เลือกอาหาร</Link></div>
        ) : (
          <table className="review">
            <thead>
              <tr><th>รายการ</th><th>จำนวน</th><th>ราคา/หน่วย</th><th>รวม</th></tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.product.id}>
                  <td>{l.product.name}</td>
                  <td>{l.quantity}</td>
                  <td>{formatBaht(l.product.price)}</td>
                  <td>{formatBaht(lineTotal(l))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><td colSpan={3}>ยอดรวมสุทธิ</td><td>{formatBaht(total)}</td></tr>
            </tfoot>
          </table>
        )}
      </main>
      <div className="summary-bar">
        <Link to="/" className="secondary">กลับไปเลือกเพิ่ม</Link>
        <button className="primary" disabled={!canConfirm} onClick={confirm}>
          {status === 'submitting' ? 'กำลังส่งคำสั่งซื้อ…' : 'ยืนยันคำสั่งซื้อ'}
        </button>
      </div>
    </div>
  )
}
