import slotRules from '../data/slotRules.json' with { type: 'json' }
import shipSlotsData from '../data/shipSlots.json' with { type: 'json' }

// ─────────────────────────────────────────────────────────────────────────────
// 槽位口径（纯数据逻辑，不依赖 React/JSX，供运行时与数据校验脚本共用）
//
// 槽位来源优先级：
//   ① 官方档案 src/data/shipSlots.json（scripts/fetch-official.mjs 生成）
//      —— slots[].count 即游戏内槽位数，等于官方 slots[].max（全库 1–4，已逐舰种核对）。
//   ② 回退：ships.json 的 slots 字段（本站手录，是「去重后的槽型列举」，数量不可信）
//
// 设备槽是补出来的：官方 slots 只列武器槽与改造类槽，碧蓝每艘船另有 2 个通用设备槽。
// 依据见 slotRules.json 的 notes 与 evidence。
// ─────────────────────────────────────────────────────────────────────────────

const AUX_SLOT = { types: ['设备', '弹药'], checkFit: false }
export const DEFAULT_AUX_SLOTS = 2

function mkSlot(type, types, checkFit, efficiency, source, official) {
  return { type, types, checkFit, efficiency, source, official: official ?? null }
}

const countOf = (list, v) => list.filter(x => x === v).length

function efficiencyOf(slot, ship) {
  const e = slot.eff ?? {}
  const isRetro = /·改$/.test(ship?.name ?? '')
  const v = isRetro && e.kai != null ? e.kai : e.max
  return typeof v === 'number' && v > 0 ? v / 100 : 1
}

export function slotLayout(ship) {
  const entry = shipSlotsData.ships?.[ship?.id]
  const site = ship?.slots ?? []
  const out = []
  const siteAux = countOf(site, '设备')

  if (entry) {
    for (const s of entry.slots) {
      const eff = efficiencyOf(s, ship)
      for (let i = 0; i < s.count; i++) {
        out.push(mkSlot(s.label, s.types, s.checkFit, eff, 'official', s.official))
      }
    }
  } else {
    for (const t of site) {
      if (t === '设备' || t === '特殊兵装') continue
      const r = slotRules.rules[t]
      out.push(mkSlot(t, r?.types ?? ['炮击'], r?.checkFit ?? true, 1, 'site'))
    }
  }

  const aux = Math.max(siteAux, DEFAULT_AUX_SLOTS)
  for (let i = 0; i < aux; i++) {
    out.push(mkSlot('设备', AUX_SLOT.types, AUX_SLOT.checkFit, 1, i < siteAux ? 'site' : 'default'))
  }
  return out
}

export function slotSource(ship) {
  return shipSlotsData.ships?.[ship?.id] ? 'official' : 'site'
}

// 适配判断用的舰种：官方档案有记录时以官方为准。
// 站内未持有条目的 shipType 有写错的（如 ark 站内写 DD、官方是航母），
// 若继续按站内舰种过滤，会出现「槽位是官方的、舰种是站内的」这种错配，整船槽位全空。
export function equipShipType(ship) {
  const entry = shipSlotsData.ships?.[ship?.id]
  return entry?.siteType ?? ship?.shipType
}

// 站内舰种与官方口径是否打架（供界面提示，不参与计算）
export function shipTypeMismatch(ship) {
  const entry = shipSlotsData.ships?.[ship?.id]
  if (!entry?.siteType || !ship?.shipType) return null
  return entry.siteType === ship.shipType ? null : { site: ship.shipType, official: entry.siteType }
}

export function slotEfficiency(slot) {
  return typeof slot?.efficiency === 'number' && slot.efficiency > 0 ? slot.efficiency : 1
}

export function canEquip(ship, slot, equip) {
  const types = slot?.types ?? slotRules.rules[slot?.type]?.types ?? []
  if (!types.length) return { ok: false, reason: 'unknown-slot' }
  if (!types.includes(equip?.type)) return { ok: false, reason: 'type' }
  if (slot?.checkFit) {
    const fits = equip.fitShipTypes
    const st = equipShipType(ship)
    if (Array.isArray(fits) && fits.length > 0 && !fits.includes(st)) {
      return { ok: false, reason: 'shipType' }
    }
  }
  return { ok: true }
}

// 只保留展开后的槽位类型集合，供校验脚本等场景使用
export function slotTypesOf(ship) {
  return slotLayout(ship).map(s => s.type)
}
