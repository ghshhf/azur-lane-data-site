import { ArrowLeft, Users, Swords, Flag } from 'lucide-react'
import { useParams } from 'react-router-dom'
import fleets from '../data/fleets.json'
import ships from '../data/ships.json'
import { RarityBadge } from '../utils/rarity.jsx'
import { ShipTypeTag } from '../utils/shipType.jsx'
import { FLEET_STAT_LABELS, FLEET_STAT_ICONS, FLEET_CATEGORY_LABELS, SHIP_STAT_LABELS, labelOf } from '../constants/display.jsx'
import { useDocumentTitle } from '../utils/useDocumentTitle.js'
import { useBackToList } from '../utils/useBackToList.js'

export default function FleetDetail() {
  const { id } = useParams()
  const fleet = fleets.find(f => f.id === id)
  const goBack = useBackToList('/fleets')
  useDocumentTitle(fleet?.name)

  if (!fleet) {
    return (
      <div className="al-panel p-8 text-center">
        <p className="text-al-text-muted mb-4">未找到该阵容（{id}）</p>
        <button onClick={goBack} className="al-btn">返回阵容推荐</button>
      </div>
    )
  }

  const renderShip = (sid, i) => {
    const ship = ships.find(s => s.id === sid)
    if (!ship) {
      return (
        <div key={sid} className="al-panel-light p-3 text-sm text-al-text-dim">
          #{i + 1} {sid}（该舰娘尚未收录进图鉴）
        </div>
      )
    }
    const isFlagship = fleet.flagship === sid
    const playerLevel = ship.playerInfo?.level
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
            {isLowLevel && <span className="text-xs text-yellow-500">低等级</span>}
          </div>
          <div className="text-xs text-al-text-muted">
            {playerLevel ? `Lv.${playerLevel}（上限${ship.levelCap}）` : `Lv.${ship.levelCap}`}
          </div>
        </div>
        {playerStats && (
          <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
            {['hp', 'fp', 'trp'].filter(k => playerStats[k]).map(k => (
              <div key={k}>
                <span className="text-al-text-dim">{SHIP_STAT_LABELS[k]}:</span>{' '}
                <span className="text-al-text font-medium">{playerStats[k]}</span>
              </div>
            ))}
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
      <button onClick={goBack} className="al-btn mb-4 flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> 返回</button>
      <div className="al-panel p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-al-text">{fleet.name}</h1>
              <span className="al-badge border bg-al-gold/20 text-al-gold border-al-gold/30">{labelOf(FLEET_CATEGORY_LABELS, fleet.category)}</span>
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
                const Icon = FLEET_STAT_ICONS[key]
                return (
                  <div key={key} className="text-center">
                    <div className="flex items-center justify-center gap-1 text-xs text-al-text-dim mb-1">
                      {Icon && <Icon className="w-3 h-3" />} {labelOf(FLEET_STAT_LABELS, key)}
                    </div>
                    <div className="text-lg font-bold text-al-text">{val}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> 前排</h2>
        <div className="space-y-3 mb-6">{(fleet.front || []).map(renderShip)}</div>

        <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><Swords className="w-4 h-4" /> 后排</h2>
        <div className="space-y-3 mb-6">{(fleet.back || []).map(renderShip)}</div>

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
