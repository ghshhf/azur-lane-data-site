import { canEquip, evaluateLoadout } from './combat.js'

// ─────────────────────────────────────────────────────────────────────────────
// 配装求解器
//
// 约束：① 槽位类型（slotRules）② 装备适配舰种（fitShipTypes，仅武器槽）③ 我的仓库（playerOwned + count）
// 目标：最大化 evaluateLoadout().score
//
// 为什么用求解器而不是让模型直接给配装：配装是带约束的组合优化，有确定解且可逐件回算；
// 模型给的方案既无法核验，也无法保证库存够用。模型的位置在解释结果，不在算结果。
//
// 注意：评分在三轴锚点处做了截断（clamp），截断之后目标不再可加，
// 因此逐槽独立取最优不再等于全局最优 —— 库存约束解与理论最优解必须走同一套搜索，
// 只放开库存约束。这样理论最优的可行域是前者的超集，必然 ≥。
// ─────────────────────────────────────────────────────────────────────────────

const TOP_K = 6
const MAX_NODES = 400000

export function stockOf(equip, occupied = {}) {
  const have = Number(equip?.count) || 1
  return have - (occupied[equip.id] ?? 0)
}

export function slotCandidates(ship, slotType, equipment, { ownedOnly = true } = {}) {
  const out = []
  for (const e of equipment) {
    if (ownedOnly && !e.playerOwned) continue
    if (!canEquip(ship, slotType, e).ok) continue
    out.push(e)
  }
  return out
}

function perSlotRanking(ship, equipment, profile, { ownedOnly }) {
  const slots = ship?.slots ?? []
  const empty = new Array(slots.length).fill(null)
  return slots.map((slotType, i) => {
    const all = slotCandidates(ship, slotType, equipment, { ownedOnly })
    const rank = all
      .map(e => {
        const probe = [...empty]
        probe[i] = e
        return { e, score: evaluateLoadout(ship, probe, profile).score }
      })
      .sort((a, b) => b.score - a.score)
    return { slotType, rank, top: rank.slice(0, TOP_K), total: all.length }
  })
}

// 核心搜索。ignoreStock=true 时放开库存上限 → 得到「理论最优」。
function search(ship, equipment, { profile = 'balanced', occupied = {}, ignoreStock = false, ownedOnly = true }) {
  const slots = ship?.slots ?? []
  const n = slots.length
  const perSlot = perSlotRanking(ship, equipment, profile, { ownedOnly })

  const blocked = perSlot
    .map((s, i) => ({ slot: i, slotType: s.slotType, reason: s.total === 0 ? 'no-candidate' : null }))
    .filter(x => x.reason)

  const used = { ...occupied }
  const picks = new Array(n).fill(null)
  let best = null
  let bestPicks = null
  let nodes = 0
  let truncated = false

  const walk = i => {
    if (nodes++ > MAX_NODES) {
      truncated = true
      return
    }
    if (i === n) {
      const ev = evaluateLoadout(ship, picks, profile)
      if (!best || ev.score > best.score) {
        best = ev
        bestPicks = [...picks]
      }
      return
    }
    picks[i] = null
    walk(i + 1)
    for (const { e } of perSlot[i].top) {
      if (!ignoreStock) {
        const have = Number(e.count) || 1
        const taken = used[e.id] ?? 0
        if (taken + 1 > have) continue
        used[e.id] = taken + 1
        picks[i] = e
        walk(i + 1)
        used[e.id] = taken
      } else {
        picks[i] = e
        walk(i + 1)
      }
    }
    picks[i] = null
  }
  walk(0)

  return { picks: bestPicks, evaluation: best, perSlot, blocked, truncated, nodes }
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
      slotType: ship.slots[i],
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
    perSlot: solved.perSlot,
    blocked: solved.blocked,
    gaps,
    coverage,
    truncated: solved.truncated || ideal.truncated,
  }
}

// 逐槽边际最优（忽略库存与截断），仅用于需求量估算这类粗略汇总，成本 O(槽×装备)
export function marginalPicks(ship, equipment, profile = 'balanced') {
  return perSlotRanking(ship, equipment, profile, { ownedOnly: false }).map(s => s.rank[0]?.e ?? null)
}

// 数据里记录的配装（ships.equipment.recommended）→ picks，用于「记录 vs 推荐」对比
export function recordedPicks(ship, equipment) {
  const slots = ship?.slots ?? []
  const byName = new Map(equipment.map(e => [e.name, e]))
  const list = ship?.equipment?.recommended ?? []
  return slots.map((slotType, i) => {
    const e = byName.get(list[i])
    if (!e) return null
    return canEquip(ship, slotType, e).ok ? e : null
  })
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
  return marginalPicks(ship, equipment, profile)
    .map((e, i) => (e ? { slot: i, slotType: ship.slots[i], equip: e, owned: !!e.playerOwned, have: Number(e.count) || 1 } : null))
    .filter(x => x && !x.owned)
}
