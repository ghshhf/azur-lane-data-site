import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, Shield, Target, MapPin, Info } from 'lucide-react'
import equipment from '../data/equipment.json'
import ships from '../data/ships.json'
import { RarityBadge } from '../utils/rarity.jsx'

const statLabels = { fp: '炮击', trp: '雷击', aa: '防空', air: '航空', dps: 'DPS' }

export default function EquipmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const equip = equipment.find(e => e.id === id)
  if (!equip) return <div className="p-8 text-center text-al-text-muted">未找到该装备</div>

  const fitShips = ships.filter(s => equip.fitShipTypes?.includes(s.shipType))

  return (
    <div>
      <button onClick={() => navigate(-1)} className="al-btn mb-4 flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> 返回</button>
      <div className="al-panel p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-al-text">{equip.name}</h1>
              <RarityBadge rarity={equip.rarity} />
            </div>
            <p className="text-al-text-muted">{equip.type} · 评分 {equip.rating}/10</p>
          </div>
        </div>

        <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><Shield className="w-4 h-4" /> 属性</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {Object.entries(equip.stats).map(([key, val]) => (
            <div key={key} className="al-panel-light p-3">
              <div className="text-xs text-al-text-dim">{statLabels[key] || key}</div>
              <div className="text-xl font-bold text-al-text">{val}</div>
            </div>
          ))}
        </div>

        <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><Target className="w-4 h-4" /> 适配舰种</h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {equip.fitShipTypes?.map(t => <span key={t} className="al-tag bg-al-panel-light text-al-text-muted">{t}</span>)}
        </div>

        {fitShips.length > 0 && (
          <>
            <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><Star className="w-4 h-4" /> 适配舰娘</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
              {fitShips.map(s => <div key={s.id} className="al-panel-light p-2 text-sm text-al-text">{s.name}</div>)}
            </div>
          </>
        )}

        <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" /> 获取途径</h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {equip.source?.map(src => <span key={src} className="al-tag bg-al-panel-light text-al-text-muted">{src}</span>)}
        </div>

        {equip.description && (
          <div className="al-panel-light p-3">
            <div className="flex items-center gap-1 text-xs text-al-text-dim mb-1"><Info className="w-3 h-3" /> 说明</div>
            <p className="text-sm text-al-text">{equip.description}</p>
          </div>
        )}
      </div>
    </div>
  )
}
