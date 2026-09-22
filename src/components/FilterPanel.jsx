import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

// groups: [{ key, label, options: string[], labelOf? }]，选项由各页面从数据派生后传入
// labelOf 只影响按钮显示文案，筛选值仍是数据原始取值
export default function FilterPanel({ filters, onFilterChange, groups = [] }) {
  const [expanded, setExpanded] = useState(true)

  const visible = groups.filter(g => g.options?.length > 0)
  if (visible.length === 0) return null

  const activeCount = visible.reduce((n, g) => n + (filters[g.key]?.length || 0), 0)

  const toggleValue = (key, value) => {
    const current = filters[key] || []
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
    onFilterChange({ ...filters, [key]: next })
  }

  const clearAll = () => {
    const next = { ...filters }
    visible.forEach(g => { next[g.key] = [] })
    onFilterChange(next)
  }

  return (
    <div className="al-panel p-4">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between text-al-text-muted cursor-pointer">
        <span className="font-semibold text-sm">
          筛选条件
          {activeCount > 0 && <span className="text-al-gold"> · 已选 {activeCount} 项</span>}
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {expanded && (
        <div className="mt-3">
          {visible.map(g => (
            <div key={g.key} className="mb-3">
              <div className="text-xs text-al-text-muted mb-1.5 font-medium">{g.label}</div>
              <div className="flex flex-wrap gap-1.5">
                {g.options.map(opt => {
                  const active = (filters[g.key] || []).includes(opt)
                  return (
                    <button
                      key={opt}
                      onClick={() => toggleValue(g.key, opt)}
                      className={`px-2 py-1 rounded text-xs border transition-colors cursor-pointer ${
                        active ? 'bg-al-gold text-al-bg border-al-gold' : 'bg-al-panel-light text-al-text-muted border-al-border hover:border-al-gold/50'
                      }`}
                    >
                      {g.labelOf ? g.labelOf(opt) : opt}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          {activeCount > 0 && (
            <button onClick={clearAll} className="text-xs text-al-text-dim hover:text-al-gold cursor-pointer transition-colors">
              清空筛选
            </button>
          )}
        </div>
      )}
    </div>
  )
}
