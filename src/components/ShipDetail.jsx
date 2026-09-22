import { ArrowLeft, Swords, Shield, Zap, Wind, Anchor, Crosshair, Heart, Cog } from 'lucide-react'
import { useParams } from 'react-router-dom'
import ships from '../data/ships.json'
import equipment from '../data/equipment.json'
import { RarityBadge, rarityStars } from '../utils/rarity.jsx'
import { ShipTypeTag, getShipTypeColor } from '../utils/shipType.jsx'
import { SHIP_STAT_LABELS, SHIP_STAT_ICONS } from '../constants/display.jsx'
import { slotLayout, slotSource, slotEfficiency } from '../utils/combat.js'
import { recordedPicks } from '../utils/fit.js'
import { useDocumentTitle } from '../utils/useDocumentTitle.js'
import { useBackToList } from '../utils/useBackToList.js'

export default function ShipDetail() {
  const { id } = useParams()
  const ship = ships.find(s => s.id === id)
  const goBack = useBackToList('/ships')
  useDocumentTitle(ship?.name)

  if (!ship) {
    return (
      <div className="al-panel p-8 text-center">
        <p className="text-al-text-muted mb-4">未找到该舰娘（{id}）</p>
        <button onClick={goBack} className="al-btn">返回舰娘图鉴</button>
      </div>
    )
  }

  const slots = slotLayout(ship)
  const picks = recordedPicks(ship, equipment)
  // 记录里提到、但装备图鉴尚未收录的名字（详情页会漏显）
  const unmatched = [...new Set(ship.equipment?.recommended ?? [])].filter(n => !equipment.some(e => e.name === n))
  const recommendedCount = ship.equipment?.recommended?.length ?? 0

  return (
    <div>
      <button onClick={goBack} className="al-btn mb-4 flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> 返回</button>
      <div className="al-panel p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-al-text">{ship.name}</h1>
              <ShipTypeTag type={ship.shipType} />
              <RarityBadge rarity={ship.rarity} />
            </div>
            <p className="text-al-text-muted">{ship.nameEn} · {ship.faction} · Lv.{ship.levelCap} 上限</p>
          </div>
          <div className={`text-3xl font-bold ${getShipTypeColor(ship.shipType)}`}>{rarityStars[ship.rarity]}</div>
        </div>

        <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><Swords className="w-4 h-4" /> 属性面板</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Object.entries(ship.stats).map(([key, val]) => {
            const Icon = SHIP_STAT_ICONS[key] || Cog
            return (
              <div key={key} className="al-panel-light p-3">
                <div className="flex items-center gap-1.5 text-xs text-al-text-dim mb-1"><Icon className="w-3 h-3" /> {SHIP_STAT_LABELS[key] || key}</div>
                <div className="text-xl font-bold text-al-text">{val}</div>
              </div>
            )
          })}
        </div>

        <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><Zap className="w-4 h-4" /> 技能</h2>
        <div className="space-y-3 mb-6">
          {(ship.skills || []).map((skill, i) => (
            <div key={i} className="al-panel-light p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-al-text">{skill.name}</span>
                <span className="text-xs text-al-gold">Lv.{skill.level}</span>
              </div>
              <p className="text-sm text-al-text-muted">{skill.desc}</p>
            </div>
          ))}
        </div>

        <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><Shield className="w-4 h-4" /> 装备槽位</h2>
        <p className="text-xs text-al-text-dim mb-2">
          {slotSource(ship) === 'official'
            ? '槽位与武器效率取自官方档案（满突破值）'
            : '官方档案未收录该舰，槽位回退用本站记录、效率按 100% 计'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {picks.map((equip, i) => {
            const slot = slots[i]
            const isWeapon = slot?.type !== '设备' && slot?.type !== '特殊兵装'
            return (
              <div key={i} className="al-panel-light p-3">
                <div className="text-xs text-al-text-dim mb-1">
                  槽位{i + 1} · {slot?.type}
                  {isWeapon && <span className="ml-1">· 效率 {Math.round(slotEfficiency(slot) * 100)}%</span>}
                </div>
                <div className="text-sm text-al-text font-medium">
                  {equip?.name || (i < recommendedCount ? '未配置' : '空')}
                </div>
                {equip && <div className="text-xs text-al-text-dim mt-0.5">{equip.type} · {equip.rarity} · 评分 {equip.rating}</div>}
              </div>
            )
          })}
        </div>
        {unmatched.length > 0 && (
          <p className="text-xs text-yellow-500 mb-6 -mt-4">
            记录的配装里有 {unmatched.length} 件尚未收录进装备图鉴：{unmatched.join('、')}
          </p>
        )}

        {ship.equipment?.actual && (
          <>
            <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><Anchor className="w-4 h-4" /> 实装配置</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
              {Object.entries(ship.equipment.actual).map(([slot, name]) => (
                <div key={slot} className="al-panel-light p-2 text-xs">
                  <div className="text-al-text-dim">{slot}</div>
                  <div className="text-al-text text-sm">{name}</div>
                </div>
              ))}
            </div>
          </>
        )}

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
