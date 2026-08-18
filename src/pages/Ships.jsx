import { useState, useMemo } from 'react'
import ships from '../data/ships.json'
import ShipCard from '../components/ShipCard.jsx'
import SearchBar from '../components/SearchBar.jsx'
import FilterPanel from '../components/FilterPanel.jsx'

export default function Ships() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ rarity: [], shipType: [] })

  const filtered = useMemo(() => {
    const result = ships.filter(ship => {
      if (search && !ship.name.includes(search) && !ship.nameEn.toLowerCase().includes(search.toLowerCase())) return false
      if (filters.rarity.length > 0 && !filters.rarity.includes(ship.rarity)) return false
      if (filters.shipType.length > 0 && !filters.shipType.includes(ship.shipType)) return false
      return true
    })
    // Sort: owned ships first
    return result.sort((a, b) => {
      if (a.playerInfo?.owned && !b.playerInfo?.owned) return -1
      if (!a.playerInfo?.owned && b.playerInfo?.owned) return 1
      return 0
    })
  }, [search, filters])

  return (
    <div>
      <h1 className="text-2xl font-bold text-al-text mb-4">舰娘图鉴</h1>
      <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="搜索舰娘名称..." /></div>
      <div className="mb-4"><FilterPanel filters={filters} onFilterChange={setFilters} filterConfig={{ showRarity: true, showShipType: true }} /></div>
      <div className="text-sm text-al-text-muted mb-3">共 {filtered.length} / {ships.length} 艘舰娘</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(ship => <ShipCard key={ship.id} ship={ship} />)}
      </div>
      {filtered.length === 0 && <div className="text-center py-12 text-al-text-dim">没有找到匹配的舰娘</div>}
    </div>
  )
}
