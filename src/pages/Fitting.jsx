import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ships from '../data/ships.json'
import equipment from '../data/equipment.json'
import {
  COMBAT_MODEL,
  PANEL_LAYOUT,
  evaluateLoadout,
  emptyEvaluation,
  slotEfficiency,
  slotLayout,
  slotSource,
  shipTypeMismatch,
  panelSource,
  statLabel,
  loadoutEfficiency,
  efficiencyGrade,
} from '../utils/combat.js'
import shipSlotsMeta from '../data/shipSlots.json'
import slotRules from '../data/slotRules.json'
import { solveLoadout, recordedPicks, recordedExcess, slotCandidates, inventoryAudit } from '../utils/fit.js'
import { useDocumentTitle } from '../utils/useDocumentTitle.js'
import { RarityBadge } from '../utils/rarity.jsx'
import { ShipTypeTag } from '../utils/shipType.jsx'

const AXIS_LABELS = { output: '输出', survival: '生存', antiair: '防空' }
const AXIS_TONES = { output: 'bg-t-bb', survival: 'bg-t-cl', antiair: 'bg-t-dd' }

function AxisBar({ axis, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-al-text-muted w-8 shrink-0">{AXIS_LABELS[axis]}</span>
      <div className="flex-1 h-1.5 rounded bg-al-bg overflow-hidden">
        <div className={`h-full ${AXIS_TONES[axis]}`} style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
      <span className="text-xs text-al-text-dim w-7 text-right shrink-0">{Math.round(value * 100)}</span>
    </div>
  )
}

function ScoreCard({ title, hint, ev, pct, tone = 'text-al-text', ring = '' }) {
  if (!ev) return null
  const g = efficiencyGrade(pct ?? 0)
  return (
    <div className={`al-panel p-4 ${ring}`}>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-sm text-al-text-muted">{title}</span>
        <span className={`text-xs font-semibold ${g.tone}`}>
          {g.grade} · {pct ?? 0}%
        </span>
      </div>
      <div className={`text-2xl font-bold ${tone} mb-2`}>{ev.score}</div>
      <div className="space-y-1.5">
        {['output', 'survival', 'antiair'].map(a => (
          <AxisBar key={a} axis={a} value={ev.axes[a]} />
        ))}
      </div>
      {hint && <p className="text-xs text-al-text-dim mt-2">{hint}</p>}
    </div>
  )
}

export default function Fitting() {
  useDocumentTitle('配装台')
  const ownedShips = useMemo(() => ships.filter(s => s.playerInfo?.owned), [])
  const otherShips = useMemo(() => ships.filter(s => !s.playerInfo?.owned), [])
  const byId = useMemo(() => new Map(equipment.map(e => [e.id, e])), [])

  const [shipId, setShipId] = useState(ownedShips[0]?.id ?? ships[0].id)
  const [profile, setProfile] = useState('balanced')
  const [picks, setPicks] = useState({ shipId: null, ids: null })
  const [showAudit, setShowAudit] = useState(false)
  const [showModel, setShowModel] = useState(false)

  const ship = ships.find(s => s.id === shipId) ?? ships[0]
  const slots = useMemo(() => slotLayout(ship), [ship])
  const slotsFromOfficial = slotSource(ship) === 'official'
  const panelFromOfficial = panelSource(ship) === 'official'
  const typeMismatch = shipTypeMismatch(ship)

  const recorded = useMemo(() => recordedPicks(ship, equipment), [ship])
  const recordedIds = useMemo(() => recorded.map(e => e?.id ?? null), [recorded])
  const excess = useMemo(() => recordedExcess(ship, equipment), [ship])

  const ids = picks.shipId === ship.id && picks.ids?.length === slots.length ? picks.ids : recordedIds
  const selected = useMemo(() => ids.map(id => (id ? byId.get(id) : null)), [ids, byId])

  const solved = useMemo(() => solveLoadout(ship, equipment, { profile }), [ship, profile])
  const current = useMemo(() => evaluateLoadout(ship, selected, profile), [ship, selected, profile])
  const empty = useMemo(() => emptyEvaluation(ship, profile), [ship, profile])
  const recordedEval = useMemo(
    () => (recorded.some(Boolean) ? evaluateLoadout(ship, recorded, profile) : null),
    [ship, recorded, profile],
  )

  const usage = useMemo(() => {
    const t = {}
    for (const e of selected) if (e) t[e.id] = (t[e.id] ?? 0) + 1
    return t
  }, [selected])

  const audit = useMemo(
    () => (showAudit ? inventoryAudit(ships, equipment, profile) : []),
    [showAudit, profile],
  )

  const applyPicks = list => setPicks({ shipId: ship.id, ids: list.map(e => e?.id ?? null) })

  // 配装效率以「空装 → 理论最优」为区间，衡量这套配装填满了多少可提升空间
  const effOf = ev => (ev ? loadoutEfficiency(ev, empty, solved.theoreticalEvaluation) : 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-al-text mb-1">配装台</h1>
        <p className="text-sm text-al-text-muted">
          按槽位类型、装备适配舰种与<strong className="text-al-gold">我的仓库持有量</strong>求最优配装，并给出配装前后的面板与战力对比。
        </p>
      </div>

      {/* 选择区 */}
      <div className="al-panel p-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-al-text-muted">舰娘</span>
          <select
            className="al-input min-w-52"
            value={shipId}
            onChange={e => setShipId(e.target.value)}
          >
            <optgroup label={`已持有（${ownedShips.length}）`}>
              {ownedShips.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.shipType} · Lv{s.playerInfo?.level ?? '—'}
                </option>
              ))}
            </optgroup>
            <optgroup label={`未持有（${otherShips.length}）`}>
              {otherShips.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.shipType}
                </option>
              ))}
            </optgroup>
          </select>
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-al-text-muted">口径</span>
          <div className="flex gap-1">
            {Object.entries(COMBAT_MODEL.profiles).map(([key, p]) => (
              <button
                key={key}
                type="button"
                onClick={() => setProfile(key)}
                className={`al-btn px-3 py-2 text-sm ${profile === key ? 'text-al-gold border-al-gold' : ''}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 ml-auto">
          <button type="button" className="al-btn" onClick={() => applyPicks(recorded)}>
            用数据记录
          </button>
          <button type="button" className="al-btn" onClick={() => applyPicks(new Array(slots.length).fill(null))}>
            清空
          </button>
          <button type="button" className="al-btn-gold" onClick={() => applyPicks(solved.picks ?? [])}>
            按我的仓库配
          </button>
        </div>
      </div>

      {/* 舰娘摘要 */}
      <div className="al-panel p-4 flex flex-wrap items-center gap-3 text-sm">
        <Link to={`/ships/${ship.id}`} className="text-lg font-bold text-al-gold hover:underline">
          {ship.name}
        </Link>
        <ShipTypeTag type={ship.shipType} />
        <RarityBadge rarity={ship.rarity} />
        <span className="text-al-text-muted">{ship.faction}</span>
        <span className="text-al-text-muted">
          等级 {ship.playerInfo?.level ?? '未记录'}
          {ship.levelCap ? ` / 上限 ${ship.levelCap}` : ''}
        </span>
        <span className="text-al-text-muted">槽位 {slots.length}</span>
        {typeMismatch && (
          <span
            className="al-badge bg-r-r/20 text-r-r"
            title={`官方档案为 ${typeMismatch.official}，适配判断按官方口径；站内记录写成 ${typeMismatch.site}`}
          >
            舰种口径：官方 {typeMismatch.official} / 站内 {typeMismatch.site}
          </span>
        )}
        <span
          className={`al-badge ${slotsFromOfficial ? 'bg-al-panel-light text-al-text-muted' : 'bg-r-r/20 text-r-r'}`}
          title={
            slotsFromOfficial
              ? `槽位与武器效率取自官方档案（${shipSlotsMeta._meta.source}，抓取于 ${shipSlotsMeta._meta.fetchedAt}）`
              : '官方档案未收录该舰，槽位回退用本站记录、效率按 100% 计'
          }
        >
          {slotsFromOfficial ? '槽位：官方档案' : '槽位：本站记录'}
        </span>
        <span
          className={`al-badge ${panelFromOfficial ? 'bg-al-panel-light text-al-text-muted' : 'bg-r-r/20 text-r-r'}`}
          title={panelFromOfficial ? '面板取自官方档案，按等级插值' : '官方档案未收录该舰，面板回退用本站 stats（按舰种概数）'}
        >
          {panelFromOfficial ? '面板：官方档案' : '面板：本站 stats'}
        </span>
        {!ship.playerInfo?.owned && <span className="al-badge bg-al-panel-light text-al-text-dim">未持有</span>}
      </div>

      {/* 战力对比 */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ScoreCard title="空装基准" ev={empty} pct={0} hint="只算舰娘基础面板，配装效率必然为 0" />
        <ScoreCard
          title="数据记录"
          ev={recordedEval}
          pct={effOf(recordedEval)}
          hint={
            excess.length
              ? `⚠ 其中 ${excess.length} 类装备超出库存`
              : recordedEval
                ? 'ships.equipment.recommended'
                : '本舰未记录配装'
          }
        />
        <ScoreCard
          title="我的仓库最优"
          ev={solved.evaluation}
          pct={effOf(solved.evaluation)}
          tone="text-al-gold"
          ring="border-al-gold/50"
          hint={`仓库发挥度 ${solved.coverage}%（相对理论最优）`}
        />
        <ScoreCard title="理论最优" ev={solved.theoreticalEvaluation} pct={100} hint="忽略库存上限，即目标配置" />
      </div>
      <p className="text-xs text-al-text-dim -mt-3">
        分档 = 配装效率，即这套配装填满了「空装 → 理论最优」这段跨度的多少（S≥95 / A≥85 / B≥70 / C≥50）。
        分母是同一艘船的跨度，所以驱逐舰配满也能拿 S，与舰娘自身强度无关。
      </p>

      {/* 槽位表 */}
      <div className="al-panel overflow-hidden">
        <div className="px-4 py-3 border-b border-al-border flex items-center gap-3">
          <h2 className="font-semibold text-al-text">槽位</h2>
          <span className="text-xs text-al-text-muted">
            当前 {current.score} 分 · 相对空装 {current.score - empty.score >= 0 ? '+' : ''}
            {current.score - empty.score}
          </span>
          {solved.blocked.length > 0 && (
            <span className="text-xs text-r-sr ml-auto">⚠ {solved.blocked.length} 个槽位无任何可装装备</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="al-table-th w-12">#</th>
                <th className="al-table-th">槽位类型</th>
                <th className="al-table-th">当前装备</th>
                <th className="al-table-th w-20">效率</th>
                <th className="al-table-th">贡献</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot, i) => {
                const eff = slotEfficiency(slot)
                const cands = slotCandidates(ship, slot, equipment, { ownedOnly: false })
                const chosen = selected[i]
                const item = current.items[i]
                const delta = item?.delta ?? {}
                return (
                  <tr key={i}>
                    <td className="al-table-td text-al-text-dim">{i + 1}</td>
                    <td className="al-table-td text-al-text-muted whitespace-nowrap" title={slot.official ? `官方槽位类型：${slot.official}` : undefined}>
                      {slot.type}
                      <span className="text-xs text-al-text-dim ml-1">
                        （可装 {cands.length} / 持有 {slotCandidates(ship, slot, equipment, { ownedOnly: true }).length}）
                      </span>
                    </td>
                    <td className="al-table-td">
                      <select
                        className="al-input py-1 text-sm w-full min-w-44"
                        value={chosen?.id ?? ''}
                        onChange={e => {
                          const next = [...ids]
                          next[i] = e.target.value || null
                          setPicks({ shipId: ship.id, ids: next })
                        }}
                      >
                        <option value="">（空）</option>
                        {cands.map(e => {
                          // 当前槽已选中的那件不算「占用」，否则会把自己标成库存不足
                          const used = (usage[e.id] ?? 0) - (chosen?.id === e.id ? 1 : 0)
                          const have = Number(e.count) || 1
                          const mark = !e.playerOwned ? '未持有' : used + 1 > have ? '库存不足' : `×${have}`
                          return (
                            <option key={e.id} value={e.id}>
                              {e.name} · {e.type} · {mark}
                            </option>
                          )
                        })}
                      </select>
                    </td>
                    <td className="al-table-td text-al-text-muted">
                      {slot.type === '设备' || slot.type === '特殊兵装' ? (
                        <span className="text-al-text-dim">—</span>
                      ) : eff === 1 ? (
                        <span className="text-al-text-dim">100%*</span>
                      ) : (
                        `${Math.round(eff * 100)}%`
                      )}
                    </td>
                    <td className="al-table-td">
                      {Object.keys(delta).length === 0 ? (
                        <span className="text-al-text-dim">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(delta).map(([k, v]) => (
                            <span key={k} className="al-tag bg-al-panel-light text-al-text-muted">
                              {statLabel(k)} {v > 0 ? '+' : ''}
                              {k.startsWith('dps_') ? v.toFixed(1) : Math.round(v * 10) / 10}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-3 text-xs text-al-text-dim border-t border-al-border">
          效率是武器输出的乘数（单向前作用于主炮/副炮/鱼雷/防空/舰载机的输出），取官方档案的<strong className="text-al-text-muted">满突破值</strong>。
          突破途中会低于此值（如阿拉巴马主炮 100% → +5% → +10% → +15% → 130%）。
          {slotsFromOfficial
            ? ' 设备与特殊兵装槽不参与效率缩放。'
            : ' 官方档案未收录该舰，效率按 100% 计，实际战力会高于此值。'}
        </p>
      </div>

      {/* 面板对比 */}
      <div className="al-panel p-4">
        <h2 className="font-semibold text-al-text mb-3">面板明细（空装 → 当前）</h2>
        <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
          {PANEL_LAYOUT.map(({ key, label }) => {
            const b = empty.panel[key]
            const a = current.panel[key]
            if (b == null && a == null) return null
            const d = (a ?? 0) - (b ?? 0)
            const noBase = current.missingBase.includes(key)
            return (
              <div key={key} className="flex items-center gap-2 text-sm py-0.5">
                <span className="text-al-text-muted w-20 shrink-0">{label}</span>
                <span className="text-al-text-dim">
                  {noBase ? '—' : Number(b).toLocaleString()}
                </span>
                <span className="text-al-text-dim">→</span>
                <span className="text-al-text font-medium">{Number(a ?? 0).toLocaleString()}</span>
                {d !== 0 && (
                  <span className={`text-xs ml-auto ${d > 0 ? 'text-al-gold' : 'text-t-cl'}`}>
                    {d > 0 ? '+' : ''}
                    {Math.round(d * 10) / 10}
                  </span>
                )}
              </div>
            )
          })}
        </div>
        {current.missingBase.length > 0 && (
          <p className="text-xs text-al-text-dim mt-3">
            标 “—” 的属性在舰娘基础面板里没有基准值（{current.missingBase.map(statLabel).join('、')}），只显示装备增量，无法给出终值。
          </p>
        )}
      </div>

      {/* 缺口 */}
      <div className="al-panel p-4">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="font-semibold text-al-text">按我的仓库配，差在哪</h2>
          <span className="text-xs text-al-text-muted">
            发挥度 {solved.coverage}% · 缺口 {solved.gaps.length} 处
          </span>
        </div>
        {solved.gaps.length === 0 ? (
          <p className="text-sm text-al-text-muted">理论最优所需装备仓库里都够，已配满。</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {solved.gaps.map(g => (
              <li key={g.slot} className="flex flex-wrap items-center gap-2">
                <span className="text-al-text-dim">槽{g.slot + 1} {g.slotType}</span>
                <Link to={`/equipment/${g.want.id}`} className="text-al-gold hover:underline">
                  {g.want.name}
                </Link>
                <span className={`al-badge ${g.reason === 'not-owned' ? 'bg-r-sr/20 text-r-sr' : 'bg-r-r/20 text-r-r'}`}>
                  {g.reason === 'not-owned' ? '未持有' : '库存已用尽'}
                </span>
                <span className="text-al-text-dim text-xs">
                  需 {1} 件 / 有 {g.have} 件
                  {g.want.source?.length ? ` · ${g.want.source.join('、')}` : ''}
                </span>
                {g.alternative && (
                  <span className="text-al-text-muted text-xs">→ 已用 {g.alternative.name} 顶上</span>
                )}
              </li>
            ))}
          </ul>
        )}
        {excess.length > 0 && (
          <div className="mt-4 pt-3 border-t border-al-border">
            <p className="text-xs text-r-sr mb-1.5">数据记录的配装里，有装备计入件数超过持有量：</p>
            <ul className="space-y-1 text-xs text-al-text-muted">
              {excess.map(x => (
                <li key={x.equip?.id}>
                  {x.equip.name}：记录需 {x.need} 件 / 持有 {x.have} 件{x.owned ? '' : '（未持有）'}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 库存盘点 */}
      <div className="al-panel p-4">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-al-text">全舰队库存盘点</h2>
          <span className="text-xs text-al-text-muted">按各舰逐槽最优汇总，6 艘舰队实际会争用同一批装备</span>
          <button type="button" className="al-btn py-1 px-3 text-xs ml-auto" onClick={() => setShowAudit(v => !v)}>
            {showAudit ? '收起' : '展开'}
          </button>
        </div>
        {showAudit && (
          <div className="mt-3">
            {audit.length === 0 ? (
              <p className="text-sm text-al-text-muted">按当前口径，全舰队同时配装没有缺口。</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="al-table-th">装备</th>
                    <th className="al-table-th w-20">类型</th>
                    <th className="al-table-th w-20">需求</th>
                    <th className="al-table-th w-20">持有</th>
                    <th className="al-table-th w-20">缺口</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.map(r => (
                    <tr key={r.equip?.id}>
                      <td className="al-table-td">
                        <Link to={`/equipment/${r.equip.id}`} className="text-al-gold hover:underline">
                          {r.equip.name}
                        </Link>
                        {!r.owned && <span className="al-badge bg-r-sr/20 text-r-sr ml-2">未持有</span>}
                      </td>
                      <td className="al-table-td text-al-text-muted">{r.type}</td>
                      <td className="al-table-td text-al-text-muted">{r.need}</td>
                      <td className="al-table-td text-al-text-muted">{r.have}</td>
                      <td className="al-table-td text-t-bb font-semibold">-{r.shortage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* 口径说明 */}
      <div className="al-panel p-4">
        <button
          type="button"
          className="flex items-center gap-2 w-full text-left"
          onClick={() => setShowModel(v => !v)}
        >
          <h2 className="font-semibold text-al-text">战力口径 {COMBAT_MODEL.version}</h2>
          <span className="text-xs text-al-text-muted">这是自建口径，不是游戏内数值 — 展开看公式</span>
          <span className="ml-auto text-al-text-dim text-sm">{showModel ? '−' : '+'}</span>
        </button>
        {showModel && (
          <div className="mt-3 space-y-3 text-sm text-al-text-muted">
            <div>
              <p className="text-al-text font-medium mb-1">第 ① 步：面板合成（纯算术，可逐件回算）</p>
              <p className="font-mono text-xs bg-al-bg p-2 rounded border border-al-border overflow-x-auto">
                面板 = 舰娘基准 + Σ（装备属性 × 槽位武器效率 × (1 + 强化等级 × {COMBAT_MODEL.enhanceStep}))
              </p>
              <p className="text-xs mt-1">
                武器效率只乘在 fp / trp / aa / air / dps 上；命中、装填、机动、耐久加成、耐久恢复不受效率影响。
                仅武器槽计入效率：{slotRules.efficiencySlots.join('、')}。
              </p>
              <p className="text-xs mt-1">
                舰娘基准面板与武器效率均取自官方档案（按等级插值），不是自建估算。
              </p>
            </div>
            <div>
              <p className="text-al-text font-medium mb-1">第 ② 步：三轴归一 + 加权</p>
              <ul className="text-xs space-y-0.5">
                <li>输出 = 炮击×1 + 雷击×1 + 航空×1 +（对舰 dps）×{COMBAT_MODEL.axes.weight.dps}　锚点 {COMBAT_MODEL.axes.anchor.output}</li>
                <li>
                  生存 = 耐久×1 + 机动×{COMBAT_MODEL.axes.weight.eva} + 耐久加成×{COMBAT_MODEL.axes.weight.hpBonus} + 耐久恢复×
                  {COMBAT_MODEL.axes.weight.hpRecovery}　锚点 {COMBAT_MODEL.axes.anchor.survival}
                </li>
                <li>防空 = 防空×1 +（防空 dps）×{COMBAT_MODEL.axes.weight.aaDps}　锚点 {COMBAT_MODEL.axes.anchor.antiair}</li>
                <li>评分 = Σ（轴归一值 × 权重）× 1000，权重随上方口径切换</li>
                <li>航速（spd）不入任何轴——它不改变承伤，只有机动（eva）进生存轴</li>
              </ul>
            </div>
            <p className="text-xs">
              用途是<strong className="text-al-text">同一艘船比较不同配装</strong>——锚点按单舰面板量级设定，跨舰种横向比较分数没有意义。
              权重、锚点、强化系数都在 <span className="font-mono">src/utils/combat.js</span> 顶部，改了立即生效。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
