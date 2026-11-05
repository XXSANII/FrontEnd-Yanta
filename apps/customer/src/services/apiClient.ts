import { createApi } from '@yanta/shared'

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim()

/** คืน null เมื่อไม่ได้ตั้ง VITE_API_URL → แอปเข้าสู่ mock mode */
export const api = API_URL ? createApi(API_URL) : null
export const isMockMode = api === null
