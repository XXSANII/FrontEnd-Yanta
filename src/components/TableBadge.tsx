import { useTableSession } from '../hooks/useTableSession'

export default function TableBadge() {
  const { tableLabel, sessionId } = useTableSession()
  if (!tableLabel && !sessionId) return null
  return <span className="table-badge">{tableLabel ? `โต๊ะ ${tableLabel}` : 'สั่งผ่าน QR โต๊ะ'}</span>
}
