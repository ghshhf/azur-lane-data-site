import { Link } from 'react-router-dom'
import { RarityBadge } from '../utils/rarity.jsx'
import { EQUIP_STAT_LABELS, labelOf } from '../constants/display.jsx'

const typeColor = {
  '炮击': 'text-r-r', '鱼雷': 'text-r-sr', '防空': 'text-r-ssr',
  '舰载机': 'text-r-elite', '弹药': 'text-r-meta', '水下装备': 'text-t-ss',
  '设备': 'text-t-cl', '特殊兵装': 'text-t-cvl',
}

export default function EquipmentCard({ equip }) {
  return (
    <Link to={`/equipment/${equip.id}`} className="al-card block" aria-label={`${equip.name} 详情`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-al-text">{equip.name}</h3>
          <p className={`text-xs mt-0.5 ${typeColor[equip.type] || 'text-al-text-muted'}`}>{equip.type}</p>
        </div>
        <RarityBadge rarity={equip.rarity} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
        {equip.stats && Object.entries(equip.stats).map(([key, val]) => (
          <div key={key} className="flex flex-col">
            <span className="text-al-text-dim">{labelOf(EQUIP_STAT_LABELS, key)}</span>
            <span className="text-al-text font-medium">{val}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-al-text-muted">
        <span>评分: {equip.rating}</span>
        <span>适配: {equip.fitShipTypes?.join('/')}</span>
      </div>
      {equip.playerOwned && (
        <div className="mt-1.5 text-xs text-al-gold">
          已持有{equip.count ? ` ×${equip.count}` : ''}{equip.enhanced ? ` · 强化+${equip.enhanced}` : ''}
        </div>
      )}
    </Link>
  )
}
