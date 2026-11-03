import { CATEGORIES } from '../data/categories'
import type { CategoryId } from '../types'

interface Props {
  active: CategoryId
  onChange: (id: CategoryId) => void
}

export default function CategoryTabs({ active, onChange }: Props) {
  return (
    <nav className="tabs" role="tablist" aria-label="ประเภทอาหาร">
      {CATEGORIES.map((c) => (
        <button
          key={c.id}
          role="tab"
          aria-selected={c.id === active}
          className={`tab${c.id === active ? ' active' : ''}`}
          onClick={() => onChange(c.id)}
        >
          {c.name}
        </button>
      ))}
    </nav>
  )
}
