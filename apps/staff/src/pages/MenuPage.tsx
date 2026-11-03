import { CATEGORIES, formatBaht, type Product } from '@yanta/shared'
import { useEffect, useState } from 'react'
import { fetchProducts, setAvailability } from '../services/staffService'

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts().then(setProducts).catch(() => setError('โหลดเมนูไม่สำเร็จ'))
  }, [])

  const toggle = async (p: Product) => {
    const next = !p.is_available
    setProducts((l) => l.map((x) => (x.id === p.id ? { ...x, is_available: next } : x)))
    try { await setAvailability(p.id, next) } catch {
      setProducts((l) => l.map((x) => (x.id === p.id ? { ...x, is_available: p.is_available } : x)))
      setError('อัปเดตสถานะสินค้าไม่สำเร็จ')
    }
  }

  return (
    <>
      <h1>เมนู</h1>
      {error && <div className="notice error">{error}</div>}
      {CATEGORIES.map((c) => (
        <section key={c.id}>
          <h2>{c.name}</h2>
          <ul className="menu-list">
            {products.filter((p) => p.category === c.id).map((p) => (
              <li key={p.id}>
                <span>{p.name} <span className="muted">{formatBaht(p.price)}</span></span>
                <label className="switch">
                  <input type="checkbox" checked={p.is_available} onChange={() => toggle(p)} />
                  {p.is_available ? 'พร้อมขาย' : 'หมด'}
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}
