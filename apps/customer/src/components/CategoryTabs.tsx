import type { Category, CategoryId } from '../types'

interface Props {
  categories: Category[]
  active: CategoryId | null
  onChange: (id: CategoryId) => void
}

export default function CategoryTabs({ categories, active, onChange }: Props) {
  return (
    <nav className="tabs" role="tablist" aria-label="ประเภทอาหาร">
      {categories.map((c) => (
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
