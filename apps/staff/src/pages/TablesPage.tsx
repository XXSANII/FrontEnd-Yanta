import { formatBaht } from '@yanta/shared'
import QRCode from 'qrcode'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  closeSession, createTable, describeError, fetchOpenSessions, fetchTables, paySession,
  type StaffSession, type StaffTable,
} from '../services/staffService'
import { CUSTOMER_URL } from '../services/supabaseClient'

function QR({ table }: { table: StaffTable }) {
  const [src, setSrc] = useState('')
  const url = `${CUSTOMER_URL}/t/${table.token}`
  useEffect(() => { QRCode.toDataURL(url, { width: 360, margin: 1 }).then(setSrc) }, [url])
  return (
    <a href={src} download={`table-${table.label}.png`} title="ดาวน์โหลด QR">
      {src && <img src={src} alt={`QR โต๊ะ ${table.label}`} />}
    </a>
  )
}

export default function TablesPage() {
  const { can } = useAuth()
  const [tables, setTables] = useState<StaffTable[]>([])
  const [sessions, setSessions] = useState<StaffSession[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    Promise.all([fetchTables(), can('session.view') ? fetchOpenSessions() : Promise.resolve([])])
      .then(([t, s]) => { setTables(t); setSessions(s); setError(null) })
      .catch((e) => setError(describeError(e, 'โหลดข้อมูลโต๊ะไม่สำเร็จ')))
  }, [can])

  useEffect(() => {
    load()
    const poll = setInterval(load, 5000)
    return () => clearInterval(poll)
  }, [load])

  const run = async (action: () => Promise<unknown>, failMessage: string) => {
    try { await action(); load() } catch (e) {
      setError(e instanceof Error && e.message ? e.message : failMessage)
    }
  }

  const pay = (s: StaffSession, t: StaffTable) => {
    if (!confirm(`รับชำระเงินโต๊ะ ${t.label} ยอด ${formatBaht(s.unpaidAmount)} และปิดโต๊ะ?`)) return
    run(() => paySession(s.id), 'รับชำระเงินไม่สำเร็จ')
  }
  const close = (s: StaffSession, t: StaffTable) => {
    if (!confirm(`ปิดโต๊ะ ${t.label}? ลูกค้าจะสั่งต่อจาก QR เดิมไม่ได้จนกว่าจะสแกนใหม่`)) return
    run(() => closeSession(s.id), 'ปิดโต๊ะไม่สำเร็จ (อาจมีออเดอร์ค้างชำระ)')
  }
  const add = () => {
    const label = prompt('เลขโต๊ะใหม่')?.trim()
    if (label) run(() => createTable(label), 'เพิ่มโต๊ะไม่สำเร็จ')
  }

  return (
    <>
      <div className="page-head">
        <h1>โต๊ะ / QR</h1>
        {can('table.manage') && <button className="primary" onClick={add}>+ เพิ่มโต๊ะ</button>}
      </div>
      {error && <div className="notice error">{error}</div>}
      <div className="tables">
        {tables.map((t) => {
          const s = sessions.find((x) => x.tableId === t.id)
          return (
            <article key={t.id} className="table-card">
              <h2>โต๊ะ {t.label}</h2>
              <span className={`status ${s ? 'open' : ''}`}>
                {s ? (s.billRequestedAt ? 'ขอเช็คบิล' : 'กำลังใช้งาน') : t.isActive ? 'ว่าง' : 'ปิดใช้งาน'}
              </span>
              {s && <span className="muted">ค้างชำระ {formatBaht(s.unpaidAmount)} / รวม {formatBaht(s.totalAmount)}</span>}
              <QR table={t} />
              {s && s.unpaidAmount > 0 && can('payment.confirm') && (
                <button className="primary" onClick={() => pay(s, t)}>รับชำระเงิน (ทั้งโต๊ะ)</button>
              )}
              {s && s.unpaidAmount === 0 && can('session.close') && (
                <button className="ghost" onClick={() => close(s, t)}>ปิดโต๊ะ</button>
              )}
            </article>
          )
        })}
      </div>
      <p className="muted">QR ผูกกับโต๊ะถาวร พิมพ์ติดโต๊ะครั้งเดียว — กดที่รูปเพื่อดาวน์โหลด</p>
    </>
  )
}
