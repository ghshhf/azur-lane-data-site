import { useNavigate } from 'react-router-dom'
import { Flag, Swords, Zap, Shield, Wind, Anchor, Sparkles } from 'lucide-react'

const categoryLabels = { user: '我的', boss: 'Boss', pvp: 'PvP', farm: '刷图', ex: 'EX', special: '特殊' }
const categoryColors = {
  user: 'bg-al-gold/20 text-al-gold',
  boss: 'bg-r-meta/20 text-r-meta',
  pvp: 'bg-r-sr/20 text-r-sr',
  farm: 'bg-r-r/20 text-r-r',
  ex: 'bg-r-elite/20 text-r-elite',
  special: 'bg-t-cv/20 text-t-cv',
}

const statIcons = { fp: Swords, trp: Zap, aa: Shield, air: Wind, control: Sparkles, cost: Anchor }
const statLabels = { fp: '炮击', trp: '雷击', aa: '防空', air: '航空', control: '制空', cost: '消耗' }

export default function FleetCard({ fleet, ships }) {
  const navigate = useNavigate()
  const getShipName = (id) => ships?.find(s => s.id === id)?.name || id
  const flagshipName = fleet.flagship ? getShipName(fleet.flagship) : null

  return (
    <div className="al-card" onClick={() => navigate(`/fleets/${fleet.id}`)}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-al-text">{fleet.name}</h3>
          <p className="text-xs text-al-text-dim mt-0.5">{fleet.description}</p>
        </div>
        <span className={`al-badge border ${categoryColors[fleet.category] || ''}`}>
          {categoryLabels[fleet.category] || fleet.category}
        </span>
      </div>

      {fleet.aggregateStats && (
        <div className="grid grid-cols-3 gap-1 mb-3 p-2 bg-al-panel-light rounded">
          {Object.entries(fleet.aggregateStats).map(([key, val]) => {
            const Icon = statIcons[key] || Swords
            return (
              <div key={key} className="flex items-center gap-1 text-xs">
                <Icon className="w-3 h-3 text-al-text-dim" />
                <span className="text-al-text-dim">{statLabels[key]}</span>
                <span className="font-bold text-al-text">{val}</span>
              </div>
            )
          })}
        </div>
      )}

      {flagshipName && (
        <div className="text-xs text-al-gold mb-1.5 flex items-center gap-1">
          <Flag className="w-3 h-3" /> 旗舰: {flagshipName}
        </div>
      )}

      <div className="text-xs text-al-text-muted mb-1">前排: {fleet.front.map(id => getShipName(id)).join(' / ')}</div>
      <div className="text-xs text-al-text-muted mb-3">后排: {fleet.back.map(id => getShipName(id)).join(' / ')}</div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-al-text-dim">推荐等级: Lv.{fleet.recommendedLevel}</span>
        <span className="text-al-gold">查看详情 →</span>
      </div>
    </div>
  )
}
