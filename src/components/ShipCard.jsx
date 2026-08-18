import { useNavigate } from 'react-router-dom'
import { RarityBadge } from '../utils/rarity.jsx'
import { ShipTypeTag } from '../utils/shipType.jsx'

const statLabel = { hp: '耐久', fp: '炮击', trp: '雷击', aa: '防空', air: '航空', asw: '反潜', spd: '航速', luck: '幸运' }

export default function ShipCard({ ship }) {
  const navigate = useNavigate()
  const owned = ship.playerInfo?.owned
  const playerLevel = ship.playerInfo?.level
  const inFleet = ship.playerInfo?.fleet
  const fleetLabel = inFleet === 'both' ? '双舰队' : inFleet === 1 ? '第1舰队' : inFleet === 2 ? '第2舰队' : null

  return (
    <div className={`al-card ${owned ? 'ring-1 ring-al-gold/30' : ''}`} onClick={() => navigate(`/ships/${ship.id}`)}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-al-text">{ship.name}</h3>
            <ShipTypeTag type={ship.shipType} />
            {owned && <span className="text-xs text-al-gold">★</span>}
          </div>
          <p className="text-xs text-al-text-dim mt-0.5">{ship.nameEn}</p>
        </div>
        <RarityBadge rarity={ship.rarity} />
      </div>
      <div className="flex items-center gap-3 text-xs text-al-text-muted mb-2">
        {playerLevel ? (
          <>
            <span className="text-al-gold font-semibold">Lv.{playerLevel}</span>
            <span className="text-al-text-dim">(上限{ship.levelCap})</span>
          </>
        ) : (
          <span>Lv.{ship.levelCap}</span>
        )}
        <span>{ship.faction}</span>
        {fleetLabel && <span className="text-al-gold">📍{fleetLabel}</span>}
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs">
        {ship.stats && Object.entries(ship.stats).slice(0, 8).map(([key, val]) => (
          <div key={key} className="flex flex-col">
            <span className="text-al-text-dim">{statLabel[key] || key}</span>
            <span className="text-al-text font-medium">{val}</span>
          </div>
        ))}
      </div>
      {ship.playerInfo?.fleetStats?.综合性能 && (
        <div className="mt-2 pt-2 border-t border-al-border text-xs">
          <span className="text-al-text-dim">综合性能: </span>
          <span className="text-al-gold font-bold">{ship.playerInfo.fleetStats.综合性能}</span>
        </div>
      )}
    </div>
  )
}
