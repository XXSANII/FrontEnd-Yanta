import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { isMockMode } from '../services/supabaseClient'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(await signIn(email, password))
    setBusy(false)
  }

  return (
    <form className="login" onSubmit={submit}>
      <h1>เข้าสู่ระบบพนักงาน</h1>
      {isMockMode && <p className="muted">Mock mode: ใส่อะไรก็ได้</p>}
      <input type="email" placeholder="อีเมล" value={email} onChange={(e) => setEmail(e.target.value)} required={!isMockMode} />
      <input type="password" placeholder="รหัสผ่าน" value={password} onChange={(e) => setPassword(e.target.value)} required={!isMockMode} />
      {error && <div className="notice error">{error}</div>}
      <button className="primary" disabled={busy}>{busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}</button>
    </form>
  )
}
