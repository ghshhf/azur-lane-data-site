// 从数据集派生筛选选项：只列出数据里真实存在的取值。
// 硬编码枚举会与数据脱钩——出现「点了必然空结果」的死选项，或新增类别无法筛选。
export function uniqueValues(rows, key, order) {
  const present = new Set()
  for (const row of rows) {
    const v = row?.[key]
    if (Array.isArray(v)) v.forEach(x => present.add(x))
    else if (v != null && v !== '') present.add(v)
  }
  if (!order) return [...present].sort()
  // 已登记取值按给定顺序前置，未登记的新取值追加在后，保证新增数据也能筛到
  const known = order.filter(v => present.has(v))
  const extra = [...present].filter(v => !order.includes(v)).sort()
  return [...known, ...extra]
}
