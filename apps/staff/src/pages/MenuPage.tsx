import { CATEGORIES, formatBaht, type CategoryId, type Product } from '@yanta/shared'
import { useCallback, useEffect, useState } from 'react'
import ProductForm from '../components/ProductForm'
import {
  createProduct, deleteProduct, fetchProducts, setAvailability, updateProduct, type ProductInput,
} from '../services/staffService'

type Editing = { product: Product | null; category: CategoryId } | null

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Editing>(null)

  const load = useCallback(() => {
    fetchProducts().then(setProducts).catch(() => setError('โหลดเมนูไม่สำเร็จ'))
  }, [])
  useEffect(load, [load])

  const toggle = async (p: Product) => {
    const next = !p.is_available
    setProducts((l) => l.map((x) => (x.id === p.id ? { ...x, is_available: next } : x)))
    try { await setAvailability(p.id, next) } catch {
      setProducts((l) => l.map((x) => (x.id === p.id ? { ...x, is_available: p.is_available } : x)))
      setError('อัปเดตสถานะสินค้าไม่สำเร็จ')
    }
  }

  const save = async (input: ProductInput) => {
    if (editing?.product) await updateProduct(editing.product.id, input)
    else await createProduct(input)
    setEditing(null)
    load()
  }

  return (
    <>
      <div className="page-head">
        <h1>เมนู</h1>
        <button className="primary" onClick={() => setEditing({ product: null, category: 'congee' })}>+ เพิ่มเมนู</button>
      </div>
      {error && <div className="notice error">{error}</div>}

      {CATEGORIES.map((c) => {
        const list = products.filter((p) => p.category === c.id)
        return (
          <section key={c.id}>
            <h2>
              {c.name} <span className="pill">{list.length}</span>
              <button className="link-btn" onClick={() => setEditing({ product: null, category: c.id })}>+ เพิ่มในหมวดนี้</button>
            </h2>
            <ul className="menu-list">
              {list.length === 0 && <li className="muted">ยังไม่มีเมนูในหมวดนี้</li>}
              {list.map((p) => (
                <li key={p.id}>
                  <img className="thumb" src={p.image_url || '/placeholder.svg'} alt="" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} />
                  <span className="grow">
                    <strong>{p.name}</strong>
                    <span className="muted"> {formatBaht(p.price)}</span>
                    {p.description && <small className="muted block">{p.description}</small>}
                  </span>
                  <label className="switch">
                    <input type="checkbox" checked={p.is_available} onChange={() => toggle(p)} />
                    {p.is_available ? 'พร้อมขาย' : 'หมด'}
                  </label>
                  <button className="ghost" onClick={() => setEditing({ product: p, category: p.category })}>แก้ไข</button>
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      {editing && (
        <ProductForm
          product={editing.product}
          defaultCategory={editing.category}
          onSave={save}
          onDelete={editing.product ? async () => { await deleteProduct(editing.product!.id); setEditing(null); load() } : undefined}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
