import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { signOut, me, can } = useAuth()
  return (
    <div className="shell">
      <header className="nav">
        <strong>หลังร้าน</strong>
        {can('order.view') && <NavLink to="/">ออเดอร์</NavLink>}
        {can('table.view') && <NavLink to="/tables">โต๊ะ / QR</NavLink>}
        {can('menu.view') && <NavLink to="/menu">เมนู</NavLink>}
        {me && <span className="muted">{me.role}</span>}
        <button className="link" onClick={signOut}>ออกจากระบบ</button>
      </header>
      <main className="content"><Outlet /></main>
    </div>
  )
}
