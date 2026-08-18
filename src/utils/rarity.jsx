export const RARITY_LIST = ['N', 'R', 'SR', 'SSR', 'ELITE', 'META']

export const rarityColor = {
  N: 'text-r-n', R: 'text-r-r', SR: 'text-r-sr',
  SSR: 'text-r-ssr', ELITE: 'text-r-elite', META: 'text-r-meta',
}

export const rarityBadgeColor = {
  N: 'bg-r-n/20 text-r-n border-r-n/30',
  R: 'bg-r-r/20 text-r-r border-r-r/30',
  SR: 'bg-r-sr/20 text-r-sr border-r-sr/30',
  SSR: 'bg-r-ssr/20 text-r-ssr border-r-ssr/30',
  ELITE: 'bg-r-elite/20 text-r-elite border-r-elite/30',
  META: 'bg-r-meta/20 text-r-meta border-r-meta/30',
}

export const rarityStars = {
  N: '★', R: '★★', SR: '★★★', SSR: '★★★★', ELITE: '★★★★', META: '★★★★★',
}

export function getRarityColor(rarity) {
  return rarityColor[rarity] || 'text-al-text'
}

export function getRarityBadge(rarity) {
  return rarityBadgeColor[rarity] || 'bg-al-panel-light text-al-text-muted border-al-border'
}

export function RarityBadge({ rarity }) {
  return <span className={`al-badge border ${getRarityBadge(rarity)}`}>{rarity}</span>
}
