import QRCode from 'qrcode'
import { useCallback, useEffect, useState } from 'react'
import { CUSTOMER_URL } from '../services/supabaseClient'
import { closeTable, fetchTables, type StaffTable } from '../services/staffService'

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
  const [tables, setTables] = useState<StaffTable[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    fetchTables().then(setTables).catch(() => setError('โหลดข้อมูลโต๊ะไม่สำเร็จ'))
  }, [])
  useEffect(load, [load])

  const close = async (t: StaffTable) => {
    if (!confirm(`ปิดโต๊ะ ${t.label}? ลูกค้าจะสั่งต่อจาก QR เดิมไม่ได้จนกว่าจะสแกนใหม่`)) return
    try { await closeTable(t.id); load() } catch { setError('ปิดโต๊ะไม่สำเร็จ') }
  }

  return (
    <>
      <h1>โต๊ะ / QR</h1>
      {error && <div className="notice error">{error}</div>}
      <div className="tables">
        {tables.map((t) => (
          <article key={t.id} className="table-card">
            <h2>โต๊ะ {t.label}</h2>
            <span className={`status ${t.hasOpenSession ? 'open' : ''}`}>{t.hasOpenSession ? 'กำลังใช้งาน' : 'ว่าง'}</span>
            <QR table={t} />
            <button className="ghost" disabled={!t.hasOpenSession} onClick={() => close(t)}>ปิดโต๊ะ (เช็กบิล)</button>
          </article>
        ))}
      </div>
      <p className="muted">QR ผูกกับโต๊ะถาวร พิมพ์ติดโต๊ะครั้งเดียว — กดที่รูปเพื่อดาวน์โหลด</p>
    </>
  )
}
