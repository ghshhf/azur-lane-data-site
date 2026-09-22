// 冒烟测试入口：把每个路由渲染成 HTML 字符串，用于在没有浏览器的环境里发现运行时错误。
// 由 scripts/smoke.mjs 经 vite --ssr 打包后调用。
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import App from '../../src/App.jsx'
import ships from '../../src/data/ships.json'
import equipment from '../../src/data/equipment.json'
import fleets from '../../src/data/fleets.json'
import stages from '../../src/data/stages.json'

export function renderRoute(path) {
  return renderToString(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

export function allRoutes() {
  const routes = ['/', '/ships', '/equipment', '/fleets', '/stages', '/no-such-page']
  for (const s of ships) routes.push(`/ships/${s.id}`)
  for (const e of equipment) routes.push(`/equipment/${e.id}`)
  for (const f of fleets) routes.push(`/fleets/${f.id}`)
  for (const s of stages) routes.push(`/stages/${s.id}`)
  // 不存在的详情 id 也应给出友好降级而不是崩溃
  routes.push('/ships/__missing__', '/equipment/__missing__', '/fleets/__missing__', '/stages/__missing__')
  return routes
}
