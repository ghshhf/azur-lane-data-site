import { canEquip, evaluateLoadout, slotLayout } from './combat.js'

// ─────────────────────────────────────────────────────────────────────────────
// 配装求解器
//
// 约束：① 槽位类型（slotRules + 官方槽位表）② 装备适配舰种（fitShipTypes，仅武器槽）
//      ③ 我的仓库（playerOwned + count）
// 目标：最大化 evaluateLoadout().score
//
// 为什么用求解器而不是让模型直接给配装：配装是带约束的组合优化，有确定解且可逐件回算；
// 模型给的方案既无法核验，也无法保证库存够用。模型的位置在解释结果，不在算结果。
//
// 注意：评分在三轴锚点处做了截断（clamp），截断之后目标不再可加，
// 因此逐槽独立取最优不再等于全局最优 —— 库存约束解与理论最优解必须走同一套搜索，
// 只放开库存约束。这样理论最优的可行域是前者的超集，必然 ≥。
// ─────────────────────────────────────────────────────────────────────────────

const TOP_K = 5
const MAX_NODES = 400000

export function stockOf(equip, occupied = {}) {
  const have = Number(equip?.count) || 1
  return have - (occupied[equip.id] ?? 0)
}

export function slotCandidates(ship, slot, equipment, { ownedOnly = true } = {}) {
  const out = []
  for (const e of equipment) {
    if (ownedOnly && !e.playerOwned) continue
    if (!canEquip(ship, slot, e).ok) continue
    out.push(e)
  }
  return out
}

function perSlotRanking(ship, slots, equipment, profile, { ownedOnly }) {
  const empty = new Array(slots.length).fill(null)
  return slots.map((slot, i) => {
    const all = slotCandidates(ship, slot, equipment, { ownedOnly })
    const rank = all
      .map((e, idx) => {
        const probe = [...empty]
        probe[i] = e
        return { e, idx, score: evaluateLoadout(ship, probe, profile, { slots }).score }
      })
      .sort((a, b) => b.score - a.score)
    return { slot, rank, top: rank.slice(0, TOP_K), total: all.length }
  })
}

// 同型槽（类型、效率、候选集都相同）在语义上可互换 —— 三连主炮槽装 A、B、C 与装 C、B、A 是同一套配装。
// 强制候选下标非递减即可剪掉 3! 这类排列重复。槽位改真实后战列舰有 9 槽，这一步是必需的。
function symmetricFlags(perSlot) {
  return perSlot.map((s, i) => {
    if (i === 0) return false
    const p = perSlot[i - 1]
    return s.slot.type === p.slot.type && s.slot.efficiency === p.slot.efficiency && s.total === p.total
  })
}

// 核心搜索。ignoreStock=true 时放开库存上限 → 得到「理论最优」。
function search(ship, equipment, { profile = 'balanced', occupied = {}, ignoreStock = false, ownedOnly = true }) {
  const slots = slotLayout(ship)
  const n = slots.length
  const perSlot = perSlotRanking(ship, slots, equipment, profile, { ownedOnly })
  const sym = symmetricFlags(perSlot)

  const blocked = perSlot
    .map((s, i) => ({ slot: i, slotType: s.slot.type, reason: s.total === 0 ? 'no-candidate' : null }))
    .filter(x => x.reason)

  const used = { ...occupied }
  const picks = new Array(n).fill(null)
  const seq = new Array(n).fill(-1)
  let best = null
  let bestPicks = null
  let nodes = 0
  let truncated = false

  const EMPTY_SEQ = Number.MAX_SAFE_INTEGER

  const walk = i => {
    if (nodes++ > MAX_NODES) {
      truncated = true
      return
    }
    if (i === n) {
      const ev = evaluateLoadout(ship, picks, profile, { slots })
      if (!best || ev.score > best.score) {
        best = ev
        bestPicks = [...picks]
      }
      return
    }

    // 同型槽：装备按名次非递减、空位排在最后，从而剪掉排列重复
    const options = [...perSlot[i].top, null]
    const ordered = sym[i] ? options : [null, ...perSlot[i].top]

    for (const item of ordered) {
      const s = item ? item.idx : EMPTY_SEQ
      if (sym[i] && s < seq[i - 1]) continue
      let taken = -1
      if (item && !ignoreStock) {
        const have = Number(item.e.count) || 1
        taken = used[item.e.id] ?? 0
        if (taken + 1 > have) continue
        used[item.e.id] = taken + 1
      }
      picks[i] = item ? item.e : null
      seq[i] = s
      walk(i + 1)
      if (taken >= 0) used[item.e.id] = taken
      picks[i] = null
    }
    seq[i] = -1
  }
  walk(0)

  return { picks: bestPicks, evaluation: best, perSlot, slots, blocked, truncated, nodes }
}

export function solveLoadout(ship, equipment, { profile = 'balanced', occupied = {} } = {}) {
  const solved = search(ship, equipment, { profile, occupied, ignoreStock: false })
  const ideal = search(ship, equipment, { profile, occupied, ignoreStock: true })

  // 缺口：理论最优用得上、但仓库里拿不到的槽位
  const gaps = []
  ;(ideal.picks ?? []).forEach((want, i) => {
    if (!want) return
    if (solved.picks?.[i]?.id === want.id) return
    const have = Number(want.count) || 1
    const reason = !want.playerOwned ? 'not-owned' : have - (occupied[want.id] ?? 0) <= 0 ? 'stock-exhausted' : 'outranked'
    if (reason === 'outranked') return
    gaps.push({
      slot: i,
      slotType: ideal.slots[i]?.type ?? '',
      want,
      have,
      owned: !!want.playerOwned,
      reason,
      alternative: solved.picks?.[i] ?? null,
    })
  })

  const coverage =
    ideal.evaluation?.score > 0 ? Math.round((solved.evaluation.score / ideal.evaluation.score) * 100) : 100

  return {
    picks: solved.picks,
    evaluation: solved.evaluation,
    theoretical: ideal.picks,
    theoreticalEvaluation: ideal.evaluation,
    slots: solved.slots,
    perSlot: solved.perSlot,
    blocked: solved.blocked,
    gaps,
    coverage,
    truncated: solved.truncated || ideal.truncated,
  }
}

// 逐槽边际最优（忽略库存与截断），仅用于需求量估算这类粗略汇总，成本 O(槽×装备)
export function marginalPicks(ship, equipment, profile = 'balanced') {
  const slots = slotLayout(ship)
  return perSlotRanking(ship, slots, equipment, profile, { ownedOnly: false }).map(s => s.rank[0]?.e ?? null)
}

// 数据里记录的配装（ships.equipment.recommended）→ picks
// 记录是按旧的槽位列表顺序写的，槽位表换成官方口径后长度会变，所以按「哪件装备能装进哪个空槽」
// 顺序落位，而不是按索引硬对 —— 否则战列舰多出来的副炮槽会把后面的装备整体挤错位。
export function recordedPicks(ship, equipment) {
  const slots = slotLayout(ship)
  const byName = new Map(equipment.map(e => [e.name, e]))
  const picks = new Array(slots.length).fill(null)
  const taken = new Set()
  for (const name of ship?.equipment?.recommended ?? []) {
    const e = byName.get(name)
    if (!e) continue
    const i = slots.findIndex((s, idx) => !taken.has(idx) && canEquip(ship, s, e).ok)
    if (i < 0) continue
    taken.add(i)
    picks[i] = e
  }
  return picks
}

// 记录的配装里有多少件超出库存（未持有 / 件数不够）——「数据记录的配装能不能真的穿上」
export function recordedExcess(ship, equipment) {
  const tally = {}
  const picks = recordedPicks(ship, equipment)
  for (const e of picks) if (e) tally[e.id] = (tally[e.id] ?? 0) + 1
  const out = []
  for (const [id, used] of Object.entries(tally)) {
    const e = equipment.find(x => x.id === id)
    const have = Number(e?.count) || 1
    if (used > have) out.push({ equip: e, need: used, have, owned: !!e?.playerOwned })
  }
  return out
}

// 全舰队库存盘点：按各船逐槽边际最优汇总需求，与持有量对比
export function inventoryAudit(ships, equipment, profile = 'balanced') {
  const demand = new Map()
  for (const ship of ships) {
    for (const e of marginalPicks(ship, equipment, profile)) {
      if (!e) continue
      demand.set(e.id, (demand.get(e.id) ?? 0) + 1)
    }
  }
  const byId = new Map(equipment.map(e => [e.id, e]))
  const rows = []
  for (const [id, need] of demand) {
    const e = byId.get(id)
    const have = Number(e?.count) || 1
    if (need <= have) continue
    rows.push({ equip: e, need, have, shortage: need - have, owned: !!e?.playerOwned, type: e?.type })
  }
  rows.sort((a, b) => b.shortage - a.shortage)
  return rows
}

// 该船理论最优里、仓库一件都没有的装备 —— 用于「该刷什么」
export function missingForShip(ship, equipment, profile = 'balanced') {
  const slots = slotLayout(ship)
  return marginalPicks(ship, equipment, profile)
    .map((e, i) => (e ? { slot: i, slotType: slots[i]?.type ?? '', equip: e, owned: !!e.playerOwned, have: Number(e.count) || 1 } : null))
    .filter(x => x && !x.owned)
}
