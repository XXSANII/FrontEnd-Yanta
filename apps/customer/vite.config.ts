import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    host: true, // เปิดให้เครื่องอื่นในเครือข่ายเดียวกัน (เช่นโทรศัพท์) เข้าได้
    // เรียก /api ผ่าน proxy ไปที่ YantaBackEnd (เลี่ยงปัญหา CORS และใช้ได้จากเครื่องอื่น)
    proxy: { '/api': 'http://localhost:5128' },
  },
})
