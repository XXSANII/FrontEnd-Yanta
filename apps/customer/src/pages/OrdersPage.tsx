import { formatBaht, type Order } from '@yanta/shared'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import TableBadge from '../components/TableBadge'
import { useTableSession } from '../context/TableSessionContext'
import {
  fetchMyBill, fetchMyOrders, OrderError, requestBill, statusLabel, type MyBill,
} from '../services/orderService'

const time = (iso: string) => new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })

/** ประวัติออเดอร์ของโต๊ะนี้ + สถานะ + ปุ่มกดเช็คบิล */
export default function OrdersPage() {
  const { session, clearSession } = useTableSession()
  const token = session?.token ?? null
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [bill, setBill] = useState<MyBill | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    if (!token) return
    Promise.all([fetchMyOrders(token), fetchMyBill(token)])
      .then(([o, b]) => { setOrders(o); setBill(b); setError(null) })
      .catch((e) => {
        if (e instanceof OrderError && e.sessionInvalid) { clearSession(); setError(e.message) }
        else setError('โหลดออเดอร์ไม่สำเร็จ')
      })
  }, [token, clearSession])

  useEffect(() => {
    load()
    const poll = setInterval(load, 8000) // อัปเดตสถานะการปรุงอัตโนมัติ
    return () => clearInterval(poll)
  }, [load])

  const callBill = async () => {
    if (!token || !confirm('ขอเช็คบิล? หลังขอแล้วจะสั่งอาหารเพิ่มไม่ได้')) return
    setBusy(true)
    try { await requestBill(token); load() } catch (e) {
      setError(e instanceof OrderError ? e.message : 'ขอเช็คบิลไม่สำเร็จ กรุณาลองอีกครั้ง')
    }
    setBusy(false)
  }

  const active = orders?.filter((o) => o.status !== 'cancelled') ?? []

  return (
    <div className="page narrow">
      <header className="top">
        <Link to="/" className="back">← กลับไปเมนู</Link>
        <div className="title-row"><h1>ออเดอร์ของฉัน</h1><TableBadge /></div>
      </header>
      <main>
        {!session && <div className="state">กรุณาสแกน QR ที่โต๊ะก่อน — <Link to="/">ดูเมนู</Link></div>}
        {error && <div className="notice error" role="alert">{error}</div>}
        {session && !orders && !error && <div className="state">กำลังโหลด…</div>}
        {orders && orders.length === 0 && <div className="state">ยังไม่มีออเดอร์ — <Link to="/">เลือกอาหาร</Link></div>}

        {orders?.map((o) => (
          <article key={o.id} className={`my-order status-${o.status}`}>
            <div className="my-order-head">
              <strong>ออเดอร์ #{o.order_number}</strong>
              <span className={`status-pill ${o.status}`}>{statusLabel[o.status]}</span>
              <span className="muted">{time(o.created_at)}</span>
            </div>
            <ul>
              {o.items.map((i) => (
                <li key={i.id} className={i.status === 'cancelled' ? 'item-cancelled' : ''}>
                  {i.quantity} × {i.product_name}
                  {i.status === 'cancelled' && ' (ยกเลิก)'}
                  <span className="muted"> {formatBaht(i.subtotal)}</span>
                </li>
              ))}
            </ul>
            {o.status !== 'cancelled' && <div className="my-order-total">รวม {formatBaht(o.total_amount)}</div>}
          </article>
        ))}

        {bill && active.length > 0 && (
          <div className="bill-box">
            <div>ยอดรวมทั้งหมด <strong>{formatBaht(bill.total)}</strong></div>
            <div>ยังไม่ชำระ <strong>{formatBaht(bill.unpaid)}</strong></div>
            {bill.billRequested
              ? <div className="notice">ขอเช็คบิลแล้ว กรุณารอพนักงานมาที่โต๊ะ</div>
              : <button className="primary" disabled={busy || bill.unpaid === 0} onClick={callBill}>กดเช็คบิล</button>}
          </div>
        )}
      </main>
    </div>
  )
}
