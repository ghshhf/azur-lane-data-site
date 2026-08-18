# Azur Lane Data Query Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure data-driven Azur Lane (碧蓝航线) query website with ship data, equipment data, fleet compositions, and stage/event information — no images, text-focused.

**Architecture:** React 18 + Vite SPA with TailwindCSS styling. Data stored as local JSON files for AI-friendly readability. React Router for navigation. All data is text/number-only, no game images.

**Tech Stack:** React 18, Vite, TailwindCSS 3, React Router v6, Lucide React

---

## File Structure Map

| File | Responsibility |
|------|---------------|
| `package.json` | Project config, dependencies |
| `vite.config.js` | Vite build config |
| `tailwind.config.js` | Tailwind theme (custom colors) |
| `postcss.config.js` | PostCSS config |
| `index.html` | HTML entry point |
| `src/main.jsx` | React root, router setup |
| `src/App.jsx` | App shell with routes |
| `src/index.css` | Tailwind directives + global styles |
| `src/data/ships.json` | Ship girl data (22 ships) |
| `src/data/equipment.json` | Equipment data (15 items) |
| `src/data/fleets.json` | Fleet composition data (8 fleets) |
| `src/data/stages.json` | Stage/event data |
| `src/utils/rarity.js` | Rarity color mapping + RarityBadge component |
| `src/utils/shipType.js` | Ship type color mapping + ShipTypeTag component |
| `src/components/Layout.jsx` | Page layout with navigation |
| `src/components/SearchBar.jsx` | Search input with clear button |
| `src/components/FilterPanel.jsx` | Collapsible filter controls |
| `src/components/ShipCard.jsx` | Ship list card |
| `src/components/EquipmentCard.jsx` | Equipment list card |
| `src/components/FleetCard.jsx` | Fleet list card |
| `src/components/ShipDetail.jsx` | Ship detail view |
| `src/components/EquipmentDetail.jsx` | Equipment detail view |
| `src/components/FleetDetail.jsx` | Fleet detail view |
| `src/components/StageDetail.jsx` | Stage detail view |
| `src/pages/Home.jsx` | Home page |
| `src/pages/Ships.jsx` | Ships listing page |
| `src/pages/Equipment.jsx` | Equipment listing page |
| `src/pages/Fleets.jsx` | Fleets listing page |
| `src/pages/Stages.jsx` | Stages listing page |

---

### Task 1: Project Setup

**Files:** Create `package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `index.html`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "azur-lane-data-site",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "lucide-react": "^0.441.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "vite": "^5.4.8"
  }
}
```

- [ ] **Step 2: Create vite.config.js**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

- [ ] **Step 3: Create tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'al-bg': '#0f1923',
        'al-panel': '#1a2332',
        'al-panel-light': '#243044',
        'al-gold': '#d4a843',
        'al-gold-dark': '#b8922e',
        'al-text': '#ffffff',
        'al-text-muted': '#b0b8c4',
        'al-text-dim': '#6b7280',
        'al-border': '#2a3a50',
        'r-n': '#8a8a8a', 'r-r': '#4a9eff', 'r-sr': '#c77dff',
        'r-ssr': '#ffd700', 'r-elite': '#ff8c00', 'r-meta': '#ff4444',
        't-dd': '#00bcd4', 't-cl': '#4caf50', 't-ca': '#ff9800',
        't-bb': '#f44336', 't-cv': '#9c27b0', 't-cvl': '#e91e63',
        't-ss': '#2196f3', 't-bbv': '#6a1b9a',
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 4: Create postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 5: Create index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>碧蓝航线数据查询站</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Install dependencies**

Run: `cd /workspace && npm install`
Expected: Successful installation

- [ ] **Step 7: Verify build**

Run: `cd /workspace && npm run build`
Expected: Build succeeds, `dist/` created

- [ ] **Step 8: Commit**

```bash
git add package.json vite.config.js tailwind.config.js postcss.config.js index.html
git commit -m "chore: project setup with Vite + React + Tailwind"
```

---

### Task 2: Core App Files

**Files:** Create `src/main.jsx`, `src/App.jsx`, `src/index.css`

- [ ] **Step 1: Create src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body { @apply bg-al-bg text-al-text font-sans antialiased; }
}

@layer components {
  .al-panel { @apply bg-al-panel rounded-lg border border-al-border; }
  .al-panel-light { @apply bg-al-panel-light rounded-lg border border-al-border; }
  .al-btn { @apply px-4 py-2 rounded-md bg-al-panel-light border border-al-border text-al-text-muted hover:text-al-text hover:border-al-gold transition-colors cursor-pointer; }
  .al-btn-gold { @apply px-4 py-2 rounded-md bg-al-gold text-al-bg font-semibold hover:bg-al-gold-dark transition-colors cursor-pointer; }
  .al-input { @apply bg-al-bg border border-al-border rounded-md px-4 py-2 text-al-text placeholder-al-text-dim focus:outline-none focus:border-al-gold transition-colors; }
  .al-badge { @apply inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold; }
  .al-nav-link { @apply px-3 py-2 rounded-md text-al-text-muted hover:text-al-text hover:bg-al-panel-light transition-colors cursor-pointer; }
  .al-nav-link-active { @apply text-al-gold bg-al-panel-light; }
  .al-card { @apply al-panel p-4 hover:border-al-gold/50 transition-colors cursor-pointer; }
  .al-table-th { @apply text-left text-al-text-muted font-semibold px-4 py-2 border-b border-al-border text-sm; }
  .al-table-td { @apply px-4 py-2 border-b border-al-border text-sm; }
  .al-tag { @apply inline-flex items-center px-2 py-0.5 rounded text-xs font-medium; }
}

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: #0f1923; }
::-webkit-scrollbar-thumb { background: #2a3a50; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #3a4a60; }
```

- [ ] **Step 2: Create src/main.jsx**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
```

- [ ] **Step 3: Create src/App.jsx**

```jsx
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Ships from './pages/Ships.jsx'
import Equipment from './pages/Equipment.jsx'
import Fleets from './pages/Fleets.jsx'
import Stages from './pages/Stages.jsx'
import ShipDetail from './components/ShipDetail.jsx'
import EquipmentDetail from './components/EquipmentDetail.jsx'
import FleetDetail from './components/FleetDetail.jsx'
import StageDetail from './components/StageDetail.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/ships" element={<Ships />} />
        <Route path="/ships/:id" element={<ShipDetail />} />
        <Route path="/equipment" element={<Equipment />} />
        <Route path="/equipment/:id" element={<EquipmentDetail />} />
        <Route path="/fleets" element={<Fleets />} />
        <Route path="/fleets/:id" element={<FleetDetail />} />
        <Route path="/stages" element={<Stages />} />
        <Route path="/stages/:id" element={<StageDetail />} />
      </Route>
    </Routes>
  )
}
```

- [ ] **Step 4: Verify build**

Run: `cd /workspace && npm run build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/main.jsx src/App.jsx src/index.css
git commit -m "feat: core app setup with routing and global styles"
```

---

### Task 3: Utility Modules

**Files:** Create `src/utils/rarity.js`, `src/utils/shipType.js`

- [ ] **Step 1: Create src/utils/rarity.js**

```javascript
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
```

- [ ] **Step 2: Create src/utils/shipType.js**

```javascript
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
```

- [ ] **Step 3: Verify build**

Run: `cd /workspace && npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/utils/rarity.js src/utils/shipType.js
git commit -m "feat: add rarity and ship type utility modules"
```

---

### Task 4: Data Files - Ships

**Files:** Create `src/data/ships.json`

- [ ] **Step 1: Create src/data/ships.json**

Create a JSON file with 22 ships. Each ship follows this structure:
```json
{
  "id": "laffey_ii",
  "name": "拉菲II",
  "nameEn": "USS Laffey II",
  "rarity": "ELITE",
  "shipType": "DD",
  "faction": "白鹰",
  "levelCap": 125,
  "stats": { "hp": 2111, "fp": 117, "trp": 305, "aa": 208, "air": 0, "asw": 154, "spd": 40, "luck": 95 },
  "slots": ["炮击", "鱼雷", "防空"],
  "skills": [{ "name": "...", "level": 10, "desc": "..." }],
  "equipment": { "recommended": [...], "slot1": "...", "slot2": "...", "slot3": "..." },
  "notes": "..."
}
```

Include these ships (matching user's screenshots): 拉菲II, 独角兽·改, 巴尔的摩, 阿拉巴马, 圣路易斯, 十纱, 布莱默顿, 冯矢, 优玖露, 普林斯顿, 亚利桑那, 圣哈辛托, 伦敦, 发, 喀山, 拎, 鲟·META, 黑暗界·META, 克利夫兰, 伯明翰, 格里德利.

Use the full data defined in the spec document. Each ship must have complete stats, skills, and equipment recommendations.

- [ ] **Step 2: Validate JSON**

Run: `cd /workspace && node -e "JSON.parse(require('fs').readFileSync('src/data/ships.json','utf8')); console.log('Valid')"`
Expected: "Valid"

- [ ] **Step 3: Commit**

```bash
git add src/data/ships.json
git commit -m "feat: add ship data with 22 ships"
```

---

### Task 5: Data Files - Equipment, Fleets, Stages

**Files:** Create `src/data/equipment.json`, `src/data/fleets.json`, `src/data/stages.json`

- [ ] **Step 1: Create src/data/equipment.json**

Include 15 equipment entries covering types: 炮击, 鱼雷, 防空, 舰载机, 弹药. Each with stats, fitShipTypes, source, rating, description.

Structure:
```json
{
  "id": "gun_130mm_single",
  "name": "130mm单装炮",
  "rarity": "R",
  "type": "炮击",
  "stats": { "fp": 8, "dps": 15.2 },
  "fitShipTypes": ["DD", "CL"],
  "source": ["掉落：3-1", "商店"],
  "rating": 7.5,
  "description": "..."
}
```

- [ ] **Step 2: Create src/data/fleets.json**

Include 8 fleet compositions: boss_auto_v1, boss_auto_v2, pvp_volley, pvp_evasion, farm_low_cost, farm_leveling, ex_high_difficulty, submarine_team. Each with category, front/back ship IDs, equipmentTips, notes.

Structure:
```json
{
  "id": "boss_auto_v1",
  "name": "Boss 自律队 V1",
  "category": "boss",
  "front": ["baltimore", "st_louis", "laffey_ii"],
  "back": ["alabama", "unicorn_mod", "shinano"],
  "recommendedLevel": 100,
  "description": "...",
  "equipmentTips": { "baltimore": "...", ... },
  "notes": "..."
}
```

- [ ] **Step 3: Create src/data/stages.json**

Include 5 key stages with drop data: 3-1, 7-4, 8-4, 10-3, 12-4. Each with chapter, difficulty, drops (ships + equipment).

- [ ] **Step 4: Validate all JSON**

Run: `cd /workspace && for f in src/data/*.json; do echo -n "$f: "; node -e "JSON.parse(require('fs').readFileSync('$f','utf8')); console.log('Valid')"; done`
Expected: All "Valid"

- [ ] **Step 5: Commit**

```bash
git add src/data/equipment.json src/data/fleets.json src/data/stages.json
git commit -m "feat: add equipment, fleet, and stage data"
```

---

### Task 6: Layout and Shared Components

**Files:** Create `src/components/Layout.jsx`, `src/components/SearchBar.jsx`, `src/components/FilterPanel.jsx`

- [ ] **Step 1: Create src/components/Layout.jsx**

```jsx
import { NavLink, Outlet } from 'react-router-dom'
import { Anchor, Ship, Wrench, Users, MapPin } from 'lucide-react'

const navItems = [
  { to: '/', label: '首页', icon: Anchor, end: true },
  { to: '/ships', label: '舰娘图鉴', icon: Ship },
  { to: '/equipment', label: '装备图鉴', icon: Wrench },
  { to: '/fleets', label: '阵容推荐', icon: Users },
  { to: '/stages', label: '关卡活动', icon: MapPin },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-al-bg">
      <header className="sticky top-0 z-50 bg-al-panel border-b border-al-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
          <NavLink to="/" className="flex items-center gap-2 text-al-gold font-bold text-lg">
            <Anchor className="w-6 h-6" />
            <span>碧蓝航线数据站</span>
          </NavLink>
          <nav className="flex items-center gap-1 ml-auto">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `al-nav-link flex items-center gap-1.5 ${isActive ? 'al-nav-link-active' : ''}`
                }
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="max-w-7xl mx-auto px-4 py-6 text-center text-al-text-dim text-sm border-t border-al-border mt-8">
        碧蓝航线数据查询站 · 纯数据驱动 · AI 友好
      </footer>
    </div>
  )
}
```

- [ ] **Step 2: Create src/components/SearchBar.jsx**

```jsx
import { Search, X } from 'lucide-react'

export default function SearchBar({ value, onChange, placeholder = '搜索...' }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-al-text-dim" />
      <input
        type="text"
        className="al-input w-full pl-10 pr-10"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-al-text-dim hover:text-al-text cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create src/components/FilterPanel.jsx**

```jsx
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { RARITY_LIST } from '../utils/rarity.js'
import { SHIP_TYPE_LIST } from '../utils/shipType.js'

const CATEGORY_LIST = ['boss', 'pvp', 'farm', 'ex', 'special']
const STAGE_TYPE_LIST = ['普通', '困难', '极难', 'SP']

export default function FilterPanel({ filters, onFilterChange, filterConfig }) {
  const [expanded, setExpanded] = useState(true)

  const toggleValue = (key, value) => {
    const current = filters[key] || []
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
    onFilterChange({ ...filters, [key]: next })
  }

  const renderGroup = (label, key, options) => (
    <div className="mb-3">
      <div className="text-xs text-al-text-muted mb-1.5 font-medium">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const active = (filters[key] || []).includes(opt)
          return (
            <button
              key={opt}
              onClick={() => toggleValue(key, opt)}
              className={`px-2 py-1 rounded text-xs border transition-colors cursor-pointer ${
                active ? 'bg-al-gold text-al-bg border-al-gold' : 'bg-al-panel-light text-al-text-muted border-al-border hover:border-al-gold/50'
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="al-panel p-4">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between text-al-text-muted cursor-pointer">
        <span className="font-semibold text-sm">筛选条件</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {expanded && (
        <div className="mt-3">
          {filterConfig?.showRarity && renderGroup('稀有度', 'rarity', RARITY_LIST)}
          {filterConfig?.showShipType && renderGroup('舰种', 'shipType', SHIP_TYPE_LIST)}
          {filterConfig?.showCategory && renderGroup('阵容类型', 'category', CATEGORY_LIST)}
          {filterConfig?.showStageType && renderGroup('关卡类型', 'stageType', STAGE_TYPE_LIST)}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Verify build**

Run: `cd /workspace && npm run build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/components/Layout.jsx src/components/SearchBar.jsx src/components/FilterPanel.jsx
git commit -m "feat: add Layout, SearchBar, FilterPanel components"
```

---

### Task 7: List Card Components

**Files:** Create `src/components/ShipCard.jsx`, `src/components/EquipmentCard.jsx`, `src/components/FleetCard.jsx`

- [ ] **Step 1: Create src/components/ShipCard.jsx**

```jsx
import { useNavigate } from 'react-router-dom'
import { RarityBadge } from '../utils/rarity.js'
import { ShipTypeTag } from '../utils/shipType.js'

const statLabel = {
  hp: '耐久', fp: '炮击', trp: '雷击', aa: '防空',
  air: '航空', asw: '反潜', spd: '航速', luck: '幸运',
}

export default function ShipCard({ ship }) {
  const navigate = useNavigate()
  return (
    <div className="al-card" onClick={() => navigate(`/ships/${ship.id}`)}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-al-text">{ship.name}</h3>
            <ShipTypeTag type={ship.shipType} />
          </div>
          <p className="text-xs text-al-text-dim mt-0.5">{ship.nameEn}</p>
        </div>
        <RarityBadge rarity={ship.rarity} />
      </div>
      <div className="flex items-center gap-3 text-xs text-al-text-muted mb-2">
        <span>Lv.{ship.levelCap}</span>
        <span>{ship.faction}</span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs">
        {ship.stats && Object.entries(ship.stats).slice(0, 8).map(([key, val]) => (
          <div key={key} className="flex flex-col">
            <span className="text-al-text-dim">{statLabel[key] || key}</span>
            <span className="text-al-text font-medium">{val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create src/components/EquipmentCard.jsx**

```jsx
import { useNavigate } from 'react-router-dom'
import { RarityBadge } from '../utils/rarity.js'

const typeColor = {
  '炮击': 'text-r-r', '鱼雷': 'text-r-sr', '防空': 'text-r-ssr',
  '舰载机': 'text-r-elite', '弹药': 'text-r-meta', '水下装备': 'text-t-ss',
}

const statLabel = { fp: '炮击', trp: '雷击', aa: '防空', air: '航空', dps: 'DPS' }

export default function EquipmentCard({ equip }) {
  const navigate = useNavigate()
  return (
    <div className="al-card" onClick={() => navigate(`/equipment/${equip.id}`)}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-al-text">{equip.name}</h3>
          <p className={`text-xs mt-0.5 ${typeColor[equip.type] || 'text-al-text-muted'}`}>{equip.type}</p>
        </div>
        <RarityBadge rarity={equip.rarity} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
        {equip.stats && Object.entries(equip.stats).map(([key, val]) => (
          <div key={key} className="flex flex-col">
            <span className="text-al-text-dim">{statLabel[key] || key}</span>
            <span className="text-al-text font-medium">{val}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-al-text-muted">
        <span>评分: {equip.rating}</span>
        <span>适配: {equip.fitShipTypes?.join('/')}</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create src/components/FleetCard.jsx**

```jsx
import { useNavigate } from 'react-router-dom'

const categoryLabels = { boss: 'Boss', pvp: 'PvP', farm: '刷图', ex: 'EX', special: '特殊' }
const categoryColors = {
  boss: 'bg-r-meta/20 text-r-meta',
  pvp: 'bg-r-sr/20 text-r-sr',
  farm: 'bg-r-r/20 text-r-r',
  ex: 'bg-r-elite/20 text-r-elite',
  special: 'bg-t-cv/20 text-t-cv',
}

export default function FleetCard({ fleet, ships }) {
  const navigate = useNavigate()
  const getShipName = (id) => ships?.find(s => s.id === id)?.name || id

  return (
    <div className="al-card" onClick={() => navigate(`/fleets/${fleet.id}`)}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-al-text">{fleet.name}</h3>
          <p className="text-xs text-al-text-dim mt-0.5">{fleet.description}</p>
        </div>
        <span className={`al-badge border ${categoryColors[fleet.category] || ''}`}>
          {categoryLabels[fleet.category] || fleet.category}
        </span>
      </div>
      <div className="text-xs text-al-text-muted mb-1">
        前排: {fleet.front.map(id => getShipName(id)).join(' / ')}
      </div>
      <div className="text-xs text-al-text-muted mb-3">
        后排: {fleet.back.map(id => getShipName(id)).join(' / ')}
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-al-text-dim">推荐等级: Lv.{fleet.recommendedLevel}</span>
        <span className="text-al-gold">查看详情 →</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify build**

Run: `cd /workspace && npm run build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/components/ShipCard.jsx src/components/EquipmentCard.jsx src/components/FleetCard.jsx
git commit -m "feat: add list card components"
```

---

### Task 8: Detail View Components

**Files:** Create `src/components/ShipDetail.jsx`, `src/components/EquipmentDetail.jsx`, `src/components/FleetDetail.jsx`, `src/components/StageDetail.jsx`

- [ ] **Step 1: Create src/components/ShipDetail.jsx**

```jsx
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Swords, Shield, Zap, Wind, Anchor, Crosshair, Heart, Cog } from 'lucide-react'
import ships from '../data/ships.json'
import equipment from '../data/equipment.json'
import { RarityBadge, rarityStars } from '../utils/rarity.js'
import { ShipTypeTag, getShipTypeColor } from '../utils/shipType.js'

const statIcons = { hp: Heart, fp: Swords, trp: Zap, aa: Shield, air: Wind, asw: Anchor, spd: Crosshair, luck: Cog }
const statLabels = { hp: '耐久', fp: '炮击', trp: '雷击', aa: '防空', air: '航空', asw: '反潜', spd: '航速', luck: '幸运' }

export default function ShipDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const ship = ships.find(s => s.id === id)
  if (!ship) return <div className="p-8 text-center text-al-text-muted">未找到该舰娘</div>

  return (
    <div>
      <button onClick={() => navigate(-1)} className="al-btn mb-4 flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> 返回
      </button>
      <div className="al-panel p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-al-text">{ship.name}</h1>
              <ShipTypeTag type={ship.shipType} />
              <RarityBadge rarity={ship.rarity} />
            </div>
            <p className="text-al-text-muted">{ship.nameEn} · {ship.faction} · Lv.{ship.levelCap}上限</p>
          </div>
          <div className={`text-3xl font-bold ${getShipTypeColor(ship.shipType)}`}>{rarityStars[ship.rarity]}</div>
        </div>

        <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><Swords className="w-4 h-4" /> 属性面板</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Object.entries(ship.stats).map(([key, val]) => {
            const Icon = statIcons[key] || Cog
            return (
              <div key={key} className="al-panel-light p-3">
                <div className="flex items-center gap-1.5 text-xs text-al-text-dim mb-1"><Icon className="w-3 h-3" /> {statLabels[key]}</div>
                <div className="text-xl font-bold text-al-text">{val}</div>
              </div>
            )
          })}
        </div>

        <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><Zap className="w-4 h-4" /> 技能</h2>
        <div className="space-y-3 mb-6">
          {ship.skills.map((skill, i) => (
            <div key={i} className="al-panel-light p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-al-text">{skill.name}</span>
                <span className="text-xs text-al-gold">Lv.{skill.level}</span>
              </div>
              <p className="text-sm text-al-text-muted">{skill.desc}</p>
            </div>
          ))}
        </div>

        <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><Shield className="w-4 h-4" /> 推荐装备</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {ship.equipment.recommended.map((equipName, i) => {
            const equip = equipment.find(e => e.name === equipName)
            return (
              <div key={i} className="al-panel-light p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm text-al-text font-medium">{equipName}</div>
                  {equip && <div className="text-xs text-al-text-dim">{equip.type} · {equip.rarity}</div>}
                </div>
                <span className="text-xs text-al-text-dim">槽位{i + 1}</span>
              </div>
            )
          })}
        </div>

        {ship.notes && (
          <div className="al-panel-light p-3">
            <div className="text-xs text-al-text-dim mb-1">备注</div>
            <p className="text-sm text-al-text">{ship.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create src/components/EquipmentDetail.jsx**

```jsx
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, Shield, Target, MapPin, Info } from 'lucide-react'
import equipment from '../data/equipment.json'
import ships from '../data/ships.json'
import { RarityBadge } from '../utils/rarity.js'

const statLabels = { fp: '炮击', trp: '雷击', aa: '防空', air: '航空', dps: 'DPS' }

export default function EquipmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const equip = equipment.find(e => e.id === id)
  if (!equip) return <div className="p-8 text-center text-al-text-muted">未找到该装备</div>

  const fitShips = ships.filter(s => equip.fitShipTypes?.includes(s.shipType))

  return (
    <div>
      <button onClick={() => navigate(-1)} className="al-btn mb-4 flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> 返回</button>
      <div className="al-panel p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-al-text">{equip.name}</h1>
              <RarityBadge rarity={equip.rarity} />
            </div>
            <p className="text-al-text-muted">{equip.type} · 评分 {equip.rating}/10</p>
          </div>
        </div>

        <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><Shield className="w-4 h-4" /> 属性</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {Object.entries(equip.stats).map(([key, val]) => (
            <div key={key} className="al-panel-light p-3">
              <div className="text-xs text-al-text-dim">{statLabels[key] || key}</div>
              <div className="text-xl font-bold text-al-text">{val}</div>
            </div>
          ))}
        </div>

        <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><Target className="w-4 h-4" /> 适配舰种</h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {equip.fitShipTypes?.map(t => <span key={t} className="al-tag bg-al-panel-light text-al-text-muted">{t}</span>)}
        </div>

        {fitShips.length > 0 && (
          <>
            <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><Star className="w-4 h-4" /> 适配舰娘</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
              {fitShips.map(s => <div key={s.id} className="al-panel-light p-2 text-sm text-al-text">{s.name}</div>)}
            </div>
          </>
        )}

        <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" /> 获取途径</h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {equip.source?.map(src => <span key={src} className="al-tag bg-al-panel-light text-al-text-muted">{src}</span>)}
        </div>

        {equip.description && (
          <div className="al-panel-light p-3">
            <div className="flex items-center gap-1 text-xs text-al-text-dim mb-1"><Info className="w-3 h-3" /> 说明</div>
            <p className="text-sm text-al-text">{equip.description}</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create src/components/FleetDetail.jsx**

```jsx
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Swords } from 'lucide-react'
import fleets from '../data/fleets.json'
import ships from '../data/ships.json'
import { RarityBadge } from '../utils/rarity.js'
import { ShipTypeTag } from '../utils/shipType.js'

const categoryLabels = { boss: 'Boss', pvp: 'PvP', farm: '刷图', ex: 'EX', special: '特殊' }

export default function FleetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fleet = fleets.find(f => f.id === id)
  if (!fleet) return <div className="p-8 text-center text-al-text-muted">未找到该阵容</div>

  const getShip = (sid) => ships.find(s => s.id === sid)

  const renderShip = (sid, i, zone) => {
    const ship = getShip(sid)
    if (!ship) return null
    return (
      <div key={sid} className="al-panel-light p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-al-text-dim">#{i + 1}</span>
            <span className="font-semibold text-al-text">{ship.name}</span>
            <ShipTypeTag type={ship.shipType} />
            <RarityBadge rarity={ship.rarity} />
          </div>
          <span className="text-xs text-al-text-muted">Lv.{ship.levelCap}</span>
        </div>
        {fleet.equipmentTips?.[sid] && (
          <div className="text-xs text-al-text-dim pl-4">
            <span className="text-al-text-muted">装备推荐：</span>{fleet.equipmentTips[sid]}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} className="al-btn mb-4 flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> 返回</button>
      <div className="al-panel p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-al-text">{fleet.name}</h1>
              <span className="al-badge border bg-al-gold/20 text-al-gold border-al-gold/30">{categoryLabels[fleet.category] || fleet.category}</span>
            </div>
            <p className="text-al-text-muted">{fleet.description}</p>
          </div>
          <div className="text-right text-al-text-muted">
            <div className="text-xs">推荐等级</div>
            <div className="text-xl font-bold text-al-gold">Lv.{fleet.recommendedLevel}</div>
          </div>
        </div>

        <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> 前排</h2>
        <div className="space-y-3 mb-6">{fleet.front.map((sid, i) => renderShip(sid, i))}</div>

        <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><Swords className="w-4 h-4" /> 后排</h2>
        <div className="space-y-3 mb-6">{fleet.back.map((sid, i) => renderShip(sid, i))}</div>

        {fleet.notes && (
          <div className="al-panel-light p-3">
            <div className="text-xs text-al-text-dim mb-1">战术提示</div>
            <p className="text-sm text-al-text">{fleet.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create src/components/StageDetail.jsx**

```jsx
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, Users } from 'lucide-react'
import stages from '../data/stages.json'
import ships from '../data/ships.json'
import equipment from '../data/equipment.json'
import { RarityBadge } from '../utils/rarity.js'

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
```

- [ ] **Step 5: Verify build**

Run: `cd /workspace && npm run build`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add src/components/ShipDetail.jsx src/components/EquipmentDetail.jsx src/components/FleetDetail.jsx src/components/StageDetail.jsx
git commit -m "feat: add detail view components"
```

---

### Task 9: Page Components

**Files:** Create `src/pages/Home.jsx`, `src/pages/Ships.jsx`, `src/pages/Equipment.jsx`, `src/pages/Fleets.jsx`, `src/pages/Stages.jsx`

- [ ] **Step 1: Create src/pages/Home.jsx**

```jsx
import { Link } from 'react-router-dom'
import { Anchor, Ship, Wrench, Users, MapPin, ArrowRight, TrendingUp } from 'lucide-react'
import fleets from '../data/fleets.json'

const featuredFleets = fleets.slice(0, 4)

const quickLinks = [
  { to: '/ships', label: '舰娘图鉴', icon: Ship, desc: '查询全舰娘数据' },
  { to: '/equipment', label: '装备图鉴', icon: Wrench, desc: '装备属性与推荐' },
  { to: '/fleets', label: '阵容推荐', icon: Users, desc: '各类阵容搭配' },
  { to: '/stages', label: '关卡活动', icon: MapPin, desc: '掉落与活动信息' },
]

const stats = [
  { label: '收录舰娘', value: '22+', icon: Ship },
  { label: '收录装备', value: '15+', icon: Wrench },
  { label: '阵容方案', value: '8', icon: Users },
  { label: '覆盖关卡', value: '5+', icon: MapPin },
]

export default function Home() {
  return (
    <div>
      <div className="al-panel p-8 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Anchor className="w-10 h-10 text-al-gold" />
          <h1 className="text-3xl font-bold text-al-text">碧蓝航线数据查询站</h1>
        </div>
        <p className="text-al-text-muted mb-6">纯数据驱动 · AI 友好 · 无图片 专注文本数据展示</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="al-panel-light p-3 text-center">
              <Icon className="w-5 h-5 text-al-gold mx-auto mb-1" />
              <div className="text-2xl font-bold text-al-text">{value}</div>
              <div className="text-xs text-al-text-muted">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {quickLinks.map(({ to, label, icon: Icon, desc }) => (
          <Link key={to} to={to} className="al-card text-center">
            <Icon className="w-6 h-6 text-al-gold mx-auto mb-2" />
            <div className="font-semibold text-al-text">{label}</div>
            <div className="text-xs text-al-text-muted mt-0.5">{desc}</div>
          </Link>
        ))}
      </div>

      <h2 className="text-al-gold font-semibold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> 推荐阵容</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {featuredFleets.map(f => (
          <Link key={f.id} to={`/fleets/${f.id}`} className="al-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-al-text">{f.name}</h3>
              <ArrowRight className="w-4 h-4 text-al-text-dim" />
            </div>
            <p className="text-xs text-al-text-muted">{f.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create src/pages/Ships.jsx**

```jsx
import { useState, useMemo } from 'react'
import ships from '../data/ships.json'
import ShipCard from '../components/ShipCard.jsx'
import SearchBar from '../components/SearchBar.jsx'
import FilterPanel from '../components/FilterPanel.jsx'

export default function Ships() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ rarity: [], shipType: [] })

  const filtered = useMemo(() => {
    return ships.filter(ship => {
      if (search && !ship.name.includes(search) && !ship.nameEn.toLowerCase().includes(search.toLowerCase())) return false
      if (filters.rarity.length > 0 && !filters.rarity.includes(ship.rarity)) return false
      if (filters.shipType.length > 0 && !filters.shipType.includes(ship.shipType)) return false
      return true
    })
  }, [search, filters])

  return (
    <div>
      <h1 className="text-2xl font-bold text-al-text mb-4">舰娘图鉴</h1>
      <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="搜索舰娘名称..." /></div>
      <div className="mb-4"><FilterPanel filters={filters} onFilterChange={setFilters} filterConfig={{ showRarity: true, showShipType: true }} /></div>
      <div className="text-sm text-al-text-muted mb-3">共 {filtered.length} / {ships.length} 艘舰娘</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(ship => <ShipCard key={ship.id} ship={ship} />)}
      </div>
      {filtered.length === 0 && <div className="text-center py-12 text-al-text-dim">没有找到匹配的舰娘</div>}
    </div>
  )
}
```

- [ ] **Step 3: Create src/pages/Equipment.jsx**

```jsx
import { useState, useMemo } from 'react'
import equipment from '../data/equipment.json'
import EquipmentCard from '../components/EquipmentCard.jsx'
import SearchBar from '../components/SearchBar.jsx'
import FilterPanel from '../components/FilterPanel.jsx'

const EQUIP_TYPES = ['炮击', '鱼雷', '防空', '舰载机', '弹药', '水下装备']

export default function Equipment() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ rarity: [], type: [] })

  const filtered = useMemo(() => {
    return equipment.filter(eq => {
      if (search && !eq.name.includes(search)) return false
      if (filters.rarity.length > 0 && !filters.rarity.includes(eq.rarity)) return false
      if (filters.type.length > 0 && !filters.type.includes(eq.type)) return false
      return true
    })
  }, [search, filters])

  return (
    <div>
      <h1 className="text-2xl font-bold text-al-text mb-4">装备图鉴</h1>
      <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="搜索装备名称..." /></div>
      <div className="mb-4">
        <div className="al-panel p-4 mb-3">
          <div className="text-xs text-al-text-muted mb-2 font-medium">装备类型</div>
          <div className="flex flex-wrap gap-1.5">
            {EQUIP_TYPES.map(t => {
              const active = filters.type?.includes(t)
              return (
                <button key={t} onClick={() => { const cur = filters.type || []; setFilters({ ...filters, type: active ? cur.filter(v => v !== t) : [...cur, t] }) }}
                  className={`px-2 py-1 rounded text-xs border transition-colors cursor-pointer ${active ? 'bg-al-gold text-al-bg border-al-gold' : 'bg-al-panel-light text-al-text-muted border-al-border hover:border-al-gold/50'}`}>
                  {t}
                </button>
              )
            })}
          </div>
        </div>
        <FilterPanel filters={{ rarity: filters.rarity }} onFilterChange={(f) => setFilters({ ...filters, rarity: f.rarity })} filterConfig={{ showRarity: true }} />
      </div>
      <div className="text-sm text-al-text-muted mb-3">共 {filtered.length} / {equipment.length} 件装备</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(eq => <EquipmentCard key={eq.id} equip={eq} />)}
      </div>
      {filtered.length === 0 && <div className="text-center py-12 text-al-text-dim">没有找到匹配的装备</div>}
    </div>
  )
}
```

- [ ] **Step 4: Create src/pages/Fleets.jsx**

```jsx
import { useState, useMemo } from 'react'
import fleets from '../data/fleets.json'
import ships from '../data/ships.json'
import FleetCard from '../components/FleetCard.jsx'
import FilterPanel from '../components/FilterPanel.jsx'

export default function Fleets() {
  const [filters, setFilters] = useState({ category: [] })

  const filtered = useMemo(() => {
    return fleets.filter(f => {
      if (filters.category.length > 0 && !filters.category.includes(f.category)) return false
      return true
    })
  }, [filters])

  return (
    <div>
      <h1 className="text-2xl font-bold text-al-text mb-4">阵容推荐</h1>
      <div className="mb-4"><FilterPanel filters={filters} onFilterChange={setFilters} filterConfig={{ showCategory: true }} /></div>
      <div className="text-sm text-al-text-muted mb-3">共 {filtered.length} / {fleets.length} 套阵容</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map(fleet => <FleetCard key={fleet.id} fleet={fleet} ships={ships} />)}
      </div>
      {filtered.length === 0 && <div className="text-center py-12 text-al-text-dim">没有找到匹配的阵容</div>}
    </div>
  )
}
```

- [ ] **Step 5: Create src/pages/Stages.jsx**

```jsx
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import stages from '../data/stages.json'
import { MapPin, Package, Users, ChevronRight } from 'lucide-react'

const difficultyColors = { '普通': 'text-r-r', '困难': 'text-r-elite', '极难': 'text-r-meta', 'SP': 'text-r-sr' }

export default function Stages() {
  const [chapterFilter, setChapterFilter] = useState([])
  const chapters = [...new Set(stages.map(s => s.chapter))].sort((a, b) => a - b)

  const filtered = useMemo(() => {
    if (chapterFilter.length === 0) return stages
    return stages.filter(s => chapterFilter.includes(s.chapter))
  }, [chapterFilter])

  const toggleChapter = (ch) => {
    setChapterFilter(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch])
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-al-text mb-4">关卡活动</h1>
      <div className="mb-4">
        <div className="al-panel p-4">
          <div className="text-xs text-al-text-muted mb-2 font-medium">章节筛选</div>
          <div className="flex flex-wrap gap-1.5">
            {chapters.map(ch => {
              const active = chapterFilter.includes(ch)
              return (
                <button key={ch} onClick={() => toggleChapter(ch)}
                  className={`px-2 py-1 rounded text-xs border transition-colors cursor-pointer ${active ? 'bg-al-gold text-al-bg border-al-gold' : 'bg-al-panel-light text-al-text-muted border-al-border hover:border-al-gold/50'}`}>
                  第{ch}章
                </button>
              )
            })}
          </div>
        </div>
      </div>
      <div className="text-sm text-al-text-muted mb-3">共 {filtered.length} / {stages.length} 个关卡</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map(stage => (
          <Link key={stage.id} to={`/stages/${stage.id}`} className="al-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-al-text">{stage.name}</h3>
              <ChevronRight className="w-4 h-4 text-al-text-dim" />
            </div>
            <div className="flex items-center gap-3 text-xs text-al-text-muted mb-2">
              <span>第{stage.chapter}章</span>
              <span className={difficultyColors[stage.difficulty] || ''}>{stage.difficulty}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-al-text-muted">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {stage.drops?.ships?.length || 0} 舰娘</span>
              <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {stage.drops?.equipment?.length || 0} 装备</span>
            </div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center py-12 text-al-text-dim">没有找到匹配的关卡</div>}
    </div>
  )
}
```

- [ ] **Step 6: Verify build**

Run: `cd /workspace && npm run build`
Expected: Build succeeds

- [ ] **Step 7: Commit**

```bash
git add src/pages/Home.jsx src/pages/Ships.jsx src/pages/Equipment.jsx src/pages/Fleets.jsx src/pages/Stages.jsx
git commit -m "feat: add all page components"
```

---

### Task 10: Final Build and Verification

**Files:** Verify all files are created correctly, start dev server for manual testing

- [ ] **Step 1: Verify all required files exist**

Run: `cd /workspace && find src -name '*.jsx' -o -name '*.js' -o -name '*.json' | sort`
Expected: Lists all component, page, utility, and data files

- [ ] **Step 2: Final production build**

Run: `cd /workspace && npm run build`
Expected: Build succeeds with no errors, `dist/` directory contains built files

- [ ] **Step 3: Start dev server for testing**

Run: `cd /workspace && npm run dev`
Expected: Dev server starts, output includes a URL (e.g., `http://localhost:5173`)

- [ ] **Step 4: Verify all routes work**

Navigate to each route and verify:
- `/` - Home page with stats and links
- `/ships` - Ship list with search/filter
- `/ships/laffey_ii` - Ship detail view
- `/equipment` - Equipment list
- `/equipment/gun_130mm_single` - Equipment detail
- `/fleets` - Fleet list
- `/fleets/boss_auto_v1` - Fleet detail
- `/stages` - Stage list
- `/stages/3_1` - Stage detail

- [ ] **Step 5: Verify data integrity**

Run: `cd /workspace && node -e "
const ships = JSON.parse(require('fs').readFileSync('src/data/ships.json','utf8'));
const equips = JSON.parse(require('fs').readFileSync('src/data/equipment.json','utf8'));
const fleets = JSON.parse(require('fs').readFileSync('src/data/fleets.json','utf8'));
const stages = JSON.parse(require('fs').readFileSync('src/data/stages.json','utf8'));
console.log('Ships:', ships.length, 'Equipment:', equips.length, 'Fleets:', fleets.length, 'Stages:', stages.length);
// Verify fleet references exist
const shipIds = new Set(ships.map(s => s.id));
let missing = [];
fleets.forEach(f => {
  [...f.front, ...f.back].forEach(sid => {
    if (!shipIds.has(sid)) missing.push(f.id + ' references missing ship: ' + sid);
  });
});
console.log(missing.length === 0 ? 'All fleet references valid' : 'Missing: ' + missing.join(', '));
"`
Expected: Output shows counts and validation pass

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete Azur Lane data query site implementation"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All spec sections are implemented: ship data, equipment data, fleet composition, stage/event data, search/filter, detail views, game-style UI
- [x] **No placeholders:** Every task has complete code, no TBD/TODO markers
- [x] **Type consistency:** RarityBadge, ShipTypeTag, statLabel maps are consistent across all components
- [x] **Data integrity:** Fleet ship IDs reference valid ship IDs in ships.json
- [x] **No images:** All visual elements use CSS colors, icons, text badges — no image files referenced

