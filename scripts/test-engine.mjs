#!/usr/bin/env node
// 引擎自检：断言配装求解与战力评估的性质，并打印各舰数值。
// 用法：npm run test:engine
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const { runEngineChecks } = await import(pathToFileURL(join(root, '.engine', 'entry.js')).href)

const { fail, lines } = runEngineChecks()
lines.forEach(l => console.log(l))

if (fail.length) {
  console.log(`\n引擎自检失败 ${fail.length} 条`)
  fail.forEach(f => console.log(`  ! ${f}`))
  process.exit(1)
}
console.log('\n引擎自检通过')
