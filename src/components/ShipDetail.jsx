import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Swords, Shield, Zap, Wind, Anchor, Crosshair, Heart, Cog } from 'lucide-react'
import ships from '../data/ships.json'
import equipment from '../data/equipment.json'
import { RarityBadge, rarityStars } from '../utils/rarity.jsx'
import { ShipTypeTag, getShipTypeColor } from '../utils/shipType.jsx'

const statIcons = { hp: Heart, fp: Swords, trp: Zap, aa: Shield, air: Wind, asw: Anchor, spd: Crosshair, luck: Cog }
const statLabels = { hp: '耐久', fp: '炮击', trp: '雷击', aa: '防空', air: '航空', asw: '反潜', spd: '航速', luck: '幸运' }

export default function ShipDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const ship = ships.find(s => s.id === id)
  if (!ship) return <div className="p-8 text-center text-al-text-muted">未找到该舰娘</div>

  return (
    <div>
      <button onClick={() => navigate(-1)} className="al-btn mb-4 flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> 返回</button>
      <div className="al-panel p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-al-text">{ship.name}</h1>
              <ShipTypeTag type={ship.shipType} />
              <RarityBadge rarity={ship.rarity} />
            </div>
            <p className="text-al-text-muted">{ship.nameEn} · {ship.faction} · Lv.{ship.levelCap}上限</p>
          </div>
          <div className={`text-3xl font-bold ${getShipTypeColor(ship.shipType)}`}>{rarityStars[ship.rarity]}</div>
        </div>

        <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><Swords className="w-4 h-4" /> 属性面板</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Object.entries(ship.stats).map(([key, val]) => {
            const Icon = statIcons[key] || Cog
            return (
              <div key={key} className="al-panel-light p-3">
                <div className="flex items-center gap-1.5 text-xs text-al-text-dim mb-1"><Icon className="w-3 h-3" /> {statLabels[key]}</div>
                <div className="text-xl font-bold text-al-text">{val}</div>
              </div>
            )
          })}
        </div>

        <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><Zap className="w-4 h-4" /> 技能</h2>
        <div className="space-y-3 mb-6">
          {ship.skills.map((skill, i) => (
            <div key={i} className="al-panel-light p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-al-text">{skill.name}</span>
                <span className="text-xs text-al-gold">Lv.{skill.level}</span>
              </div>
              <p className="text-sm text-al-text-muted">{skill.desc}</p>
            </div>
          ))}
        </div>

        <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><Shield className="w-4 h-4" /> 推荐装备</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {ship.equipment.recommended.map((equipName, i) => {
            const equip = equipment.find(e => e.name === equipName)
            return (
              <div key={i} className="al-panel-light p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm text-al-text font-medium">{equipName}</div>
                  {equip && <div className="text-xs text-al-text-dim">{equip.type} · {equip.rarity}</div>}
                </div>
                <span className="text-xs text-al-text-dim">槽位{i + 1}</span>
              </div>
            )
          })}
        </div>

        {ship.notes && (
          <div className="al-panel-light p-3">
            <div className="text-xs text-al-text-dim mb-1">备注</div>
            <p className="text-sm text-al-text">{ship.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
