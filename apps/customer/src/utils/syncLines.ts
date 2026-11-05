import type { CartLine, Product } from '../types'

/** ข้อความต่อบรรทัดที่ใช้สั่งไม่ได้ ตามเหตุผลที่ syncLines ตั้งไว้ */
export const invalidReasonText: Record<NonNullable<CartLine['invalidReason']>, string> = {
  product: 'เมนูนี้ไม่พร้อมจำหน่ายแล้ว — กรุณาลบรายการนี้',
  option: 'ตัวเลือกบางอย่างไม่พร้อมจำหน่ายแล้ว — กรุณาลบรายการนี้',
  required: 'ต้องเลือกตัวเลือกเพิ่มเติม — กรุณาลบรายการนี้แล้วเลือกใหม่',
}

/**
 * อัปเดตราคา/ตัวเลือกของตะกร้าจากข้อมูลล่าสุดของ Backend (ฟังก์ชันล้วน)
 * เมนูหาย/ปิดขาย ตัวเลือกที่เลือกไว้หาย/ปิดขาย หรือมีชุดตัวเลือกบังคับใหม่ที่ยังไม่ได้เลือก
 * → is_available=false + invalidReason (UI บังคับให้ลบบรรทัด); บรรทัดที่กลับมาปกติจะล้าง invalidReason
 */
export function syncLines(lines: CartLine[], products: Product[]): CartLine[] {
  const byId = new Map(products.map((p) => [p.id, p]))
  return lines.map((l) => {
    const fresh = byId.get(l.product.id)
    if (!fresh || !fresh.is_available) {
      return { ...l, product: { ...l.product, is_available: false }, invalidReason: 'product' as const }
    }
    const available = new Map<string, { group_name: string; name: string; price_delta: number }>()
    for (const g of fresh.option_groups ?? []) {
      for (const o of g.options) {
        if (o.is_available) available.set(o.id, { group_name: g.name, name: o.name, price_delta: o.price_delta })
      }
    }
    if (l.options.some((o) => !available.has(o.id))) {
      return { ...l, product: { ...l.product, is_available: false }, invalidReason: 'option' as const }
    }
    const selected = new Set(l.options.map((o) => o.id))
    const missingRequired = (fresh.option_groups ?? []).some(
      (g) =>
        g.kind === 'single' &&
        g.is_required &&
        g.options.some((o) => o.is_available) &&
        !g.options.some((o) => selected.has(o.id)),
    )
    if (missingRequired) {
      return { ...l, product: { ...l.product, is_available: false }, invalidReason: 'required' as const }
    }
    const { invalidReason: _cleared, ...rest } = l
    void _cleared
    return {
      ...rest,
      product: fresh,
      options: l.options.map((o) => ({ id: o.id, ...available.get(o.id)! })),
    }
  })
}
