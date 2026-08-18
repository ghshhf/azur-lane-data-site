export const SHIP_TYPE_LIST = ['DD', 'CL', 'CA', 'BB', 'CV', 'CVL', 'SS', 'BBV']

export const shipTypeName = {
  DD: '驱逐', CL: '轻巡', CA: '重巡', BB: '战列',
  CV: '航母', CVL: '轻母', SS: '潜艇', BBV: '航战',
}

export const shipTypeColor = {
  DD: 'text-t-dd', CL: 'text-t-cl', CA: 'text-t-ca', BB: 'text-t-bb',
  CV: 'text-t-cv', CVL: 'text-t-cvl', SS: 'text-t-ss', BBV: 'text-t-bbv',
}

export const shipTypeBgColor = {
  DD: 'bg-t-dd/20', CL: 'bg-t-cl/20', CA: 'bg-t-ca/20', BB: 'bg-t-bb/20',
  CV: 'bg-t-cv/20', CVL: 'bg-t-cvl/20', SS: 'bg-t-ss/20', BBV: 'bg-t-bbv/20',
}

export function getShipTypeName(type) { return shipTypeName[type] || type }
export function getShipTypeColor(type) { return shipTypeColor[type] || 'text-al-text' }
export function getShipTypeBg(type) { return shipTypeBgColor[type] || 'bg-al-panel-light' }

export function ShipTypeTag({ type }) {
  return <span className={`al-tag ${getShipTypeBg(type)} ${getShipTypeColor(type)}`}>{getShipTypeName(type)}</span>
}
