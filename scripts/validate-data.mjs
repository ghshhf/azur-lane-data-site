#!/usr/bin/env node
// 数据校验：主键唯一性、引用完整性、必填字段、枚举一致性。
// 用法：npm run validate（构建前自动执行，prebuild 钩子）
// 失败即退出码 1，用于挡住「JSON 能解析但引用已断」这类静默数据错误。
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const load = (name) => JSON.parse(readFileSync(join(root, 'src', 'data', name), 'utf8'))

const errors = []
const warnings = []
const strict = process.argv.includes('--strict')
const fail = (msg) => errors.push(msg)
const warn = (msg) => warnings.push(msg)

const ships = load('ships.json')
const equipment = load('equipment.json')
const fleets = load('fleets.json')
const stages = load('stages.json')
const meta = load('meta.json')

// 1. 主键唯一
function checkUnique(rows, label) {
  const seen = new Set()
  for (const row of rows) {
    const id = row?.id
    if (!id) { fail(`${label}：存在缺少 id 的记录`); continue }
    if (seen.has(id)) fail(`${label}：id 重复 -> ${id}（同一条数据出现两次，列表渲染会出现 key 冲突）`)
    seen.add(id)
  }
  return seen
}
const shipIds = checkUnique(ships, 'ships.json')
const equipIds = checkUnique(equipment, 'equipment.json')
checkUnique(fleets, 'fleets.json')
checkUnique(stages, 'stages.json')

// 2. 必填字段
const required = {
  ships: [['name', '名称'], ['nameEn', '英文名'], ['rarity', '稀有度'], ['shipType', '舰种'], ['faction', '阵营'], ['levelCap', '等级上限'], ['stats', '属性'], ['slots', '槽位'], ['skills', '技能'], ['equipment', '装备']],
  equipment: [['name', '名称'], ['rarity', '稀有度'], ['type', '类型'], ['stats', '属性'], ['fitShipTypes', '适配舰种'], ['rating', '评分']],
  fleets: [['name', '名称'], ['category', '分类'], ['front', '前排'], ['back', '后排'], ['recommendedLevel', '推荐等级']],
  stages: [['name', '名称'], ['chapter', '章节'], ['difficulty', '难度'], ['drops', '掉落']],
}
for (const [file, fields] of Object.entries(required)) {
  const rows = { ships, equipment, fleets, stages }[file]
  const label = `${file}.json`
  for (const row of rows) {
    for (const [key, cn] of fields) {
      const v = row[key]
      if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) {
        fail(`${label}：${row.id ?? '(无 id)'} 缺少必填字段 ${key}（${cn}）`)
      }
    }
  }
}

// 3. 引用完整性
// 本站是部分收录（见 meta.scope），引用到「尚未收录」的实体属正常情况，
// 详情页会降级显示为「未收录」，故记为提示；结构性问题（重复 id / 缺字段）才是错误。
// 需要严格模式时用 npm run validate -- --strict 把提示一并视为失败。
const equipNames = new Set(equipment.map(e => e.name))
for (const ship of ships) {
  for (const name of ship.equipment?.recommended ?? []) {
    if (!equipNames.has(name)) {
      warn(`ships.json：${ship.id} 推荐装备「${name}」不在 equipment.json 中（详情页会标注未收录）`)
    }
  }
}
for (const fleet of fleets) {
  for (const sid of [...(fleet.front ?? []), ...(fleet.back ?? [])]) {
    if (!shipIds.has(sid)) warn(`fleets.json：${fleet.id} 引用了未收录的舰娘 -> ${sid}`)
  }
  if (fleet.flagship && !shipIds.has(fleet.flagship)) {
    warn(`fleets.json：${fleet.id} 旗舰引用了未收录的舰娘 -> ${fleet.flagship}`)
  }
  for (const sid of Object.keys(fleet.equipmentTips ?? {})) {
    if (!shipIds.has(sid)) warn(`fleets.json：${fleet.id} 的 equipmentTips 引用了未收录的舰娘 -> ${sid}`)
  }
}
for (const stage of stages) {
  for (const sid of stage.drops?.ships ?? []) {
    if (!shipIds.has(sid)) warn(`stages.json：${stage.id} 掉落表引用了未收录的舰娘 -> ${sid}（页面显示为「尚未收录」）`)
  }
  for (const eid of stage.drops?.equipment ?? []) {
    if (!equipIds.has(eid)) warn(`stages.json：${stage.id} 掉落表引用了未收录的装备 -> ${eid}（页面显示为「尚未收录」）`)
  }
}

// 4. 配装可装性规则（slotRules.json）：配装台的地基，规则与数据脱钩会让整个求解器失效
const slotRules = load('slotRules.json')
const rules = slotRules.rules ?? {}
const ruleTypes = new Set(Object.values(rules).flatMap(r => r.types ?? []))
const equipTypes = new Set(equipment.map(e => e.type))
const dataSlotTypes = new Set(ships.flatMap(s => s.slots ?? []))
for (const t of dataSlotTypes) {
  if (!rules[t]) fail(`slotRules.json：数据里出现的槽位类型「${t}」没有可装性规则`)
}
for (const t of Object.keys(rules)) {
  if (!dataSlotTypes.has(t)) warn(`slotRules.json：规则「${t}」在舰娘槽位数据里没有对应，可能是拼写残留`)
  for (const et of rules[t].types ?? []) {
    if (!equipTypes.has(et)) fail(`slotRules.json：「${t}」映射到不存在的装备类型「${et}」`)
  }
}
// 每个槽位类型至少要有一件装备可装，否则该槽位在界面上永远是空的
for (const t of dataSlotTypes) {
  const reachable = equipment.filter(e => (rules[t]?.types ?? []).includes(e.type))
  if (reachable.length === 0) warn(`槽位类型「${t}」在装备表里没有任何可装装备（界面显示为空槽）`)
}
if (slotRules.efficiencySlots) {
  for (const t of slotRules.efficiencySlots) {
    if (!rules[t]) fail(`slotRules.json：efficiencySlots 里的「${t}」不是有效槽位类型`)
  }
}

// 5. 统计与孤儿数据（仅提示，不阻断）
const inFleet = new Set(fleets.flatMap(f => [...(f.front ?? []), ...(f.back ?? [])]))
const orphanShips = [...shipIds].filter(id => !inFleet.has(id))
const referencedEquip = new Set([
  ...ships.flatMap(s => s.equipment?.recommended ?? []),
  ...stages.flatMap(s => s.drops?.equipment ?? []).map(eid => equipment.find(e => e.id === eid)?.name).filter(Boolean),
])
const orphanEquip = equipment.filter(e => !referencedEquip.has(e.name)).map(e => e.id)
if (orphanShips.length) warn(`未出现在任何阵容中的舰娘：${orphanShips.length} 艘`)
if (orphanEquip.length) warn(`既无推荐也无掉落的装备：${orphanEquip.length} 件`)

// 5. 枚举清单：UI 的筛选项由数据派生，这里只报告实际取值，便于对照游戏口径
const collect = (rows, key) => [...new Set(rows.map(r => r?.[key]).filter(v => v != null))].sort()
const summary = [
  ['舰娘稀有度', collect(ships, 'rarity')],
  ['舰娘舰种', collect(ships, 'shipType')],
  ['舰娘槽位', [...dataSlotTypes].sort()],
  ['装备类型', collect(equipment, 'type')],
  ['装备稀有度', collect(equipment, 'rarity')],
  ['阵容分类', collect(fleets, 'category')],
]

// 6. meta.json 快照日期
if (!meta.updatedAt || !/^\d{4}-\d{2}-\d{2}$/.test(meta.updatedAt)) {
  fail('meta.json：updatedAt 缺失或不是 YYYY-MM-DD 格式')
}

// 输出
console.log('数据校验')
console.log(`  舰娘 ${ships.length} · 装备 ${equipment.length} · 阵容 ${fleets.length} · 关卡 ${stages.length}`)
console.log(`  数据快照 ${meta.updatedAt}（${meta.scope}）`)
for (const [label, values] of summary) console.log(`  ${label}：${values.join(' / ')}`)
console.log(`  持有：舰娘 ${ships.filter(s => s.playerInfo?.owned).length} · 装备 ${equipment.filter(e => e.playerOwned).length}`)

if (warnings.length) {
  console.log(`\n提示 ${warnings.length} 条`)
  warnings.forEach(w => console.log(`  - ${w}`))
}
if (errors.length) {
  console.log(`\n错误 ${errors.length} 条`)
  errors.forEach(e => console.log(`  ! ${e}`))
}
if (errors.length || (strict && warnings.length)) {
  console.log(strict && !errors.length ? '\n校验未通过（--strict：提示视为失败）' : '\n校验未通过')
  process.exit(1)
}
console.log('\n校验通过')
