import { formatBaht } from '@yanta/shared'
import { useState } from 'react'
import type { OptionKind } from '@yanta/shared'
import type { StaffOptionGroup } from '../services/staffService'
import OptionGroupForm from './OptionGroupForm'

export const KIND_LABEL: Record<OptionKind, string> = { addon: 'เพิ่มของ', remove: 'ไม่ใส่', single: 'เลือก 1 อย่าง' }

interface Props {
  groups: StaffOptionGroup[]
  canManage: boolean
  onChanged: () => void
}

export default function OptionGroupsPanel({ groups, canManage, onChanged }: Props) {
  // undefined = ปิด, null = สร้างใหม่, group = แก้ไข
  const [editing, setEditing] = useState<StaffOptionGroup | null | undefined>(undefined)
  const nextSort = groups.reduce((m, g) => Math.max(m, g.sort_order), 0) + 1

  return (
    <section>
      <h2>
        ชุดตัวเลือก <span className="pill">{groups.length}</span>
        {canManage && <button className="link-btn" onClick={() => setEditing(null)}>+ เพิ่มชุดตัวเลือก</button>}
      </h2>
      <ul className="og-list">
        {groups.length === 0 && <li className="muted">ยังไม่มีชุดตัวเลือก</li>}
        {groups.map((g) => (
          <li key={g.id}>
            <span className="grow">
              <strong>{g.name}</strong>{' '}
              <span className="muted">{KIND_LABEL[g.kind]}{g.is_required ? ' · บังคับเลือก' : ''}</span>
              <span className="og-opts">
                {g.options.map((o) => (
                  <span key={o.id} className={o.is_available ? '' : 'off'}>
                    {o.name}{o.price_delta > 0 ? ` +${formatBaht(o.price_delta)}` : ''}{o.is_available ? '' : ' (ปิดขาย)'}
                  </span>
                ))}
              </span>
            </span>
            {canManage && <button className="ghost" onClick={() => setEditing(g)}>แก้ไข</button>}
          </li>
        ))}
      </ul>

      {canManage && editing !== undefined && (
        <OptionGroupForm
          group={editing}
          nextSortOrder={nextSort}
          onClose={() => setEditing(undefined)}
          onDone={() => { setEditing(undefined); onChanged() }}
        />
      )}
    </section>
  )
}
