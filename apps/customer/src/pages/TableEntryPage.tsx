import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTableSession } from '../context/TableSessionContext'
import { InvalidTableError, openTableSession } from '../services/tableService'

/** /t/:token — QR ประจำโต๊ะเปิดหน้านี้: แลก qrToken เป็น session แล้วล้าง token ออกจาก URL */
export default function TableEntryPage() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const { setSession } = useTableSession()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    openTableSession(token)
      .then((s) => {
        if (cancelled) return
        setSession(s)
        navigate('/', { replace: true }) // token หายจาก URL/ประวัติ
      })
      .catch((e) => {
        if (cancelled) return
        setError(
          e instanceof InvalidTableError
            ? 'QR นี้ใช้งานไม่ได้ กรุณาติดต่อพนักงาน'
            : 'เชื่อมต่อไม่สำเร็จ กรุณาสแกน QR ใหม่อีกครั้ง',
        )
      })
    return () => { cancelled = true }
  }, [token, navigate, setSession])

  return (
    <div className="page narrow">
      <main className="state">
        {error ? <>{error}<br /><Link to="/">ดูเมนู</Link></> : 'กำลังเปิดโต๊ะ…'}
      </main>
    </div>
  )
}
