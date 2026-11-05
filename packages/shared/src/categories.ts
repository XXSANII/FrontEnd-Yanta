import type { Category } from './types'

/** ใช้เฉพาะ mock mode (ไม่มี Backend) — โหมดจริงดึงหมวดหมู่จาก GET /api/categories */
export const MOCK_CATEGORIES: Category[] = [
  { id: 'congee', name: 'ข้าวต้ม' },
  { id: 'breakfast', name: 'อาหารเช้า' },
  { id: 'milk-tea', name: 'นม/ชา' },
  { id: 'coffee', name: 'กาแฟ' },
]
