import { useTableSession } from '../context/TableSessionContext'

export default function TableBadge() {
  const { session } = useTableSession()
  if (!session) return null
  return <span className="table-badge">โต๊ะ {session.label}</span>
}
