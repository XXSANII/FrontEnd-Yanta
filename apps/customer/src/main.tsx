import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { CartProvider } from './context/CartContext'
import { TableSessionProvider } from './context/TableSessionContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <TableSessionProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </TableSessionProvider>
    </BrowserRouter>
  </StrictMode>,
)
