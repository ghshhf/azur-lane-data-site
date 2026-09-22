import { Heart, Swords, Zap, Shield, Wind, Anchor, Crosshair, Cog, Sparkles } from 'lucide-react'

// 属性键 → 中文名。
// 键名口径（2026-09-22 统一）：eva=机动、spd=航速、speed=射速（秒）。
// 舰娘面板只给 spd，装备只给 eva；改名前两者同名不同义，会被误当作同一个量相加。
export const SHIP_STAT_LABELS = {
  hp: '耐久', fp: '炮击', trp: '雷击', aa: '防空',
  air: '航空', asw: '反潜', eva: '机动', spd: '航速',
  hit: '命中', reload: '装填', luck: '幸运',
  hp_bonus: '耐久加成', hp_recovery: '耐久恢复',
}

export const SHIP_STAT_ICONS = {
  hp: Heart, fp: Swords, trp: Zap, aa: Shield,
  air: Wind, asw: Anchor, eva: Wind, spd: Crosshair,
  hit: Crosshair, reload: Cog, luck: Cog,
  hp_bonus: Heart, hp_recovery: Heart,
}

export const EQUIP_STAT_LABELS = {
  fp: '炮击', trp: '雷击', aa: '防空', air: '航空', asw: '反潜',
  dps: 'DPS', speed: '射速', hit: '命中', reload: '装填',
  eva: '机动', hp_bonus: '耐久加成', hp_recovery: '耐久恢复',
}

export const FLEET_STAT_LABELS = {
  fp: '炮击', trp: '雷击', aa: '防空', air: '航空',
  control: '制空', cost: '消耗',
}

export const FLEET_STAT_ICONS = {
  fp: Swords, trp: Zap, aa: Shield, air: Wind,
  control: Sparkles, cost: Anchor,
}

export const FLEET_CATEGORY_LABELS = {
  user: '我的', boss: 'Boss', pvp: 'PvP', farm: '刷图', ex: 'EX', special: '特殊',
}

export const FLEET_CATEGORY_COLORS = {
  user: 'bg-al-gold/20 text-al-gold',
  boss: 'bg-r-meta/20 text-r-meta',
  pvp: 'bg-r-sr/20 text-r-sr',
  farm: 'bg-r-r/20 text-r-r',
  ex: 'bg-r-elite/20 text-r-elite',
  special: 'bg-t-cv/20 text-t-cv',
}

// 数据里出现未登记的键时回退为键名本身，而不是渲染成 undefined
export const labelOf = (map, key) => map[key] ?? key
