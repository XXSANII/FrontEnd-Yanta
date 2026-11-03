import { formatBaht, type Order, type OrderStatus } from '@yanta/shared'
import { useCallback, useEffect, useState } from 'react'
import { fetchOrders, subscribeOrders, updateOrderStatus } from '../services/staffService'

const COLUMNS: { status: OrderStatus; title: string; next?: { to: OrderStatus; label: string } }[] = [
  { status: 'pending', title: 'ออเดอร์ใหม่', next: { to: 'preparing', label: 'รับออเดอร์' } },
  { status: 'preparing', title: 'กำลังทำ', next: { to: 'served', label: 'เสิร์ฟแล้ว' } },
  { status: 'served', title: 'เสิร์ฟแล้ว' },
]

const time = (iso: string) => new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    fetchOrders().then((o) => { setOrders(o); setError(null) }).catch(() => setError('โหลดออเดอร์ไม่สำเร็จ'))
  }, [])

  useEffect(() => {
    load()
    const unsub = subscribeOrders(load)
    const poll = setInterval(load, 15000) // สำรองเผื่อ realtime หลุด
    return () => { unsub(); clearInterval(poll) }
  }, [load])

  const change = async (id: string, status: OrderStatus) => {
    try { await updateOrderStatus(id, status); load() } catch { setError('อัปเดตสถานะไม่สำเร็จ') }
  }

  return (
    <>
      <h1>ออเดอร์</h1>
      {error && <div className="notice error">{error}</div>}
      <div className="board">
        {COLUMNS.map((col) => {
          const list = orders.filter((o) => o.status === col.status)
          return (
            <section key={col.status} className="col">
              <h2>{col.title} <span className="pill">{list.length}</span></h2>
              {list.length === 0 && <p className="muted">ไม่มีรายการ</p>}
              {list.map((o) => (
                <article key={o.id} className="order">
                  <div className="order-head">
                    <strong>{o.table_label ? `โต๊ะ ${o.table_label}` : 'ไม่ระบุโต๊ะ'}</strong>
                    <span className="muted">{time(o.created_at)}</span>
                  </div>
                  <ul>
                    {o.items.map((i) => <li key={i.id}>{i.quantity} × {i.product_name}</li>)}
                  </ul>
                  <div className="order-foot">
                    <strong>{formatBaht(o.total_amount)}</strong>
                    <span>
                      {col.status === 'pending' && (
                        <button className="ghost" onClick={() => change(o.id, 'cancelled')}>ปฏิเสธ</button>
                      )}
                      {col.next && (
                        <button className="primary" onClick={() => change(o.id, col.next!.to)}>{col.next.label}</button>
                      )}
                    </span>
                  </div>
                </article>
              ))}
            </section>
          )
        })}
      </div>
    </>
  )
}
