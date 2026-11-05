import { newId } from '@yanta/shared'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TableBadge from '../components/TableBadge'
import { useCart } from '../context/CartContext'
import { useTableSession } from '../context/TableSessionContext'
import { OrderError, submitOrder } from '../services/orderService'
import { fetchProductsByIds } from '../services/productService'
import { invalidReasonText, syncLines } from '../utils/syncLines'
import { describeOptions } from '../components/CartItem'
import { formatBaht, lineTotal, unitPrice } from '../utils/calculateTotal'

type Status = 'idle' | 'checking' | 'submitting' | 'done'

export default function OrderReviewPage() {
  const { lines, count, total, sync, clear } = useCart()
  const navigate = useNavigate()
  const { session, checking, canOrder, clearSession } = useTableSession()
  const tableLabel = session?.label ?? null
  const [status, setStatus] = useState<Status>('checking')
  const [message, setMessage] = useState<string | null>(null)
  const [done, setDone] = useState<{ orderId: string; total: number } | null>(null)

  // ตรวจราคา/สถานะล่าสุดจากฐานข้อมูลก่อนให้ลูกค้ายืนยัน
  useEffect(() => {
    if (done) return
    const ids = lines.map((l) => l.product.id)
    if (ids.length === 0) return setStatus('idle')
    fetchProductsByIds(ids)
      .then((fresh) => {
        // เทียบด้วยผลของ sync จริง: ราคาต่อหน่วย (รวมตัวเลือก) / สถานะ / ชุดตัวเลือก
        const next = syncLines(lines, fresh)
        const changed = lines.some((l, i) => {
          const n = next[i]
          return (
            unitPrice(n) !== unitPrice(l) ||
            n.product.is_available !== l.product.is_available ||
            n.invalidReason !== l.invalidReason ||
            n.options.map((o) => o.id).join() !== l.options.map((o) => o.id).join()
          )
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
  const canConfirm = count > 0 && unavailable.length === 0 && status === 'idle' && canOrder && !checking

  const confirm = async () => {
    if (!canConfirm) return
    setStatus('submitting')
    setMessage(null)
    try {
      const res = await submitOrder({
        lines,
        tableSessionId: session?.sessionId ?? null,
        sessionToken: session?.token ?? null,
        requestId: newId(),
      })
      clear() // ล้างตะกร้าหลังบันทึกสำเร็จเท่านั้น
      setDone({ orderId: res.orderId, total: res.totalAmount })
      setStatus('done')
    } catch (e) {
      setStatus('idle')
      if (e instanceof OrderError && e.sessionInvalid) clearSession()
      else if (e instanceof OrderError) {
        // 409 ตัวเลือก/เมนูไม่พร้อมขาย: ดึงข้อมูลล่าสุดมา sync เพื่อให้บรรทัดที่มีปัญหาถูกทำเครื่องหมาย
        const ids = lines.map((l) => l.product.id)
        fetchProductsByIds(ids).then(sync).catch(() => {})
      }
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
          <p className="muted">ออเดอร์ {done.orderId}</p>
          <p>ยอดรวม <strong>{formatBaht(done.total)}</strong></p>
          <p className="muted">ร้านได้รับออเดอร์ของคุณแล้ว กรุณารอพนักงานดำเนินการ</p>
          <button className="primary" onClick={() => navigate('/')}>สั่งเพิ่ม</button>
          <Link to="/orders" className="secondary">ดูสถานะออเดอร์ / เช็คบิล</Link>
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
        {!canOrder && !checking && (
          <div className="notice error">กรุณาสแกน QR ที่โต๊ะก่อนสั่งอาหาร</div>
        )}
        {tableLabel && (
          <div className="table-confirm">
            ส่งออเดอร์ไปที่ <strong>โต๊ะ {tableLabel}</strong>
            <small>ไม่ใช่โต๊ะของคุณ? สแกน QR ที่โต๊ะอีกครั้ง</small>
          </div>
        )}
        {message && <div className="notice" role="alert">{message}</div>}
        {unavailable.length > 0 && (
          <div className="notice error">
            มีสินค้าไม่พร้อมจำหน่าย: {unavailable.map((l) => l.product.name).join(', ')} — กรุณาลบรายการที่มีข้อความสีแดงกำกับออกจากตะกร้าก่อนยืนยัน
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
                <tr key={l.key}>
                  <td>
                    {l.product.name}
                    {l.options.length > 0 && <div className="muted">{describeOptions(l)}</div>}
                    {l.note && <div className="muted">หมายเหตุ: {l.note}</div>}
                    {!l.product.is_available && (
                      <div className="line-invalid" style={{ color: '#c0392b' }}>
                        {invalidReasonText[l.invalidReason ?? 'product']}
                      </div>
                    )}
                  </td>
                  <td>{l.quantity}</td>
                  <td>{formatBaht(unitPrice(l))}</td>
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
