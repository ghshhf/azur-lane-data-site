// 引擎自检：断言配装求解与战力评估的确定性性质，并打印各舰数值供人工核对。
// 由 scripts/test-engine.mjs 经 vite --ssr 打包后调用。
import ships from '../../src/data/ships.json'
import equipment from '../../src/data/equipment.json'
import slotRules from '../../src/data/slotRules.json'
import {
  evaluateLoadout,
  emptyEvaluation,
  canEquip,
  COMBAT_MODEL,
  loadoutEfficiency,
  slotLayout,
  basePanel,
  panelSource,
  slotSource,
} from '../../src/utils/combat.js'
import { solveLoadout, recordedPicks, recordedExcess, inventoryAudit, stockOf } from '../../src/utils/fit.js'

const REASONS = new Set(['not-owned', 'stock-exhausted'])
const PROFILES = Object.keys(COMBAT_MODEL.profiles)

export function runEngineChecks() {
  const fail = []
  const lines = []
  const check = (cond, msg) => { if (!cond) fail.push(msg) }

  // 0. 槽位规则覆盖率：实际展开出的每个槽位类型都必须有可装性规则
  const layouts = new Map(ships.map(s => [s.id, slotLayout(s)]))
  const slotTypes = [...new Set([...layouts.values()].flat().map(x => x.type))]
  for (const t of slotTypes) {
    check(!!slotRules.rules[t], `slotRules 缺少槽位类型规则：${t}`)
  }
  lines.push(`槽位类型 ${slotTypes.length} 种，规则覆盖 ${slotTypes.filter(t => slotRules.rules[t]).length} 种`)

  // 0b. 官方档案接入情况：槽位总数必须 ≥ 设备槽数 + 官方武器槽数
  const fromOfficial = ships.filter(s => slotSource(s) === 'official').length
  const panelFromOfficial = ships.filter(s => panelSource(s) === 'official').length
  lines.push(`数据来源：槽位用官方档案 ${fromOfficial}/${ships.length} 艘 · 面板用官方档案 ${panelFromOfficial}/${ships.length} 艘`)

  // 0c. 面板插值单调：等级越高，面板值不应下降
  for (const ship of ships) {
    const at60 = basePanel(ship, 60)
    const at125 = basePanel(ship, 125)
    for (const k of ['hp', 'fp', 'trp', 'aa']) {
      if (typeof at60[k] === 'number' && typeof at125[k] === 'number') {
        check(at125[k] >= at60[k], `${ship.id} 面板插值在 ${k} 上非单调：Lv60=${at60[k]} Lv125=${at125[k]}`)
      }
    }
    check((at125.hp ?? 0) > 0, `${ship.id} 面板缺少耐久基准`)
  }

  for (const ship of ships) {
    const n = layouts.get(ship.id).length
    const empty = emptyEvaluation(ship, 'balanced')

    for (const profile of PROFILES) {
      const emptyP = emptyEvaluation(ship, profile)
      const solved = solveLoadout(ship, equipment, { profile })
      const theoryEval = solved.theoreticalEvaluation

      check(solved.picks?.length === n, `${ship.id}[${profile}] 结果长度 ${solved.picks?.length} ≠ 槽位数 ${n}`)
      check(solved.evaluation.score >= emptyP.score, `${ship.id}[${profile}] 配装评分低于空装`)
      check(theoryEval.score >= solved.evaluation.score, `${ship.id}[${profile}] 理论最优低于库存约束最优`)
      check(solved.coverage >= 0 && solved.coverage <= 100, `${ship.id}[${profile}] 发挥度越界 ${solved.coverage}`)
      for (const g of solved.gaps) check(REASONS.has(g.reason), `${ship.id}[${profile}] 缺口原因非法：${g.reason}`)

      // 配装效率：空装 0、理论最优 100、区间内单调
      const pctEmpty = loadoutEfficiency(emptyP, emptyP, theoryEval)
      const pctIdeal = loadoutEfficiency(theoryEval, emptyP, theoryEval)
      const pctSolved = loadoutEfficiency(solved.evaluation, emptyP, theoryEval)
      check(pctEmpty === 0, `${ship.id}[${profile}] 空装配装效率应为 0，实际 ${pctEmpty}`)
      check(pctIdeal === 100, `${ship.id}[${profile}] 理论最优配装效率应为 100，实际 ${pctIdeal}`)
      check(pctSolved >= 0 && pctSolved <= 100, `${ship.id}[${profile}] 配装效率越界 ${pctSolved}`)
      check(pctSolved <= pctIdeal, `${ship.id}[${profile}] 配装效率高于理论上限`)

      // 库存记账：同一件装备的使用次数不得超过 count
      const tally = {}
      for (const p of solved.picks ?? []) if (p) tally[p.id] = (tally[p.id] ?? 0) + 1
      for (const [id, used] of Object.entries(tally)) {
        const e = equipment.find(x => x.id === id)
        check(used <= (Number(e.count) || 1), `${ship.id}[${profile}] ${id} 用超库存 ${used}/${Number(e.count) || 1}`)
      }
      // 每件入选装备都必须真的能装进该槽
      ;(solved.picks ?? []).forEach((p, i) => {
        const slot = solved.slots[i]
        if (p) check(canEquip(ship, slot, p).ok, `${ship.id}[${profile}] ${p.name} 不能装进 ${slot?.type}`)
      })
    }

    const solved = solveLoadout(ship, equipment, { profile: 'balanced' })
    const recorded = recordedPicks(ship, equipment)
    const recordedEval = recorded.some(Boolean) ? evaluateLoadout(ship, recorded, 'balanced') : null
    lines.push(
      [
        ship.name.padEnd(10),
        ship.shipType.padEnd(4),
        `空装 ${String(empty.score).padStart(3)}`,
        `实况 ${String(recordedEval?.score ?? '-').padStart(3)}`,
        `仓库最优 ${String(solved.evaluation.score).padStart(3)}`,
        `理论最优 ${String(solved.theoreticalEvaluation.score).padStart(3)}`,
        `发挥 ${String(solved.coverage).padStart(3)}%`,
        `缺口 ${solved.gaps.length}`,
        solved.blocked.length ? `空槽 ${solved.blocked.length}` : '',
      ].join('  '),
    )
  }

  lines.push('')
  lines.push('三轴 raw 值域（用于校准 COMBAT_MODEL.axes.anchor）：')
  const ranges = { output: [], survival: [], antiair: [] }
  for (const ship of ships) {
    if (!ship.playerInfo?.owned) continue
    const lo = emptyEvaluation(ship, 'balanced')
    const hi = solveLoadout(ship, equipment, { profile: 'balanced' }).theoreticalEvaluation
    for (const a of Object.keys(ranges)) ranges[a].push([lo.raw[a], hi.raw[a], ship.name])
  }
  for (const [axis, rows] of Object.entries(ranges)) {
    const minLo = Math.min(...rows.map(r => r[0]))
    const maxLo = Math.max(...rows.map(r => r[0]))
    const maxHi = Math.max(...rows.map(r => r[1]))
    lines.push(
      `  ${axis.padEnd(9)} 空装 ${Math.round(minLo)}–${Math.round(maxLo)}　配满 ${Math.round(maxHi)}　` +
        `建议锚点 ${Math.round(maxHi / 0.95)}（锚点取配满值的 95% 分位）`,
    )
  }

  lines.push('')
  lines.push('数据记录的配装 vs 我的库存（超出=同一件装备重复计入超过持有量）')
  let excessShips = 0
  for (const ship of ships) {
    const excess = recordedExcess(ship, equipment)
    if (!excess.length) continue
    excessShips++
    lines.push(
      `  ${ship.name.padEnd(10)} ` +
        excess.map(x => `${x.equip.name} 记录需 ${x.need} / 有 ${x.have}${x.owned ? '' : '（未持有）'}`).join('；'),
    )
  }
  lines.push(`  受影响舰娘 ${excessShips}/${ships.length}`)
  for (const ship of ships) {
    for (const x of recordedExcess(ship, equipment)) {
      check(x.need > x.have, `${ship.id} recordedExcess 误报 ${x.equip?.id}`)
    }
  }

  lines.push('')
  lines.push('全舰队库存缺口（按各船逐槽边际最优汇总）：')
  const audit = inventoryAudit(ships, equipment, 'balanced')
  for (const r of audit.slice(0, 20)) {
    lines.push(`  ${r.equip.name.padEnd(24)} 需 ${String(r.need).padStart(2)} 件 / 有 ${r.have} → 缺 ${r.shortage}${r.owned ? '' : '（未持有）'}`)
  }
  lines.push(`  合计缺口条目 ${audit.length}`)

  lines.push('')
  lines.push(`库存总件数校验：持有装备 ${equipment.filter(e => e.playerOwned).length} 种 / ${equipment.filter(e => e.playerOwned).reduce((a, e) => a + (Number(e.count) || 1), 0)} 件`)
  const occupiedProbe = {}
  for (const e of equipment.slice(0, 3)) occupiedProbe[e.id] = Number(e.count) || 1
  for (const e of equipment.slice(0, 3)) check(stockOf(e, occupiedProbe) === 0, `stockOf 记账错误 ${e.id}`)

  return { fail, lines }
}
