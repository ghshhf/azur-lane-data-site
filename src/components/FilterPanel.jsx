import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { RARITY_LIST } from '../utils/rarity.jsx'
import { SHIP_TYPE_LIST } from '../utils/shipType.jsx'

const CATEGORY_LIST = ['user', 'boss', 'pvp', 'farm', 'ex', 'special']

export default function FilterPanel({ filters, onFilterChange, filterConfig }) {
  const [expanded, setExpanded] = useState(true)

  const toggleValue = (key, value) => {
    const current = filters[key] || []
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
    onFilterChange({ ...filters, [key]: next })
  }

  const renderGroup = (label, key, options) => (
    <div className="mb-3">
      <div className="text-xs text-al-text-muted mb-1.5 font-medium">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const active = (filters[key] || []).includes(opt)
          return (
            <button
              key={opt}
              onClick={() => toggleValue(key, opt)}
              className={`px-2 py-1 rounded text-xs border transition-colors cursor-pointer ${
                active ? 'bg-al-gold text-al-bg border-al-gold' : 'bg-al-panel-light text-al-text-muted border-al-border hover:border-al-gold/50'
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="al-panel p-4">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between text-al-text-muted cursor-pointer">
        <span className="font-semibold text-sm">筛选条件</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {expanded && (
        <div className="mt-3">
          {filterConfig?.showRarity && renderGroup('稀有度', 'rarity', RARITY_LIST)}
          {filterConfig?.showShipType && renderGroup('舰种', 'shipType', SHIP_TYPE_LIST)}
          {filterConfig?.showCategory && renderGroup('阵容类型', 'category', CATEGORY_LIST)}
        </div>
      )}
    </div>
  )
}
