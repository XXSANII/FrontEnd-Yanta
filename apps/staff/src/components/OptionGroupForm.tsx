import type { OptionKind } from '@yanta/shared'
import { useState, type FormEvent } from 'react'
import {
  createOptionGroup, deleteOptionGroup, updateOptionGroup, type OptionGroupInput, type StaffOptionGroup,
} from '../services/staffService'

interface Row { key: number; id?: string; name: string; price: string; available: boolean }

interface Props {
  group: StaffOptionGroup | null // null = สร้างใหม่
  nextSortOrder: number
  onDone: () => void
  onClose: () => void
}

let rowKey = 0
const blankRow = (): Row => ({ key: ++rowKey, name: '', price: '0', available: true })

export default function OptionGroupForm({ group, nextSortOrder, onDone, onClose }: Props) {
  const [name, setName] = useState(group?.name ?? '')
  const [kind, setKind] = useState<OptionKind>(group?.kind ?? 'addon')
  const [required, setRequired] = useState(group?.is_required ?? false)
  const [rows, setRows] = useState<Row[]>(() =>
    group?.options.length
      ? group.options.map((o) => ({ key: ++rowKey, id: o.id, name: o.name, price: String(o.price_delta), available: o.is_available }))
      : [blankRow()])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const patch = (key: number, p: Partial<Row>) => setRows((l) => l.map((r) => (r.key === key ? { ...r, ...p } : r)))
  const changeKind = (k: OptionKind) => {
    setKind(k)
    if (k !== 'single') setRequired(false)
    if (k === 'remove') setRows((l) => l.map((r) => ({ ...r, price: '0' })))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('กรุณากรอกชื่อชุดตัวเลือก')
    if (rows.some((r) => r.id && !r.name.trim())) {
      return setError('ตัวเลือกเดิมต้องมีชื่อ — ถ้าไม่ต้องการแล้วให้กดลบแถว')
    }
    const filled = rows.filter((r) => r.name.trim())
    if (filled.length === 0) return setError('ต้องมีตัวเลือกอย่างน้อย 1 รายการ')
    const seen = new Set<string>()
    for (const r of filled) {
      const n = r.name.trim().toLowerCase()
      if (seen.has(n)) return setError(`ชื่อตัวเลือก "${r.name.trim()}" ซ้ำกัน`)
      seen.add(n)
    }
    const options: OptionGroupInput['options'] = []
    for (const r of filled) {
      const price = kind === 'remove' ? 0 : Number(r.price)
      if (r.price.trim() === '' || !Number.isFinite(price) || price < 0) return setError(`ราคาของ "${r.name.trim()}" ต้องเป็น 0 ขึ้นไป`)
      options.push({ id: r.id, name: r.name.trim(), price_delta: Math.round(price * 100) / 100, is_available: r.available })
    }
    setBusy(true)
    setError(null)
    const input: OptionGroupInput = {
      name: name.trim(), kind, is_required: kind === 'single' && required,
      sort_order: group?.sort_order ?? nextSortOrder, options,
    }
    try {
      if (group) await updateOptionGroup(group.id, input)
      else await createOptionGroup(input)
      onDone()
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง')
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!group || !confirm(`ลบชุดตัวเลือก "${group.name}"? ชุดนี้จะถูกถอดออกจากทุกเมนูที่ใช้อยู่`)) return
    setBusy(true)
    setError(null)
    try { await deleteOptionGroup(group.id); onDone() } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'ลบไม่สำเร็จ')
      setBusy(false)
    }
  }

  return (
    <div className="overlay" onClick={busy ? undefined : onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{group ? 'แก้ไขชุดตัวเลือก' : 'เพิ่มชุดตัวเลือก'}</h2>

        <label>ชื่อชุด *<input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น ท็อปปิ้ง" autoFocus /></label>
        <label>ชนิด
          <select value={kind} onChange={(e) => changeKind(e.target.value as OptionKind)}>
            <option value="addon">เพิ่มของ (เลือกได้หลายอย่าง)</option>
            <option value="remove">ไม่ใส่ (เช่น ไม่ใส่ผัก)</option>
            <option value="single">เลือก 1 อย่าง</option>
          </select>
        </label>
        {kind === 'single' && (
          <label className="switch">
            <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
            บังคับเลือก
          </label>
        )}

        <strong>ตัวเลือก *</strong>
        {rows.map((r) => (
          <div className="og-row" key={r.key}>
            <input value={r.name} onChange={(e) => patch(r.key, { name: e.target.value })} placeholder="ชื่อตัวเลือก" aria-label="ชื่อตัวเลือก" />
            <input
              type="number" inputMode="decimal" min="0" step="0.5" aria-label="ราคาที่เพิ่ม (บาท)"
              value={kind === 'remove' ? '0' : r.price} disabled={kind === 'remove'}
              onChange={(e) => patch(r.key, { price: e.target.value })}
            />
            <label className="switch">
              <input type="checkbox" checked={r.available} onChange={(e) => patch(r.key, { available: e.target.checked })} />
              พร้อมขาย
            </label>
            <button type="button" className="ghost" aria-label="ลบตัวเลือก" onClick={() => setRows((l) => l.filter((x) => x.key !== r.key))}>✕</button>
          </div>
        ))}
        <div><button type="button" className="link-btn" style={{ marginLeft: 0 }} onClick={() => setRows((l) => [...l, blankRow()])}>+ เพิ่มตัวเลือก</button></div>
        {kind !== 'remove' && <small className="muted">ราคา = ส่วนที่บวกเพิ่มจากราคาเมนู (บาท)</small>}

        {error && <div className="notice error">{error}</div>}
        <div className="modal-actions">
          {group && <button type="button" className="danger" onClick={remove} disabled={busy}>ลบชุด</button>}
          <span className="spacer" />
          <button type="button" className="ghost" onClick={onClose} disabled={busy}>ยกเลิก</button>
          <button className="primary" disabled={busy}>{busy ? 'กำลังบันทึก…' : 'บันทึก'}</button>
        </div>
      </form>
    </div>
  )
}
