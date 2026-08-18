import { useState, useMemo } from 'react'
import equipment from '../data/equipment.json'
import EquipmentCard from '../components/EquipmentCard.jsx'
import SearchBar from '../components/SearchBar.jsx'
import FilterPanel from '../components/FilterPanel.jsx'

const EQUIP_TYPES = ['炮击', '鱼雷', '防空', '舰载机', '弹药', '水下装备']

export default function Equipment() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ rarity: [], type: [] })

  const filtered = useMemo(() => {
    return equipment.filter(eq => {
      if (search && !eq.name.includes(search)) return false
      if (filters.rarity.length > 0 && !filters.rarity.includes(eq.rarity)) return false
      if (filters.type.length > 0 && !filters.type.includes(eq.type)) return false
      return true
    })
  }, [search, filters])

  return (
    <div>
      <h1 className="text-2xl font-bold text-al-text mb-4">装备图鉴</h1>
      <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="搜索装备名称..." /></div>
      <div className="mb-4">
        <div className="al-panel p-4 mb-3">
          <div className="text-xs text-al-text-muted mb-2 font-medium">装备类型</div>
          <div className="flex flex-wrap gap-1.5">
            {EQUIP_TYPES.map(t => {
              const active = filters.type?.includes(t)
              return (
                <button key={t} onClick={() => { const cur = filters.type || []; setFilters({ ...filters, type: active ? cur.filter(v => v !== t) : [...cur, t] }) }}
                  className={`px-2 py-1 rounded text-xs border transition-colors cursor-pointer ${active ? 'bg-al-gold text-al-bg border-al-gold' : 'bg-al-panel-light text-al-text-muted border-al-border hover:border-al-gold/50'}`}>
                  {t}
                </button>
              )
            })}
          </div>
        </div>
        <FilterPanel filters={{ rarity: filters.rarity }} onFilterChange={(f) => setFilters({ ...filters, rarity: f.rarity })} filterConfig={{ showRarity: true }} />
      </div>
      <div className="text-sm text-al-text-muted mb-3">共 {filtered.length} / {equipment.length} 件装备</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(eq => <EquipmentCard key={eq.id} equip={eq} />)}
      </div>
      {filtered.length === 0 && <div className="text-center py-12 text-al-text-dim">没有找到匹配的装备</div>}
    </div>
  )
}
