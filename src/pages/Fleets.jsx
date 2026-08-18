import { useState, useMemo } from 'react'
import fleets from '../data/fleets.json'
import ships from '../data/ships.json'
import FleetCard from '../components/FleetCard.jsx'
import FilterPanel from '../components/FilterPanel.jsx'

export default function Fleets() {
  const [filters, setFilters] = useState({ category: [] })

  const filtered = useMemo(() => {
    const result = fleets.filter(f => {
      if (filters.category.length > 0 && !filters.category.includes(f.category)) return false
      return true
    })
    // Sort: user fleets first, then by category
    return result.sort((a, b) => {
      if (a.category === 'user' && b.category !== 'user') return -1
      if (a.category !== 'user' && b.category === 'user') return 1
      return 0
    })
  }, [filters])

  return (
    <div>
      <h1 className="text-2xl font-bold text-al-text mb-4">阵容推荐</h1>
      <div className="mb-4"><FilterPanel filters={filters} onFilterChange={setFilters} filterConfig={{ showCategory: true }} /></div>
      <div className="text-sm text-al-text-muted mb-3">共 {filtered.length} / {fleets.length} 套阵容</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map(fleet => <FleetCard key={fleet.id} fleet={fleet} ships={ships} />)}
      </div>
      {filtered.length === 0 && <div className="text-center py-12 text-al-text-dim">没有找到匹配的阵容</div>}
    </div>
  )
}
