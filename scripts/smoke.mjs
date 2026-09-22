#!/usr/bin/env node
// 冒烟测试：逐路由渲染，断言渲染成功且没有把 undefined / NaN 漏到页面上。
// 用法：npm run test:smoke
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { writeFileSync } from 'node:fs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
// Windows 下 Node 的 ESM 加载器要求绝对路径写成 file:// URL
const { renderRoute, allRoutes } = await import(pathToFileURL(join(root, '.smoke', 'entry.js')).href)

// SMOKE_DUMP=<路由> 时把该路由的渲染结果落盘，便于人工核对页面内容
if (process.env.SMOKE_DUMP) {
  const target = process.env.SMOKE_DUMP
  const out = process.env.SMOKE_DUMP_OUT ?? join(root, '.smoke', 'dump.html')
  writeFileSync(out, renderRoute(target), 'utf8')
  console.log(`已导出 ${target} → ${out}`)
  process.exit(0)
}

const routes = allRoutes()
const failures = []
const BAD = ['undefined', 'NaN', '[object Object]']

// react-router 的 <Link>/<NavLink> 内部使用 useLayoutEffect，服务端渲染必然告警，
// 与本测试目标无关，屏蔽掉以免淹没真正的失败信息。
const originalError = console.error
console.error = (...args) => {
  const first = args[0]
  if (typeof first === 'string' && first.includes('useLayoutEffect does nothing on the server')) return
  originalError(...args)
}

for (const path of routes) {
  let html
  try {
    html = renderRoute(path)
  } catch (err) {
    failures.push(`${path} 渲染抛错：${err.message}`)
    continue
  }
  if (!html || html.length < 40) failures.push(`${path} 渲染结果为空`)
  for (const token of BAD) {
    const at = html.indexOf(token)
    if (at >= 0) failures.push(`${path} 页面出现 ${token}：…${html.slice(Math.max(0, at - 60), at + 20)}…`)
  }
}

console.log(`冒烟测试：${routes.length} 个路由`)
if (failures.length) {
  console.log(`\n失败 ${failures.length} 条`)
  failures.forEach(f => console.log(`  ! ${f}`))
  process.exit(1)
}
console.log('全部通过')
