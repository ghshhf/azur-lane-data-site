import { ArrowLeft, Star, Shield, Target, MapPin, Info } from 'lucide-react'
import { useParams, Link } from 'react-router-dom'
import equipment from '../data/equipment.json'
import ships from '../data/ships.json'
import { RarityBadge } from '../utils/rarity.jsx'
import { ShipTypeTag } from '../utils/shipType.jsx'
import { EQUIP_STAT_LABELS, labelOf } from '../constants/display.jsx'
import { useDocumentTitle } from '../utils/useDocumentTitle.js'
import { useBackToList } from '../utils/useBackToList.js'

export default function EquipmentDetail() {
  const { id } = useParams()
  const equip = equipment.find(e => e.id === id)
  const goBack = useBackToList('/equipment')
  useDocumentTitle(equip?.name)

  if (!equip) {
    return (
      <div className="al-panel p-8 text-center">
        <p className="text-al-text-muted mb-4">未找到该装备（{id}）</p>
        <button onClick={goBack} className="al-btn">返回装备图鉴</button>
      </div>
    )
  }

  const fitShips = ships.filter(s => equip.fitShipTypes?.includes(s.shipType))

  return (
    <div>
      <button onClick={goBack} className="al-btn mb-4 flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> 返回</button>
      <div className="al-panel p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-al-text">{equip.name}</h1>
              <RarityBadge rarity={equip.rarity} />
            </div>
            <p className="text-al-text-muted">{equip.type} · 评分 {equip.rating}/10</p>
          </div>
          {equip.playerOwned && (
            <div className="text-right">
              <div className="text-xs text-al-text-dim">持有</div>
              <div className="text-xl font-bold text-al-gold">
                ×{equip.count ?? 1}{equip.enhanced ? ` · +${equip.enhanced}` : ''}
              </div>
            </div>
          )}
        </div>

        <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><Shield className="w-4 h-4" /> 属性</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {Object.entries(equip.stats || {}).map(([key, val]) => (
            <div key={key} className="al-panel-light p-3">
              <div className="text-xs text-al-text-dim">{labelOf(EQUIP_STAT_LABELS, key)}</div>
              <div className="text-xl font-bold text-al-text">{val}</div>
            </div>
          ))}
        </div>

        <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><Target className="w-4 h-4" /> 适配舰种</h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {(equip.fitShipTypes || []).map(t => <ShipTypeTag key={t} type={t} />)}
        </div>

        {fitShips.length > 0 && (
          <>
            <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><Star className="w-4 h-4" /> 已收录的适配舰娘</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
              {fitShips.map(s => (
                <Link key={s.id} to={`/ships/${s.id}`} className="al-panel-light p-2 text-sm text-al-text hover:border-al-gold/50 border border-transparent transition-colors">
                  {s.name}
                </Link>
              ))}
            </div>
          </>
        )}

        <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" /> 获取途径</h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {(equip.source || []).map(src => <span key={src} className="al-tag bg-al-panel-light text-al-text-muted">{src}</span>)}
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
