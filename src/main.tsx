import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { CartProvider } from './context/CartContext'
import { getTableSessionId } from './hooks/useTableSession'
import './index.css'

getTableSessionId() // เก็บ ?session= จาก QR ก่อน router เปลี่ยน URL

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <CartProvider>
        <App />
      </CartProvider>
    </BrowserRouter>
  </StrictMode>,
)
