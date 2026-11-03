import { Route, Routes } from 'react-router-dom'
import CartPage from './pages/CartPage'
import MenuPage from './pages/MenuPage'
import OrderReviewPage from './pages/OrderReviewPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MenuPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/review" element={<OrderReviewPage />} />
      <Route path="*" element={<MenuPage />} />
    </Routes>
  )
}
