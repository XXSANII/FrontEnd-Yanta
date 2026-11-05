import { useEffect, useMemo, useRef, useState } from 'react'
import { useCart } from '../context/CartContext'
import type { CartOption, Product } from '../types'
import { formatBaht } from '../utils/calculateTotal'

const PLACEHOLDER = '/images/placeholder.svg'
const MAX_QTY = 99

interface Props {
  product: Product
  onClose: () => void
}

export default function ProductSheet({ product, onClose }: Props) {
  const { add } = useCart()
  const [selected, setSelected] = useState<Record<string, string[]>>({})
  const [note, setNote] = useState('')
  const [quantity, setQuantity] = useState(1)
  const dialogRef = useRef<HTMLDivElement>(null)

  // กลุ่มที่มีตัวเลือกพร้อมขายเท่านั้น
  const groups = useMemo(
    () =>
      product.option_groups
        .map((g) => ({ ...g, options: g.options.filter((o) => o.is_available) }))
        .filter((g) => g.options.length > 0),
    [product],
  )

  // ปิดด้วย Esc + ล็อกการเลื่อนหน้าด้านหลัง + คืนโฟกัสเมื่อปิด
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      previous?.focus?.()
    }
  }, [onClose])

  const chosen: CartOption[] = groups.flatMap((g) =>
    g.options
      .filter((o) => (selected[g.id] ?? []).includes(o.id))
      .map((o) => ({ id: o.id, group_name: g.name, name: o.name, price_delta: o.price_delta })),
  )
  const unit = product.price + chosen.reduce((s, o) => s + o.price_delta, 0)
  const missingRequired = groups.some(
    (g) => g.kind === 'single' && g.is_required && (selected[g.id] ?? []).length === 0,
  )

  const setSingle = (groupId: string, optionId: string | null) =>
    setSelected((s) => ({ ...s, [groupId]: optionId ? [optionId] : [] }))
  const toggle = (groupId: string, optionId: string) =>
    setSelected((s) => {
      const cur = s[groupId] ?? []
      return { ...s, [groupId]: cur.includes(optionId) ? cur.filter((x) => x !== optionId) : [...cur, optionId] }
    })

  const submit = () => {
    if (missingRequired) return
    add(product, { options: chosen, note: note.trim(), quantity })
    onClose()
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        tabIndex={-1}
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="sheet-close" onClick={onClose} aria-label="ปิด">✕</button>
        <div className="sheet-body">
          <img
            className="sheet-img"
            src={product.image_url || PLACEHOLDER}
            alt={product.name}
            onError={(e) => {
              e.currentTarget.src = PLACEHOLDER
            }}
          />
          <h2 className="sheet-title">{product.name}</h2>
          {product.description && <p className="muted sheet-desc">{product.description}</p>}
          <div className="price">{formatBaht(product.price)}</div>

          {groups.map((g) => {
            const sel = selected[g.id] ?? []
            const single = g.kind === 'single'
            return (
              <fieldset className="opt-group" key={g.id}>
                <legend>
                  <strong>{g.name}</strong>
                  {single && g.is_required && <span className="req"> (บังคับเลือก)</span>}
                  {!single && <span className="muted hint"> เลือกได้หลายอย่าง</span>}
                  {single && !g.is_required && sel.length > 0 && (
                    <button type="button" className="clear-btn" onClick={() => setSingle(g.id, null)}>
                      ไม่เลือก
                    </button>
                  )}
                </legend>
                {g.options.map((o) => {
                  const checked = sel.includes(o.id)
                  return (
                    <label className={`opt-row${checked ? ' on' : ''}`} key={o.id}>
                      <input
                        type={single ? 'radio' : 'checkbox'}
                        name={`opt-${g.id}`}
                        checked={checked}
                        onChange={() => (single ? setSingle(g.id, o.id) : toggle(g.id, o.id))}
                        // กดซ้ำที่ตัวเลือกเดิมของชุดที่ไม่บังคับ = ยกเลิกการเลือก
                        onClick={() => {
                          if (single && !g.is_required && checked) setSingle(g.id, null)
                        }}
                      />
                      <span className="opt-name">{o.name}</span>
                      {o.price_delta > 0 && <span className="opt-price">+{formatBaht(o.price_delta)}</span>}
                    </label>
                  )
                })}
              </fieldset>
            )
          })}

          <label className="note-field">
            <strong>หมายเหตุ</strong>
            <textarea
              value={note}
              maxLength={200}
              rows={2}
              placeholder="หมายเหตุถึงครัว เช่น ไม่เผ็ด"
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
        </div>

        <div className="sheet-foot">
          <div className="qty">
            <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1} aria-label="ลดจำนวน">−</button>
            <span aria-live="polite">{quantity}</span>
            <button type="button" onClick={() => setQuantity((q) => Math.min(MAX_QTY, q + 1))} disabled={quantity >= MAX_QTY} aria-label="เพิ่มจำนวน">+</button>
          </div>
          <button className="primary sheet-add" disabled={missingRequired} onClick={submit}>
            เพิ่มลงตะกร้า {formatBaht(unit * quantity)}
          </button>
        </div>
      </div>
    </div>
  )
}
