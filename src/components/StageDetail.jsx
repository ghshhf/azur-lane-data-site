import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, Users } from 'lucide-react'
import stages from '../data/stages.json'
import ships from '../data/ships.json'
import equipment from '../data/equipment.json'
import { RarityBadge } from '../utils/rarity.jsx'

export default function StageDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const stage = stages.find(s => s.id === id)
  if (!stage) return <div className="p-8 text-center text-al-text-muted">未找到该关卡</div>

  const getShip = (sid) => ships.find(s => s.id === sid)
  const getEquip = (eid) => equipment.find(e => e.id === eid)

  return (
    <div>
      <button onClick={() => navigate(-1)} className="al-btn mb-4 flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> 返回</button>
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
                const ship = getShip(sid)
                return (
                  <div key={sid} className="al-panel-light p-2">
                    {ship ? (
                      <div>
                        <div className="text-sm text-al-text font-medium">{ship.name}</div>
                        <div className="flex items-center gap-1 mt-1"><RarityBadge rarity={ship.rarity} /></div>
                      </div>
                    ) : <div className="text-sm text-al-text-muted">{sid}</div>}
                  </div>
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
                const equip = getEquip(eid)
                return (
                  <div key={eid} className="al-panel-light p-2">
                    {equip ? (
                      <div>
                        <div className="text-sm text-al-text font-medium">{equip.name}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <RarityBadge rarity={equip.rarity} />
                          <span className="text-xs text-al-text-dim">{equip.type}</span>
                        </div>
                      </div>
                    ) : <div className="text-sm text-al-text-muted">{eid}</div>}
                  </div>
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
