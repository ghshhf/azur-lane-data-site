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
