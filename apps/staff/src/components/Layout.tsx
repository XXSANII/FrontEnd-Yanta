import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isMockMode } from '../services/supabaseClient'

export default function Layout() {
  const { signOut } = useAuth()
  return (
    <div className="shell">
      <header className="nav">
        <strong>หลังร้าน</strong>
        {isMockMode && <span className="mock">MOCK</span>}
        <NavLink to="/">ออเดอร์</NavLink>
        <NavLink to="/tables">โต๊ะ / QR</NavLink>
        <NavLink to="/menu">เมนู</NavLink>
        <button className="link" onClick={signOut}>ออกจากระบบ</button>
      </header>
      <main className="content"><Outlet /></main>
    </div>
  )
}
