import type { Product } from '../types'
import { formatBaht } from '../utils/calculateTotal'

const PLACEHOLDER = '/images/placeholder.svg'

interface Props {
  product: Product
  quantity: number
  onAdd: () => void
  onOpen: () => void
}

export default function ProductCard({ product, quantity, onAdd, onOpen }: Props) {
  const soldOut = !product.is_available
  return (
    <article
      className={`card${soldOut ? ' sold-out' : ' clickable'}`}
      onClick={soldOut ? undefined : onOpen}
      onKeyDown={(e) => {
        if (soldOut || e.target !== e.currentTarget) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      tabIndex={soldOut ? undefined : 0}
      role={soldOut ? undefined : 'button'}
      aria-label={soldOut ? undefined : `ดูตัวเลือก ${product.name}`}
    >
      <div className="card-img">
        <img
          src={product.image_url || PLACEHOLDER}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = PLACEHOLDER
          }}
        />
        {soldOut && <span className="badge">หมด</span>}
      </div>
      <div className="card-body">
        <h3>{product.name}</h3>
        {product.description && <p className="desc">{product.description}</p>}
        <div className="card-foot">
          <span className="price">{formatBaht(product.price)}</span>
          <button
            className="add-btn"
            onClick={(e) => {
              e.stopPropagation()
              onAdd()
            }}
            disabled={soldOut}
            aria-label={`เพิ่ม ${product.name}`}
          >
            {soldOut ? 'ไม่พร้อมขาย' : quantity > 0 ? `+ (${quantity})` : '+'}
          </button>
        </div>
      </div>
    </article>
  )
}
