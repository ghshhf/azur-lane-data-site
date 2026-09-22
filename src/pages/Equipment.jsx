import { useState, useMemo } from 'react'
import equipment from '../data/equipment.json'
import EquipmentCard from '../components/EquipmentCard.jsx'
import SearchBar from '../components/SearchBar.jsx'
import FilterPanel from '../components/FilterPanel.jsx'
import { RARITY_LIST } from '../utils/rarity.jsx'
import { uniqueValues } from '../utils/options.js'
import { useDocumentTitle } from '../utils/useDocumentTitle.js'

// 类型顺序仅作展示偏好；数据里出现的其它类型会自动追加，不会被漏掉
const TYPE_ORDER = ['炮击', '鱼雷', '防空', '舰载机', '弹药', '设备', '特殊兵装', '水下装备']

const filterGroups = [
  { key: 'type', label: '装备类型', options: uniqueValues(equipment, 'type', TYPE_ORDER) },
  { key: 'rarity', label: '稀有度', options: uniqueValues(equipment, 'rarity', RARITY_LIST) },
]

export default function Equipment() {
  useDocumentTitle('装备图鉴')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ rarity: [], type: [] })

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return equipment.filter(eq => {
      if (keyword) {
        const haystack = [eq.name, eq.type, ...(eq.source || []), ...(eq.fitShipTypes || [])]
          .filter(Boolean).map(v => String(v).toLowerCase())
        if (!haystack.some(v => v.includes(keyword))) return false
      }
      if (filters.rarity.length > 0 && !filters.rarity.includes(eq.rarity)) return false
      if (filters.type.length > 0 && !filters.type.includes(eq.type)) return false
      return true
    })
  }, [search, filters])

  return (
    <div>
      <h1 className="text-2xl font-bold text-al-text mb-4">装备图鉴</h1>
      <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="搜索装备名称 / 类型 / 获取途径..." /></div>
      <div className="mb-4"><FilterPanel filters={filters} onFilterChange={setFilters} groups={filterGroups} /></div>
      <div className="text-sm text-al-text-muted mb-3">
        共 {filtered.length} / {equipment.length} 件装备（已持有 {equipment.filter(e => e.playerOwned).length} 件）
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(eq => <EquipmentCard key={eq.id} equip={eq} />)}
      </div>
      {filtered.length === 0 && <div className="text-center py-12 text-al-text-dim">没有找到匹配的装备</div>}
    </div>
  )
}
