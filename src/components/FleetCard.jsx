import { Link } from 'react-router-dom'
import { Flag } from 'lucide-react'
import { FLEET_STAT_LABELS, FLEET_STAT_ICONS, FLEET_CATEGORY_LABELS, FLEET_CATEGORY_COLORS, labelOf } from '../constants/display.jsx'

export default function FleetCard({ fleet, ships }) {
  const getShipName = (id) => ships?.find(s => s.id === id)?.name || `${id}（未收录）`
  const flagshipName = fleet.flagship ? getShipName(fleet.flagship) : null

  return (
    <Link to={`/fleets/${fleet.id}`} className="al-card block" aria-label={`${fleet.name} 详情`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-al-text">{fleet.name}</h3>
          <p className="text-xs text-al-text-dim mt-0.5">{fleet.description}</p>
        </div>
        <span className={`al-badge border ${FLEET_CATEGORY_COLORS[fleet.category] || ''}`}>
          {labelOf(FLEET_CATEGORY_LABELS, fleet.category)}
        </span>
      </div>

      {fleet.aggregateStats && (
        <div className="grid grid-cols-3 gap-1 mb-3 p-2 bg-al-panel-light rounded">
          {Object.entries(fleet.aggregateStats).map(([key, val]) => {
            const Icon = FLEET_STAT_ICONS[key]
            return (
              <div key={key} className="flex items-center gap-1 text-xs">
                {Icon && <Icon className="w-3 h-3 text-al-text-dim" />}
                <span className="text-al-text-dim">{labelOf(FLEET_STAT_LABELS, key)}</span>
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

      <div className="text-xs text-al-text-muted mb-1">前排: {fleet.front.map(getShipName).join(' / ')}</div>
      <div className="text-xs text-al-text-muted mb-3">后排: {fleet.back.map(getShipName).join(' / ')}</div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-al-text-dim">推荐等级: Lv.{fleet.recommendedLevel}</span>
        <span className="text-al-gold">查看详情 →</span>
      </div>
    </Link>
  )
}
