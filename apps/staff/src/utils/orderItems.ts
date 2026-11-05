import { formatBaht, type OrderItem } from '@yanta/shared'

/** โน้ตที่ตัดช่องว่างแล้ว ('' ถ้าไม่มี) */
export const itemNote = (item: Pick<OrderItem, 'note'>): string => item.note?.trim() ?? ''

/** ข้อความแสดงตัวเลือกของรายการ: ชื่อตัวเลือก (+ ราคา ถ้ามี) แล้วปิดท้ายด้วย `หมายเหตุ: …` (ถ้ามี) */
export function describeItemOptions(item: OrderItem): string[] {
  const tokens = (item.options ?? []).map((o) => (o.price_delta > 0 ? `${o.name} (${formatBaht(o.price_delta)})` : o.name))
  const note = itemNote(item)
  if (note) tokens.push(`หมายเหตุ: ${note}`)
  return tokens
}

/** คีย์สำหรับรวมบรรทัดในบิล: ชื่อ + unit_price + ชื่อตัวเลือกที่เรียงแล้ว + หมายเหตุ */
export function itemLineKey(item: OrderItem): string {
  const opts = (item.options ?? []).map((o) => `${o.group_name}\u0001${o.name}`).sort()
  return JSON.stringify([item.product_name, item.unit_price, opts, itemNote(item)])
}
