import { useNavigate } from 'react-router-dom'
import { RarityBadge } from '../utils/rarity.jsx'

const typeColor = {
  '炮击': 'text-r-r', '鱼雷': 'text-r-sr', '防空': 'text-r-ssr',
  '舰载机': 'text-r-elite', '弹药': 'text-r-meta', '水下装备': 'text-t-ss',
}

const statLabel = { fp: '炮击', trp: '雷击', aa: '防空', air: '航空', dps: 'DPS' }

export default function EquipmentCard({ equip }) {
  const navigate = useNavigate()
  return (
    <div className="al-card" onClick={() => navigate(`/equipment/${equip.id}`)}>
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
            <span className="text-al-text-dim">{statLabel[key] || key}</span>
            <span className="text-al-text font-medium">{val}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-al-text-muted">
        <span>评分: {equip.rating}</span>
        <span>适配: {equip.fitShipTypes?.join('/')}</span>
      </div>
    </div>
  )
}
