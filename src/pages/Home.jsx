import { Link } from 'react-router-dom'
import { Anchor, Ship, Wrench, Users, MapPin, ArrowRight, TrendingUp, Star, Flag, Swords } from 'lucide-react'
import fleets from '../data/fleets.json'
import ships from '../data/ships.json'

const userFleets = fleets.filter(f => f.category === 'user')
const referenceFleets = fleets.filter(f => f.category !== 'user')

const ownedShips = ships.filter(s => s.playerInfo?.owned)
const lowLevelShips = ownedShips.filter(s => (s.playerInfo?.level || 0) < 90)

const quickLinks = [
  { to: '/ships', label: '舰娘图鉴', icon: Ship, desc: '查询全舰娘数据' },
  { to: '/equipment', label: '装备图鉴', icon: Wrench, desc: '装备属性与推荐' },
  { to: '/fleets', label: '阵容推荐', icon: Users, desc: '各类阵容搭配' },
  { to: '/stages', label: '关卡活动', icon: MapPin, desc: '掉落与活动信息' },
]

const stats = [
  { label: '我的舰娘', value: ownedShips.length, icon: Ship },
  { label: '总收录', value: ships.length, icon: Ship },
  { label: '我的装备', value: '16', icon: Wrench },
  { label: '我的舰队', value: userFleets.length, icon: Users },
]

export default function Home() {
  return (
    <div>
      <div className="al-panel p-8 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Anchor className="w-10 h-10 text-al-gold" />
          <h1 className="text-3xl font-bold text-al-text">碧蓝航线数据查询站</h1>
        </div>
        <p className="text-al-text-muted mb-4">我的数据 · 纯数据驱动 · AI 友好</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="al-panel-light p-3 text-center">
              <Icon className="w-5 h-5 text-al-gold mx-auto mb-1" />
              <div className="text-2xl font-bold text-al-text">{value}</div>
              <div className="text-xs text-al-text-muted">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {userFleets.length > 0 && (
        <div className="al-panel p-6 mb-6">
          <h2 className="text-al-gold font-semibold mb-4 flex items-center gap-2"><Flag className="w-4 h-4" /> 我的舰队</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {userFleets.map(fleet => (
              <Link key={fleet.id} to={`/fleets/${fleet.id}`} className="al-card block">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-al-text">{fleet.name}</h3>
                  <span className="al-badge border bg-al-gold/20 text-al-gold border-al-gold/30 text-xs">我的</span>
                </div>
                {fleet.aggregateStats && (
                  <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
                    {Object.entries(fleet.aggregateStats).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-1">
                        <span className="text-al-text-dim">{key === 'fp' ? '炮击' : key === 'trp' ? '雷击' : key === 'aa' ? '防空' : key === 'air' ? '航空' : key === 'control' ? '制空' : '消耗'}</span>
                        <span className="font-bold text-al-text">{val}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-al-text-muted">{fleet.description}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {lowLevelShips.length > 0 && (
        <div className="al-panel p-4 mb-6 border-l-4 border-l-yellow-500">
          <h2 className="text-yellow-500 font-semibold mb-3 text-sm">⚠ 待练级舰娘（低于Lv.90）</h2>
          <div className="flex flex-wrap gap-2">
            {lowLevelShips.map(s => (
              <Link key={s.id} to={`/ships/${s.id}`} className="al-tag bg-yellow-500/20 text-yellow-500 text-xs hover:bg-yellow-500/30">
                {s.name} Lv.{s.playerInfo?.level} → 目标Lv.90+
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {quickLinks.map(({ to, label, icon: Icon, desc }) => (
          <Link key={to} to={to} className="al-card text-center">
            <Icon className="w-6 h-6 text-al-gold mx-auto mb-2" />
            <div className="font-semibold text-al-text">{label}</div>
            <div className="text-xs text-al-text-muted mt-0.5">{desc}</div>
          </Link>
        ))}
      </div>

      <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> 推荐阵容（基于我的舰娘）</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {referenceFleets.slice(0, 4).map(f => (
          <Link key={f.id} to={`/fleets/${f.id}`} className="al-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-al-text">{f.name}</h3>
              <ArrowRight className="w-4 h-4 text-al-text-dim" />
            </div>
            <p className="text-xs text-al-text-muted">{f.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
