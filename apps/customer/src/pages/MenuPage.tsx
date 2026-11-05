import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import TableBadge from '../components/TableBadge'
import CartSummary from '../components/CartSummary'
import CategoryTabs from '../components/CategoryTabs'
import ProductCard from '../components/ProductCard'
import ProductSheet from '../components/ProductSheet'
import { useCart } from '../context/CartContext'
import { useTableSession } from '../context/TableSessionContext'
import { fetchCategories, fetchProducts } from '../services/productService'
import type { Category, CategoryId, Product } from '../types'

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [category, setCategory] = useState<CategoryId | null>(null)
  const [products, setProducts] = useState<Product[] | null>(null)
  const [error, setError] = useState(false)
  const [sheet, setSheet] = useState<Product | null>(null)
  const { add, quantityOf } = useCart()
  const { session } = useTableSession()

  const load = () => {
    setError(false)
    setProducts(null)
    Promise.all([fetchCategories(), fetchProducts()])
      .then(([cats, prods]) => {
        setCategories(cats)
        setCategory((cur) => cur ?? cats[0]?.id ?? null)
        setProducts(prods)
      })
      .catch(() => setError(true))
  }
  useEffect(load, [])

  const closeSheet = useCallback(() => setSheet(null), [])

  const visible = products?.filter((p) => p.category === category) ?? []

  return (
    <div className="page">
      <header className="top">
        <div className="title-row">
          <h1>เมนูอาหาร</h1>
          {session && <Link to="/orders" className="orders-link">ออเดอร์ของฉัน / เช็คบิล</Link>}
          <TableBadge />
        </div>
        <CategoryTabs categories={categories} active={category} onChange={setCategory} />
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
            <ProductCard
              key={p.id}
              product={p}
              quantity={quantityOf(p.id)}
              onOpen={() => p.is_available && setSheet(p)}
              onAdd={() => {
                // มีชุด single บังคับ (ที่มีตัวเลือกพร้อมขาย) ต้องเลือกก่อน → เปิดหน้าต่าง
                const needsChoice = p.option_groups.some(
                  (g) => g.kind === 'single' && g.is_required && g.options.some((o) => o.is_available),
                )
                if (needsChoice) setSheet(p)
                else add(p)
              }}
            />
          ))}
        </div>
      </main>

      {sheet && <ProductSheet product={sheet} onClose={closeSheet} />}
      <CartSummary />
    </div>
  )
}
