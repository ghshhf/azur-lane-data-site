// 从官方档案（AzurAPI）生成本站的舰娘槽位/效率与分档面板数据。
//
// 为什么需要这一步：本站 ships.json 的 slots 是「去重后的槽型列举」，不是游戏内的真实槽位。
// 例：阿拉巴马在游戏里是 3 主炮 + 3 副炮 + 1 防空 = 7 武器槽（另加 2 设备槽），旧数据写成 3 主炮 + 1 防空，
// 丢掉全部副炮槽；西弗吉尼亚多出 2 个游戏内并不存在的「设备」槽。槽位数错 → 配装求解器与战力合成全错。
//
// 官方档案同时提供了三件本站缺的东西：
//   ① slots[].max            —— 该类型装备的槽位数（全库分布 1–4，统一按槽数处理）
//   ② min/max/kaiEfficiency  —— 未突破 / 满突破 / 改造后的武器效率
//   ③ stats.{base,100,120,125}[Retrofit] —— 分档面板（本站 stats 是按舰种拍的概数）
//
// 用法：node scripts/fetch-official.mjs [--force]
// 产物：src/data/shipSlots.json、src/data/shipPanels.json（均只含本站收录的舰娘）

import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const cacheDir = join(root, '.cache')
const MIRROR = 'https://ghfast.top/https://raw.githubusercontent.com/AzurAPI/azurapi-js-setup/master/dist/'
const SOURCE_REPO = 'https://github.com/AzurAPI/azurapi-js-setup'

// 官方槽位类型 → 站内槽位口径。types 为站内装备类型，fit 表示是否按 fitShipTypes 过滤舰种。
// 副炮/通用炮/设备/特殊兵装不做舰种过滤 —— 依据见 src/data/slotRules.json 的 evidence。
const SLOT_MAP = {
  'BB Guns': { label: '战列主炮', types: ['炮击'], fit: true },
  'CL Guns': { label: '轻巡主炮', types: ['炮击'], fit: true },
  'CA Guns': { label: '重巡主炮', types: ['炮击'], fit: true },
  'CB Guns': { label: '重巡主炮', types: ['炮击'], fit: true },
  'CA/CB Guns': { label: '重巡主炮', types: ['炮击'], fit: true },
  'DD Guns': { label: '副炮', types: ['炮击', '防空'], fit: false },
  'CL/DD Guns': { label: '通用炮', types: ['炮击'], fit: false },
  Torpedoes: { label: '鱼雷', types: ['鱼雷'], fit: true },
  'Anti-Air Guns': { label: '防空', types: ['防空'], fit: true },
  Fighters: { label: '舰载机', types: ['舰载机'], fit: true },
  'Dive Bombers': { label: '舰载机', types: ['舰载机'], fit: true },
  'Torpedo Bombers': { label: '舰载机', types: ['舰载机'], fit: true },
  Seaplanes: { label: '舰载机', types: ['舰载机'], fit: true },
  'Submarine Torpedoes': { label: '水下装备', types: ['水下装备'], fit: true },
  'Submarine-mounted 203mm Gun': { label: '特殊兵装', types: ['特殊兵装'], fit: false },
  Auxiliaries: { label: '设备', types: ['设备', '弹药'], fit: false },
}

const PANEL_KEYS = {
  health: 'hp',
  firepower: 'fp',
  torpedo: 'trp',
  antiair: 'aa',
  aviation: 'air',
  antisubmarineWarfare: 'asw',
  evasion: 'eva', // 机动
  speed: 'spd', // 航速
  reload: 'reload',
  accuracy: 'hit', // 命中
  luck: 'luck',
}

// 去掉官方 type 里的括号注记与长尾说明，再逐段查表。
// 先试整串（'CL/DD Guns' 是一条独立规则，拆开会把主炮槽误判成副炮），再按 '/' 分段。
function resolveSlotType(raw) {
  const cleaned = String(raw)
    .replace(/\([^)]*\)/g, ' ')
    .replace(/Cargo[\s\S]*$/, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // 前缀兜底要带边界，否则 'Torpedoes / DD Guns' 会被 'Torpedoes' 前缀吃掉后半段
  const pick = s => SLOT_MAP[s] ?? Object.entries(SLOT_MAP).find(([k]) => s.startsWith(`${k} `) || s.startsWith(`${k}/`))?.[1]

  // 先试整串：'CL/DD Guns' 是独立规则，拆开会把轻巡主炮槽误判成副炮
  const whole = SLOT_MAP[cleaned]
  if (whole) return { label: whole.label, types: whole.types, fit: whole.fit }

  const parts = cleaned.split('/').map(s => s.trim()).filter(Boolean)
  const labels = []
  const types = []
  let fit = false
  for (const p of parts) {
    const hit = pick(p)
    if (!hit) continue
    if (!labels.includes(hit.label)) labels.push(hit.label)
    for (const t of hit.types) if (!types.includes(t)) types.push(t)
    fit = fit || hit.fit
  }
  if (!labels.length) return null
  return { label: labels.join('/'), types, fit }
}

function panelOf(tier) {
  if (!tier) return null
  const out = {}
  for (const [src, dst] of Object.entries(PANEL_KEYS)) {
    const v = tier[src]
    if (v != null && v !== '') out[dst] = Number(v)
  }
  return Object.keys(out).length ? out : null
}

async function grab(file, force) {
  const dest = join(cacheDir, file)
  if (existsSync(dest) && !force) {
    console.log(`  缓存命中 ${file}`)
    return JSON.parse(readFileSync(dest, 'utf-8'))
  }
  const url = MIRROR + file
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${file} 下载失败 HTTP ${res.status}`)
  const text = await res.text()
  writeFileSync(dest, text)
  console.log(`  已下载 ${file}（${(text.length / 1024).toFixed(0)} KB）`)
  return JSON.parse(text)
}

const force = process.argv.includes('--force')
mkdirSync(cacheDir, { recursive: true })

console.log('读取官方档案')
const officialShips = await grab('ships.json', force)

console.log('读取本站数据')
const siteShips = JSON.parse(readFileSync(join(root, 'src/data/ships.json'), 'utf-8'))

// 官方 names.cn 在联动船上被写成编号，只索引真正的中文名
const byCn = new Map()
for (const x of officialShips) {
  const cn = x?.names?.cn
  if (cn && !/^\d+$/.test(cn)) byCn.set(cn.trim(), x)
}

// 站内 name 字段有若干明显损坏的条目（截断 / 错译），按官方中文名对齐。
// 只在这里做映射，不改 ships.json 的 name —— 那条留给使用者确认后再动。
const ALIASES = {
  十纱: '信浓',
  冯矢: '科隆',
  优玖露: '欧根亲王',
  发: '皇家方舟',
}

function matchShip(site) {
  const q = String(site.name).trim()
  if (byCn.has(q)) return { hit: byCn.get(q), how: 'exact' }
  if (ALIASES[q] && byCn.has(ALIASES[q])) return { hit: byCn.get(ALIASES[q]), how: 'alias' }
  const base = q.replace(/(II|·改|·META|改|\s)+$/, '')
  if (base.length > 1 && base !== q) {
    // ·META 船在官方是独立条目，槽位与原型差异大 —— 找不到同名 META 就不做原型近似
    if (/·META$/.test(q)) return { hit: null, how: null }
    if (byCn.has(base)) return { hit: byCn.get(base), how: q.endsWith('·改') ? 'retrofit' : 'proto' }
    for (const [k, v] of byCn) {
      if (k.startsWith(base)) return { hit: v, how: q.endsWith('·改') ? 'retrofit' : 'proto' }
    }
  }
  return { hit: null, how: null }
}

const slotsOut = {}
const panelsOut = {}
const report = { exact: [], alias: [], retrofit: [], proto: [], miss: [], hullDiff: [] }

// 官方 hullType → 站内 shipType（用于核对站内舰种是否写错）
const HULL_TO_SITE = {
  Destroyer: 'DD',
  'Light Cruiser': 'CL',
  'Heavy Cruiser': 'CA',
  Battleship: 'BB',
  Battlecruiser: 'BB',
  Monitor: 'BB',
  'Aviation Battleship': 'BBV',
  'Aircraft Carrier': 'CV',
  'Light Carrier': 'CVL',
  Submarine: 'SS',
  'Submarine Carrier': 'SS',
  'Repair Ship': 'AR',
}

for (const site of siteShips) {
  const { hit, how } = matchShip(site)
  if (!hit) {
    report.miss.push(site.name)
    continue
  }
  report[how].push(`${site.name} → ${hit.names.cn}`)

  const expectType = HULL_TO_SITE[hit.hullType]
  if (expectType && expectType !== site.shipType) {
    report.hullDiff.push(`${site.name}: 站内 ${site.shipType} vs 官方 ${hit.hullType}(${expectType})`)
  }

  // ① 槽位 + 效率
  // AzurAPI slots[].max 即「该类型装备的槽位数」：全库 max 分布为 1–4（无载机量级大数），
  // 战列/航母/驱逐均如此（阿拉巴马 BB Guns=max3=3 主炮槽，企业 Fighters=max3=3 战斗机槽）。
  // 故统一 count = max，按官方类型去重展开即可，无需按舰种特判。
  const rawMapped = []
  for (const sl of hit.slots ?? []) {
    const mapped = resolveSlotType(sl.type)
    if (!mapped) {
      report.miss.push(`${site.name}: 槽类型未映射 ${sl.type}`)
      continue
    }
    rawMapped.push({ sl, mapped })
  }

  const seen = new Set()
  const slots = []
  for (const { sl, mapped } of rawMapped) {
    if (seen.has(sl.type)) continue
    seen.add(sl.type)
    slots.push({
      official: sl.type,
      label: mapped.label,
      types: mapped.types,
      checkFit: mapped.fit,
      count: Number(sl.max) || 1,
      eff: {
        min: sl.minEfficiency ?? null,
        max: sl.maxEfficiency ?? null,
        kai: sl.kaiEfficiency ?? null,
      },
    })
  }

  if (slots.length) {
    slotsOut[site.id] = {
      officialName: hit.names.cn,
      officialId: hit.id,
      hullType: hit.hullType,
      // 官方舰种 → 站内舰种。与 ships.json 的 shipType 不一致时，适配判断以官方为准
      // （站内未持有条目的舰种有写错的，见脚本输出的「舰种与官方不符」清单）。
      siteType: HULL_TO_SITE[hit.hullType] ?? null,
      match: how,
      slots,
    }
  }

  // ② 分档面板
  const st = hit.stats ?? {}
  const tiers = {}
  for (const [k, key] of [
    ['base', 'baseStats'],
    ['lv100', 'level100'],
    ['lv120', 'level120'],
    ['lv125', 'level125'],
  ]) {
    const p = panelOf(st[key])
    if (p) tiers[k] = p
  }
  const retrofit = {}
  for (const [k, key] of [
    ['lv100', 'level100Retrofit'],
    ['lv120', 'level120Retrofit'],
    ['lv125', 'level125Retrofit'],
  ]) {
    const p = panelOf(st[key])
    if (p) retrofit[k] = p
  }
  if (Object.keys(tiers).length) {
    panelsOut[site.id] = {
      officialName: hit.names.cn,
      match: how,
      tiers,
      ...(Object.keys(retrofit).length ? { retrofit } : {}),
    }
  }
}

const stamp = new Date().toISOString().slice(0, 10)
const meta = {
  source: 'AzurAPI / azurapi-js-setup（游戏档案数据）',
  repo: SOURCE_REPO,
  endpoint: 'dist/ships.json',
  fetchedAt: stamp,
  matched: `${report.exact.length + report.alias.length + report.retrofit.length + report.proto.length}/${siteShips.length}`,
}

writeFileSync(
  join(root, 'src/data/shipSlots.json'),
  JSON.stringify(
    {
      _meta: {
        ...meta,
        note: '槽位与效率来自游戏档案。slots[].max 即该类型槽位数（全库 1–4）；效率三档：min=未突破、max=满突破、kai=改造后。',
      },
      ships: slotsOut,
    },
    null,
    2,
  ) + '\n',
)

writeFileSync(
  join(root, 'src/data/shipPanels.json'),
  JSON.stringify(
    {
      _meta: {
        ...meta,
        note: '官方分档面板，未给终值。运行时按舰娘等级在档位间插值。键名：eva=机动、spd=航速、hit=命中。',
      },
      ships: panelsOut,
    },
    null,
    2,
  ) + '\n',
)

console.log('')
console.log(
  `匹配：精确 ${report.exact.length} · 别名 ${report.alias.length} · 改造近似 ${report.retrofit.length} · 原型近似 ${report.proto.length} · 未命中 ${report.miss.length}`,
)
console.log('  精确    :', report.exact.join('、') || '（无）')
console.log('  别名    :', report.alias.join('、') || '（无）')
console.log('  改造近似:', report.retrofit.join('、') || '（无）')
console.log('  原型近似:', report.proto.join('、') || '（无）')
console.log('  未命中  :', report.miss.join('、') || '（无）')
console.log('')
console.log(`舰种与官方不符（${report.hullDiff.length} 条）：`)
report.hullDiff.forEach(x => console.log('  -', x))
console.log('')
console.log(`写入 src/data/shipSlots.json（${Object.keys(slotsOut).length} 艘）`)
console.log(`写入 src/data/shipPanels.json（${Object.keys(panelsOut).length} 艘）`)
