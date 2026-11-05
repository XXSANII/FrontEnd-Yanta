import { createApi } from '@yanta/shared'

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim()

if (!API_URL) throw new Error('ไม่ได้ตั้งค่า VITE_API_URL (ที่อยู่ Backend)')

export const api = createApi(API_URL)
