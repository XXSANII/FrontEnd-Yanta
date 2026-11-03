import { useEffect, useState } from 'react'
import TableBadge from '../components/TableBadge'
import CartSummary from '../components/CartSummary'
import CategoryTabs from '../components/CategoryTabs'
import ProductCard from '../components/ProductCard'
import { useCart } from '../context/CartContext'
import { fetchProducts } from '../services/productService'
import type { CategoryId, Product } from '../types'

export default function MenuPage() {
  const [category, setCategory] = useState<CategoryId>('congee')
  const [products, setProducts] = useState<Product[] | null>(null)
  const [error, setError] = useState(false)
  const { add, quantityOf } = useCart()

  const load = () => {
    setError(false)
    setProducts(null)
    fetchProducts().then(setProducts).catch(() => setError(true))
  }
  useEffect(load, [])

  const visible = products?.filter((p) => p.category === category) ?? []

  return (
    <div className="page">
      <header className="top">
        <div className="title-row"><h1>เมนูอาหาร</h1><TableBadge /></div>
        <CategoryTabs active={category} onChange={setCategory} />
      </header>

      <main className="grid-wrap">
        {error && (
          <div className="state">
            โหลดเมนูไม่สำเร็จ
            <button onClick={load}>ลองอีกครั้ง</button>
          </div>
        )}
        {!error && !products && <div className="state">กำลังโหลดเมนู…</div>}
        {products && visible.length === 0 && <div className="state">ยังไม่มีรายการในหมวดนี้</div>}
        <div className="grid">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} quantity={quantityOf(p.id)} onAdd={() => add(p)} />
          ))}
        </div>
      </main>

      <CartSummary />
    </div>
  )
}
