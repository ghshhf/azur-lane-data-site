import shipPanelsData from '../data/shipPanels.json'
import { EQUIP_STAT_LABELS, SHIP_STAT_LABELS } from '../constants/display.jsx'
import { slotLayout, slotSource, slotEfficiency, canEquip, equipShipType, shipTypeMismatch } from './slots.js'

// 槽位口径的实现在 slots.js（纯数据逻辑，数据校验脚本共用同一份）
export { slotLayout, slotSource, slotEfficiency, canEquip, equipShipType, shipTypeMismatch }

// ─────────────────────────────────────────────────────────────────────────────
// 配装战力口径 v2
//
// 数据来源分两层，务必分清：
//   ① 舰娘面板、槽位、槽位武器效率 —— 取自官方档案（shipPanels/shipSlots，见
//      scripts/fetch-official.mjs）。这部分是游戏内数值，不含自建假设。
//   ② 三轴归一权重、锚点、分档线 —— 自建。游戏不公布「战力」公式，这部分只能自定。
//
// 两件确定性的事：
//   a) 面板合成 = 舰娘基准面板 + Σ(装备属性 × 槽位武器效率 × 强化系数)
//   b) 三轴归一 + 公开权重 → 0–1000 评分
// a 是纯算术、可逐件回算；b 的参数全在 COMBAT_MODEL 里，改了立刻生效。
//
// 用途：同一艘船比较不同配装。不同舰种横向比分数无意义（锚点按单舰面板量级标定）。
//
// v2 修正的三处口径错误：
//   - 槽位：此前用 ships.json 的 slots（去重列举），阿拉巴马被记成 4 槽、丢掉全部 3 个副炮槽；
//     西弗吉尼亚多出 2 个游戏内不存在的设备槽。现改用官方槽位表。
//   - 面板：此前用 ships.stats（按舰种拍的概数，BB 偏大 71%~140%）。现改用官方分档面板按等级插值。
//   - 键名：舰娘的 spd 是航速、装备的 spd 是机动，此前同键相加，生存轴实际在拿航速当生存因子。
//     现统一为 eva=机动、spd=航速。
// ─────────────────────────────────────────────────────────────────────────────

export const COMBAT_MODEL = {
  version: 'v2',
  // 强化每级 +1%。自建参数，未经游戏实测校准。
  enhanceStep: 0.01,
  // 三轴锚点：把原始量归一到 0–1。按本站已持有舰娘的实测值域标定，
  // 调面板/槽位口径后必须跑 npm run test:engine 看值域诊断并重设。
  axes: {
    weight: { dps: 6, shell: 0.5, aaDps: 10, eva: 10, hpBonus: 2, hpRecovery: 10 },
    anchor: { output: 3930, survival: 8000, antiair: 1855 },
  },
  profiles: {
    balanced: { label: '均衡', output: 0.45, survival: 0.35, antiair: 0.2 },
    offense: { label: '输出', output: 0.72, survival: 0.18, antiair: 0.1 },
    tank: { label: '生存', output: 0.28, survival: 0.52, antiair: 0.2 },
    antiair: { label: '防空', output: 0.25, survival: 0.25, antiair: 0.5 },
  },
  // 分档衡量「这套配装发挥了多少配装空间」，不是舰娘自身强度：
  // 分母是同一艘船空装 → 理论最优的分数跨度，所以驱逐舰配满也能拿 S。
  grades: [
    { min: 95, grade: 'S', tone: 'text-al-gold' },
    { min: 85, grade: 'A', tone: 'text-r-sr' },
    { min: 70, grade: 'B', tone: 'text-r-r' },
    { min: 50, grade: 'C', tone: 'text-al-text-muted' },
    { min: 0, grade: 'D', tone: 'text-al-text-dim' },
  ],
}

// 装备 type → DPS 分桶。防空 dps 与对舰 dps 不能相加。
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

// 受槽位武器效率缩放的属性：武器打出去的输出。命中/装填/机动/耐久类不受影响。
const WEAPON_SCALED = new Set(['fp', 'trp', 'aa', 'air'])

// 这两类槽不受武器效率影响
const NO_EFFICIENCY = new Set(['设备', '特殊兵装'])

// 面板键的展示顺序。kind 只是提示，实际有无基准由数据决定。
export const PANEL_LAYOUT = [
  { key: 'hp', label: '耐久' },
  { key: 'fp', label: '炮击' },
  { key: 'trp', label: '雷击' },
  { key: 'aa', label: '防空' },
  { key: 'air', label: '航空' },
  { key: 'asw', label: '反潜' },
  { key: 'eva', label: '机动' },
  { key: 'spd', label: '航速' },
  { key: 'hit', label: '命中' },
  { key: 'reload', label: '装填' },
  { key: 'luck', label: '幸运' },
  { key: 'hp_bonus', label: '耐久加成' },
  { key: 'hp_recovery', label: '耐久恢复' },
]

// ── 面板 ────────────────────────────────────────────────────────────────────

const TIER_LEVEL = [
  ['base', 1],
  ['lv100', 100],
  ['lv120', 120],
  ['lv125', 125],
]

function interpAt(pts, lv) {
  if (!pts.length) return null
  if (lv <= pts[0][0]) return pts[0][1]
  const last = pts[pts.length - 1]
  if (lv >= last[0]) return last[1]
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[i + 1]
    if (lv >= x0 && lv <= x1) return Math.round(y0 + ((y1 - y0) * (lv - x0)) / (x1 - x0))
  }
  return last[1]
}

// 官方分档面板 → 指定等级的面板。改造船用改造档覆盖 100/120/125。
function officialPanel(ship, lv) {
  const entry = shipPanelsData.ships?.[ship?.id]
  if (!entry) return null
  const isRetro = /·改$/.test(ship?.name ?? '')
  const tiers = { ...entry.tiers }
  if (isRetro && entry.retrofit) Object.assign(tiers, entry.retrofit)

  const keys = new Set()
  for (const t of Object.values(tiers)) for (const k of Object.keys(t)) keys.add(k)

  const out = {}
  for (const k of keys) {
    const pts = []
    for (const [tier, level] of TIER_LEVEL) {
      const v = tiers[tier]?.[k]
      if (typeof v === 'number') pts.push([level, v])
    }
    const v = interpAt(pts, lv)
    if (v != null) out[k] = v
  }
  return Object.keys(out).length ? out : null
}

function sitePanel(ship) {
  const s = ship?.stats ?? {}
  const out = {}
  for (const { key } of PANEL_LAYOUT) if (typeof s[key] === 'number') out[key] = s[key]
  return out
}

export function panelSource(ship) {
  return shipPanelsData.ships?.[ship?.id] ? 'official' : 'site'
}

// 舰娘基准面板。level 缺省取该舰记录中的等级，未录入等级则按满级 125 估。
export function effectiveLevel(ship, level) {
  if (typeof level === 'number') return level
  const lv = ship?.playerInfo?.level
  return typeof lv === 'number' && lv > 0 ? lv : 125
}

const baseCache = new Map()

export function basePanel(ship, level) {
  const lv = effectiveLevel(ship, level)
  const key = `${ship?.id ?? '?'}@${lv}`
  const cached = baseCache.get(key)
  if (cached) return cached
  const out = officialPanel(ship, lv) ?? sitePanel(ship)
  baseCache.set(key, out)
  return out
}

export function hasBase(ship, key, level) {
  return typeof basePanel(ship, level)[key] === 'number'
}

// ── 合成与评分 ──────────────────────────────────────────────────────────────

// 单件装备对面板的贡献（已含槽位效率与强化）
export function contributionOf(equip, slot, enhanced = 0) {
  const stats = equip?.stats ?? {}
  const gain = 1 + (Number(enhanced) || 0) * COMBAT_MODEL.enhanceStep
  const eff = NO_EFFICIENCY.has(slot?.type) ? 1 : slotEfficiency(slot)
  const bucket = DPS_BUCKET[equip?.type] ?? 'dps_aux'
  const delta = {}
  for (const [k, v] of Object.entries(stats)) {
    if (k === 'speed' || typeof v !== 'number') continue // speed 是射速（秒），不进面板
    if (k === 'dps') {
      delta[bucket] = (delta[bucket] ?? 0) + v * eff * gain
      continue
    }
    const scaled = WEAPON_SCALED.has(k) ? v * eff : v
    delta[k] = (delta[k] ?? 0) + scaled * gain
  }
  return delta
}

// picks: 与 slotLayout(ship) 等长的数组，元素为 equipment 对象或 null
export function evaluateLoadout(ship, picks, profile = 'balanced', opts = {}) {
  const slots = opts.slots ?? slotLayout(ship)
  const base = basePanel(ship, opts.level)
  const panel = { ...base }
  const buckets = {}
  const items = []
  const missingBase = new Set()

  slots.forEach((slot, i) => {
    const equip = picks?.[i] ?? null
    if (!equip) {
      items.push({ slot: i, slotInfo: slot, equip: null, efficiency: slotEfficiency(slot), delta: {} })
      return
    }
    const delta = contributionOf(equip, slot, equip.enhanced)
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
    items.push({ slot: i, slotInfo: slot, equip, efficiency: slotEfficiency(slot), delta })
  })

  const W = COMBAT_MODEL.axes.weight
  const dpsOffense =
    (buckets.dps_gun ?? 0) + (buckets.dps_torp ?? 0) + (buckets.dps_plane ?? 0) + (buckets.dps_shell ?? 0) * W.shell

  const raw = {
    output: (panel.fp ?? 0) + (panel.trp ?? 0) + (panel.air ?? 0) + dpsOffense * W.dps,
    // 生存：耐久为主，机动与耐久类装备为辅。航速(spd)不参与 —— 它不改变承伤。
    survival:
      (panel.hp ?? 0) +
      (panel.eva ?? 0) * W.eva +
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
    panel,
    base,
    buckets,
    raw,
    norm,
    axes: norm,
    score,
    items,
    slots,
    missingBase: [...missingBase],
    panelSource: panelSource(ship),
    slotSource: slotSource(ship),
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
  return SHIP_STAT_LABELS[key] ?? EQUIP_STAT_LABELS[key] ?? key
}

// 空装评估：作为「配装带来多少增量」的基准
export function emptyEvaluation(ship, profile, opts = {}) {
  const slots = opts.slots ?? slotLayout(ship)
  return evaluateLoadout(ship, new Array(slots.length).fill(null), profile, { ...opts, slots })
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
