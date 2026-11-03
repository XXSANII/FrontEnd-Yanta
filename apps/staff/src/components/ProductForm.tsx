import { CATEGORIES, type CategoryId, type Product } from '@yanta/shared'
import { useState, type FormEvent } from 'react'
import { uploadProductImage, type ProductInput } from '../services/staffService'

interface Props {
  product: Product | null // null = เพิ่มเมนูใหม่
  defaultCategory: CategoryId
  onSave: (input: ProductInput) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}

const MAX_IMAGE_MB = 3

export default function ProductForm({ product, defaultCategory, onSave, onDelete, onClose }: Props) {
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(product ? String(product.price) : '')
  const [category, setCategory] = useState<CategoryId>(product?.category ?? defaultCategory)
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '')
  const [available, setAvailable] = useState(product?.is_available ?? true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pickImage = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('กรุณาเลือกไฟล์รูปภาพ')
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) return setError(`รูปต้องไม่เกิน ${MAX_IMAGE_MB} MB`)
    setBusy(true)
    setError(null)
    try { setImageUrl(await uploadProductImage(file)) } catch { setError('อัปโหลดรูปไม่สำเร็จ') }
    setBusy(false)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const priceNum = Number(price)
    if (!name.trim()) return setError('กรุณากรอกชื่อเมนู')
    if (price === '' || !Number.isFinite(priceNum) || priceNum < 0) return setError('กรุณากรอกราคาให้ถูกต้อง (0 ขึ้นไป)')
    setBusy(true)
    setError(null)
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || null,
        price: Math.round(priceNum * 100) / 100,
        category,
        image_url: imageUrl.trim() || null,
        is_available: available,
      })
    } catch {
      setError('บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง')
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!onDelete || !confirm(`ลบเมนู "${product?.name}" ถาวร? (ประวัติออเดอร์เดิมยังอยู่)`)) return
    setBusy(true)
    try { await onDelete() } catch { setError('ลบไม่สำเร็จ'); setBusy(false) }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{product ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}</h2>

        <label>ชื่อเมนู *<input value={name} onChange={(e) => setName(e.target.value)} autoFocus /></label>
        <div className="row2">
          <label>ราคา (บาท) *
            <input type="number" inputMode="decimal" min="0" step="0.5" value={price} onChange={(e) => setPrice(e.target.value)} />
          </label>
          <label>ประเภท
            <select value={category} onChange={(e) => setCategory(e.target.value as CategoryId)}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
        <label>รายละเอียด
          <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <div className="img-row">
          {imageUrl ? <img src={imageUrl} alt="" /> : <div className="img-empty">ไม่มีรูป</div>}
          <div>
            <input type="file" accept="image/*" onChange={(e) => pickImage(e.target.files?.[0])} />
            {imageUrl && <button type="button" className="ghost" onClick={() => setImageUrl('')}>ลบรูป</button>}
            <small className="muted">ไม่ใส่รูป ลูกค้าจะเห็นรูปเริ่มต้น</small>
          </div>
        </div>

        <label className="switch">
          <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
          พร้อมขาย
        </label>

        {error && <div className="notice error">{error}</div>}
        <div className="modal-actions">
          {onDelete && <button type="button" className="danger" onClick={remove} disabled={busy}>ลบเมนู</button>}
          <span className="spacer" />
          <button type="button" className="ghost" onClick={onClose} disabled={busy}>ยกเลิก</button>
          <button className="primary" disabled={busy}>{busy ? 'กำลังบันทึก…' : 'บันทึก'}</button>
        </div>
      </form>
    </div>
  )
}
