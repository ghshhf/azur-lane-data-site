import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Swords, Flag, Sparkles, Zap, Shield, Wind, Anchor } from 'lucide-react'
import fleets from '../data/fleets.json'
import ships from '../data/ships.json'
import { RarityBadge } from '../utils/rarity.jsx'
import { ShipTypeTag } from '../utils/shipType.jsx'

const categoryLabels = { user: '我的', boss: 'Boss', pvp: 'PvP', farm: '刷图', ex: 'EX', special: '特殊' }

const statIcons = { fp: Swords, trp: Zap, aa: Shield, air: Wind, control: Sparkles, cost: Anchor }
const statLabels = { fp: '炮击', trp: '雷击', aa: '防空', air: '航空', control: '制空', cost: '消耗' }

export default function FleetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fleet = fleets.find(f => f.id === id)
  if (!fleet) return <div className="p-8 text-center text-al-text-muted">未找到该阵容</div>

  const getShip = (sid) => ships.find(s => s.id === sid)

  const renderShip = (sid, i, position) => {
    const ship = getShip(sid)
    if (!ship) return null
    const isFlagship = fleet.flagship === sid
    const playerLevel = ship.playerInfo?.level
    const displayLevel = playerLevel || ship.levelCap
    const isLowLevel = playerLevel && playerLevel < 90
    const playerStats = ship.playerInfo?.fleetStats

    return (
      <div key={sid} className={`al-panel-light p-3 ${isLowLevel ? 'border-l-4 border-l-yellow-500' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-al-text-dim">#{i + 1}</span>
            {isFlagship && <Flag className="w-3 h-3 text-al-gold" />}
            <span className="font-semibold text-al-text">{ship.name}</span>
            <ShipTypeTag type={ship.shipType} />
            <RarityBadge rarity={ship.rarity} />
            {isLowLevel && <span className="text-xs text-yellow-500">⚠ 低等级</span>}
          </div>
          <div className="text-xs text-al-text-muted">
            {playerLevel ? `Lv.${playerLevel}（上限${ship.levelCap}）` : `Lv.${ship.levelCap}`}
          </div>
        </div>
        {playerStats && (
          <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
            {playerStats.hp && <div><span className="text-al-text-dim">耐久:</span> <span className="text-al-text font-medium">{playerStats.hp}</span></div>}
            {playerStats.fp && <div><span className="text-al-text-dim">炮击:</span> <span className="text-al-text font-medium">{playerStats.fp}</span></div>}
            {playerStats.trp && <div><span className="text-al-text-dim">雷击:</span> <span className="text-al-text font-medium">{playerStats.trp}</span></div>}
            {playerStats.综合性能 && <div className="col-span-3"><span className="text-al-text-dim">综合性能:</span> <span className="text-al-gold font-bold">{playerStats.综合性能}</span></div>}
          </div>
        )}
        {fleet.equipmentTips?.[sid] && (
          <div className="text-xs text-al-text-dim pl-4 border-l-2 border-al-border ml-1">
            <span className="text-al-text-muted">装备推荐：</span>{fleet.equipmentTips[sid]}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} className="al-btn mb-4 flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> 返回</button>
      <div className="al-panel p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-al-text">{fleet.name}</h1>
              <span className="al-badge border bg-al-gold/20 text-al-gold border-al-gold/30">{categoryLabels[fleet.category] || fleet.category}</span>
            </div>
            <p className="text-al-text-muted">{fleet.description}</p>
          </div>
          <div className="text-right text-al-text-muted">
            <div className="text-xs">推荐等级</div>
            <div className="text-xl font-bold text-al-gold">Lv.{fleet.recommendedLevel}</div>
          </div>
        </div>

        {fleet.aggregateStats && (
          <div className="al-panel-light p-4 mb-6">
            <div className="text-xs text-al-text-dim mb-2 font-medium">舰队总属性</div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {Object.entries(fleet.aggregateStats).map(([key, val]) => {
                const Icon = statIcons[key] || Swords
                return (
                  <div key={key} className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-al-text-dim mb-1">
                      <Icon className="w-3 h-3" /> {statLabels[key]}
                    </div>
                    <div className="text-lg font-bold text-al-text">{val}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> 前排</h2>
        <div className="space-y-3 mb-6">{fleet.front.map((sid, i) => renderShip(sid, i, 'front'))}</div>

        <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><Swords className="w-4 h-4" /> 后排</h2>
        <div className="space-y-3 mb-6">{fleet.back.map((sid, i) => renderShip(sid, i, 'back'))}</div>

        {fleet.notes && (
          <div className="al-panel-light p-3">
            <div className="text-xs text-al-text-dim mb-1">战术提示</div>
            <p className="text-sm text-al-text">{fleet.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
