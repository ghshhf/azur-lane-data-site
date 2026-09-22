import { ArrowLeft, Package, Users } from 'lucide-react'
import { useParams, Link } from 'react-router-dom'
import stages from '../data/stages.json'
import ships from '../data/ships.json'
import equipment from '../data/equipment.json'
import { RarityBadge } from '../utils/rarity.jsx'
import { ShipTypeTag } from '../utils/shipType.jsx'
import { useDocumentTitle } from '../utils/useDocumentTitle.js'
import { useBackToList } from '../utils/useBackToList.js'

export default function StageDetail() {
  const { id } = useParams()
  const stage = stages.find(s => s.id === id)
  const goBack = useBackToList('/stages')
  useDocumentTitle(stage?.name)

  if (!stage) {
    return (
      <div className="al-panel p-8 text-center">
        <p className="text-al-text-muted mb-4">未找到该关卡（{id}）</p>
        <button onClick={goBack} className="al-btn">返回关卡活动</button>
      </div>
    )
  }

  return (
    <div>
      <button onClick={goBack} className="al-btn mb-4 flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> 返回</button>
      <div className="al-panel p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-al-text">{stage.name}</h1>
              <span className="al-badge border bg-al-panel-light text-al-text-muted border-al-border">第{stage.chapter}章</span>
            </div>
            <p className="text-al-text-muted">{stage.difficulty}难度</p>
          </div>
        </div>

        {stage.drops?.ships?.length > 0 && (
          <>
            <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> 掉落舰娘</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
              {stage.drops.ships.map(sid => {
                const ship = ships.find(s => s.id === sid)
                if (!ship) {
                  return (
                    <div key={sid} className="al-panel-light p-2 text-xs text-al-text-dim">
                      {sid}
                      <div className="text-yellow-500 mt-1">尚未收录</div>
                    </div>
                  )
                }
                return (
                  <Link key={sid} to={`/ships/${ship.id}`} className="al-panel-light p-2 hover:border-al-gold/50 border border-transparent transition-colors">
                    <div className="text-sm text-al-text font-medium">{ship.name}</div>
                    <div className="flex items-center gap-1 mt-1"><RarityBadge rarity={ship.rarity} /><ShipTypeTag type={ship.shipType} /></div>
                  </Link>
                )
              })}
            </div>
          </>
        )}

        {stage.drops?.equipment?.length > 0 && (
          <>
            <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><Package className="w-4 h-4" /> 掉落装备</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
              {stage.drops.equipment.map(eid => {
                const equip = equipment.find(e => e.id === eid)
                if (!equip) {
                  return (
                    <div key={eid} className="al-panel-light p-2 text-xs text-al-text-dim">
                      {eid}
                      <div className="text-yellow-500 mt-1">尚未收录</div>
                    </div>
                  )
                }
                return (
                  <Link key={eid} to={`/equipment/${equip.id}`} className="al-panel-light p-2 hover:border-al-gold/50 border border-transparent transition-colors">
                    <div className="text-sm text-al-text font-medium">{equip.name}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <RarityBadge rarity={equip.rarity} />
                      <span className="text-xs text-al-text-dim">{equip.type}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}

        {stage.notes && (
          <div className="al-panel-light p-3">
            <div className="text-xs text-al-text-dim mb-1">备注</div>
            <p className="text-sm text-al-text">{stage.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
