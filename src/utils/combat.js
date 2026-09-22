import slotRules from '../data/slotRules.json'
import { EQUIP_STAT_LABELS, SHIP_STAT_LABELS } from '../constants/display.jsx'

// ─────────────────────────────────────────────────────────────────────────────
// 配装战力口径 v1
//
// 这不是游戏内数值，是自建口径。原因：游戏没有公布「战力」公式，官方面板也不
// 直接给出战力。本模型只做两件确定性的事：
//   ① 面板合成：舰娘基准面板 + Σ(装备加成 × 槽位武器效率 × 强化系数)
//   ② 三轴归一 + 公开权重 → 0–1000 的配装评分
// 第①步是纯算术、可逐件核验；第②步的权重与锚点是显式参数，改了立刻生效。
// 用途：同一艘船比较不同配装。不同舰种之间横向比较无意义（锚点按单舰面板量级设定）。
// ─────────────────────────────────────────────────────────────────────────────

export const COMBAT_MODEL = {
  version: 'v1',
  // 强化每级 +1%。自建参数，未经游戏实测校准，改这里即可全局生效。
  enhanceStep: 0.01,
  // 三轴锚点：把原始量归一到 0–1。锚点按本站已持有 13 艘的实测值域标定
  //（空装 195–480、配满 1695 之类），改动后跑 npm run test:engine 看值域诊断。
  axes: {
    weight: { gun: 1, torpedo: 1, plane: 1, shell: 0.5, dps: 6, hp: 1, spd: 2, hpBonus: 2, hpRecovery: 10, aaDps: 10 },
    anchor: { output: 1780, survival: 13200, antiair: 760 },
  },
  profiles: {
    balanced: { label: '均衡', output: 0.45, survival: 0.35, antiair: 0.2 },
    offense: { label: '输出', output: 0.72, survival: 0.18, antiair: 0.1 },
    tank: { label: '生存', output: 0.28, survival: 0.52, antiair: 0.2 },
    antiair: { label: '防空', output: 0.25, survival: 0.25, antiair: 0.5 },
  },
  // 分档衡量的是「这套配装发挥了多少配装空间」，不是舰娘自身强度：
  // 分母是同一艘船从空装到理论最优的分数跨度，所以驱逐舰配满也能拿 S。
  grades: [
    { min: 95, grade: 'S', tone: 'text-al-gold' },
    { min: 85, grade: 'A', tone: 'text-r-sr' },
    { min: 70, grade: 'B', tone: 'text-r-r' },
    { min: 50, grade: 'C', tone: 'text-al-text-muted' },
    { min: 0, grade: 'D', tone: 'text-al-text-dim' },
  ],
}

// 装备 type → DPS 分桶。用于把「防空 dps」与「对舰 dps」分开，两者不能相加。
const DPS_BUCKET = {
  炮击: 'dps_gun',
  鱼雷: 'dps_torp',
  防空: 'dps_aa',
  舰载机: 'dps_plane',
  弹药: 'dps_shell',
  设备: 'dps_aux',
  特殊兵装: 'dps_aux',
  水下装备: 'dps_torp',
}

// 受槽位武器效率缩放的属性：这些是「武器打出去的输出」，效率直接乘在上面。
// 命中/装填/机动/耐久加成属于装备带给舰船的属性，不受武器效率影响。
const WEAPON_SCALED = new Set(['fp', 'trp', 'aa', 'air'])

const EFFICIENCY_SLOTS = new Set(slotRules.efficiencySlots)

// 面板键的展示顺序。带 * 的键在舰娘基础面板里没有对应项，只显示装备增量。
export const PANEL_LAYOUT = [
  { key: 'hp', label: '耐久', kind: 'abs' },
  { key: 'fp', label: '炮击', kind: 'abs' },
  { key: 'trp', label: '雷击', kind: 'abs' },
  { key: 'aa', label: '防空', kind: 'abs' },
  { key: 'air', label: '航空', kind: 'abs' },
  { key: 'asw', label: '反潜', kind: 'abs' },
  { key: 'spd', label: '机动', kind: 'add' },
  { key: 'hit', label: '命中', kind: 'add' },
  { key: 'reload', label: '装填', kind: 'add' },
  { key: 'hp_bonus', label: '耐久加成', kind: 'add' },
  { key: 'hp_recovery', label: '耐久恢复', kind: 'add' },
]

export function basePanel(ship) {
  const s = ship?.stats ?? {}
  const panel = {}
  for (const { key } of PANEL_LAYOUT) panel[key] = typeof s[key] === 'number' ? s[key] : null
  return panel
}

// 该属性在舰娘基础面板里有没有基准值。没有的只能给增量，不能给终值。
export function hasBase(ship, key) {
  return typeof ship?.stats?.[key] === 'number'
}

export function canEquip(ship, slotType, equip) {
  const rule = slotRules.rules[slotType]
  if (!rule) return { ok: false, reason: 'unknown-slot' }
  if (!rule.types.includes(equip.type)) return { ok: false, reason: 'type' }
  if (rule.checkFit) {
    const fits = equip.fitShipTypes
    if (Array.isArray(fits) && fits.length > 0 && !fits.includes(ship.shipType)) {
      return { ok: false, reason: 'shipType' }
    }
  }
  return { ok: true }
}

export function slotEfficiency(ship, slotType) {
  const v = ship?.slotEfficiency?.[slotType]
  return typeof v === 'number' && v > 0 ? v : 1
}

// 单件装备对面板的贡献（已含槽位效率与强化）
export function contributionOf(equip, slotType, efficiency = 1, enhanced = 0) {
  const stats = equip?.stats ?? {}
  const gain = 1 + (Number(enhanced) || 0) * COMBAT_MODEL.enhanceStep
  const eff = EFFICIENCY_SLOTS.has(slotType) ? efficiency : 1
  const bucket = DPS_BUCKET[equip?.type] ?? 'dps_aux'
  const delta = {}
  for (const [k, v] of Object.entries(stats)) {
    if (k === 'speed' || typeof v !== 'number') continue // speed 是射速(秒)，不直接进面板
    if (k === 'dps') {
      delta[bucket] = (delta[bucket] ?? 0) + v * eff * gain
      continue
    }
    const scaled = WEAPON_SCALED.has(k) ? v * eff : v
    delta[k] = (delta[k] ?? 0) + scaled * gain
  }
  return delta
}

function emptyAxes() {
  return { output: 0, survival: 0, antiair: 0 }
}

// picks: 与 ship.slots 等长的数组，元素为 equipment 对象或 null
export function evaluateLoadout(ship, picks, profile = 'balanced') {
  const slots = ship?.slots ?? []
  const base = basePanel(ship)
  const panel = { ...base }
  const buckets = {}
  const items = []
  const missingBase = new Set() // 舰娘基础面板里没有该键 → 只能给增量

  slots.forEach((slotType, i) => {
    const equip = picks?.[i] ?? null
    if (!equip) {
      items.push({ slot: i, slotType, equip: null, efficiency: 1, delta: {} })
      return
    }
    const efficiency = slotEfficiency(ship, slotType)
    const delta = contributionOf(equip, slotType, efficiency, equip.enhanced)
    for (const [k, v] of Object.entries(delta)) {
      if (k.startsWith('dps_')) {
        buckets[k] = (buckets[k] ?? 0) + v
        continue
      }
      if (panel[k] == null) {
        panel[k] = 0 // 舰娘无基准：只累计装备增量
        missingBase.add(k)
      }
      panel[k] += v
    }
    items.push({ slot: i, slotType, equip, efficiency, delta })
  })

  const W = COMBAT_MODEL.axes.weight
  const dpsOffense =
    (buckets.dps_gun ?? 0) + (buckets.dps_torp ?? 0) + (buckets.dps_plane ?? 0) + (buckets.dps_shell ?? 0) * W.shell

  const raw = {
    output: (panel.fp ?? 0) * W.gun + (panel.trp ?? 0) * W.torpedo + (panel.air ?? 0) * W.plane + dpsOffense * W.dps,
    // 生存以耐久为主，装备能改动的只有机动 / 耐久加成 / 耐久恢复三处
    survival:
      (panel.hp ?? 0) * W.hp +
      (panel.spd ?? 0) * W.spd +
      (panel.hp_bonus ?? 0) * W.hpBonus +
      (panel.hp_recovery ?? 0) * W.hpRecovery,
    antiair: (panel.aa ?? 0) + (buckets.dps_aa ?? 0) * W.aaDps,
  }

  const anchor = COMBAT_MODEL.axes.anchor
  const norm = {
    output: Math.min(raw.output / anchor.output, 1),
    survival: Math.min(raw.survival / anchor.survival, 1),
    antiair: Math.min(raw.antiair / anchor.antiair, 1),
  }

  const w = COMBAT_MODEL.profiles[profile] ?? COMBAT_MODEL.profiles.balanced
  const score = Math.round((norm.output * w.output + norm.survival * w.survival + norm.antiair * w.antiair) * 1000)

  return {
    panel, base, buckets, raw, norm, axes: norm, score, items,
    missingBase: [...missingBase],
  }
}

// 配装效率：这套配装填满了「空装 → 理论最优」这段跨度的百分之多少
export function loadoutEfficiency(ev, emptyEv, idealEv) {
  const span = (idealEv?.score ?? 0) - (emptyEv?.score ?? 0)
  if (span <= 0) return 100
  const pct = Math.round(((ev.score - emptyEv.score) / span) * 100)
  return Math.max(0, Math.min(100, pct))
}

export function efficiencyGrade(pct) {
  return COMBAT_MODEL.grades.find(g => pct >= g.min) ?? COMBAT_MODEL.grades.at(-1)
}

export function statLabel(key) {
  return EQUIP_STAT_LABELS[key] ?? SHIP_STAT_LABELS[key] ?? key
}

// 空装评估：作为「配装带来多少增量」的基准
export function emptyEvaluation(ship, profile) {
  return evaluateLoadout(ship, new Array(ship?.slots?.length ?? 0).fill(null), profile)
}

export function panelDelta(after, before) {
  const out = {}
  for (const { key } of PANEL_LAYOUT) {
    const av = after[key]
    const bv = before[key]
    if (typeof av !== 'number' && typeof bv !== 'number') continue
    const d = (av ?? 0) - (bv ?? 0)
    if (d !== 0) out[key] = d
  }
  return out
}
