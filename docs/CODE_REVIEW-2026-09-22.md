# 代码评审：azur-lane-data-site（2026-09-22）

评审对象：`github.com/ghshhf/azur-lane-data-site`，基线提交 `87abc58`（2026-08-19）。
本轮同时修掉了确定性问题，见文末「已修清单」。

---

## 一、实况摘要

| 项 | 现状 |
|----|------|
| 技术栈 | React 18 + Vite 5 + Tailwind 3 + react-router 6 + lucide-react |
| 代码规模 | 34 个受版本控制文件，482 KB（含 `package-lock.json` 93 KB） |
| 数据规模 | 舰娘 24 · 装备 50 · 阵容 8 · 关卡 5 · 数据原始体积 44.7 KB |
| 提交历史 | 4 次提交，作者 `azur-lane-dev`，最后提交 2026-08-19 |
| 构建产物 | JS 239.07 KB（gzip 72.98 KB）· CSS 16.72 KB（gzip 3.61 KB） |
| 工程设施 | 无 README · 无 ESLint/Prettier · 无测试 · 无 CI · 无部署配置 |
| 可运行性 | `npm install && npm run build` 通过（33.5 s，1595 模块） |

技术选型本身没有问题：数据量小的时候「JSON + SPA + 派生筛选」是合理选择。问题集中在**数据一致性无人把关**与**部署/分享链路缺失**两块。

---

## 二、确定性问题（已在本次修复）

### 1. 装备数据存在 3 组重复主键 —— 影响面最大的一处

`equipment.json` 里 `torpedo_533mm_quint`、`aa_bofors_dual_100`、`aa_bofors_quad` 各出现两条记录。第二条多带 `count`/`enhanced`（持有数量、强化等级），是追加玩家持有信息时复制了整条记录、而非更新原记录。

连锁后果：

- 列表渲染 `key={eq.id}` 冲突，React 复用错位；
- 详情页 `equipment.find(e => e.id === id)` 永远只命中第一条 → 第二条的 `count: 8 / 4 / 2`、`enhanced: 10` **永不显示**；
- 同一 id 的两条记录 `playerOwned` 自相矛盾（一条 `false` 一条 `true`）；
- 首页「我的装备」按记录数算是 37，实际唯一持有 36 件。

修复后：53 条 → 50 条唯一记录，持有 36 件。

### 2. 七个「点了必然空结果」的筛选按钮

筛选项是硬编码枚举，与数据脱钩：

| 页面 | 死选项 | 数据实际情况 |
|------|--------|--------------|
| 舰娘 | 稀有度 `N`、`SR` | 只有 `R/SSR/ELITE/META` |
| 舰娘 | 舰种 `BBV` | 24 艘里 0 艘航战 |
| 装备 | 稀有度 `N`、`ELITE`、`META` | 只有 `R/SR/SSR` |
| 阵容 | 分类 `ex` | 8 套里 0 套 EX |

### 3. 装备页漏掉 2 个真实存在的类别

数据里装备类型共 8 类，`Equipment.jsx` 硬编码的 `EQUIP_TYPES` 只列了 6 类。**「设备」4 件、「特殊兵装」1 件在筛选栏里根本不存在** —— 这 5 件能出现在全部列表里，却无法被单独筛出。比死选项更严重：不是多点一下空结果，而是筛不到。

### 4. 详情页返回按钮会用空白页把用户弹出站点

四个详情页都是 `navigate(-1)`。从分享链接、收藏夹、或新标签页直接打开 `/ships/xxx` 时历史栈为空，点「返回」直接离开站点。

### 5. 没有 404 路由

`App.jsx` 无 `path="*"`，未知路径命中 Layout 后渲染空白主区域。

### 6. favicon 每次加载都 404

`index.html` 引用 `/vite.svg`，但仓库没有 `public/` 目录，该文件不存在。

### 7. 部署链路缺失（分享出去大概率白屏）

- `vite.config.js` 未配 `base`。部署到 `ghshhf.github.io/azur-lane-data-site/` 时资源路径指向域名根 → 白屏。
- 无 SPA 兜底。`BrowserRouter` + 静态托管，深链接刷新 404。
- 无 CI。`.trae-html-share-packages/index.html.zip` 里是一个 2026-08-19 的旧构建快照（`index.html` 379 B vs 现在 392 B），是手工打包残留，说明分享靠手动。

### 8. 页面标题恒为站名

全仓 0 处 `useEffect`、0 处 `document.title`。四个详情页、四个列表页的浏览器标签都显示「碧蓝航线数据查询站」，分享出去没有标题信息。

### 9. 卡片用 `div onClick` 而非链接

`ShipCard`/`EquipmentCard`/`FleetCard` 三处。代价：键盘 Tab 无法聚焦（不可访问）、无法 `Ctrl+点击` 新标签页打开、无焦点提示、爬虫看不到任何链接。

### 10. 两处引用断裂静默通过

- `stages.json` 的 `3_1` 掉落表引用 `laffey`，但数据集里只有 `laffey_ii`（拉菲II）。详情页回退显示裸英文 id。
- `ships.json` 的 `trafalgar` 推荐装备「雷击特殊兵装」不在 `equipment.json` 中，原代码 `equip && ...` 静默吞掉，用户看到装备名却看不到类型与稀有度。

### 11. 数据里已有、但从未渲染的字段

| 字段 | 内容 | 处理 |
|------|------|------|
| `ships[i].slots` | 真实槽位类型数组（如 `["战列主炮","副炮","防空","设备","设备"]`，2–6 个槽） | 已改用真实槽位渲染，替代原来硬编码的「槽位1/2/3」 |
| `ships[i].equipment.actual` | 实装配置（西弗吉尼亚 5 槽、特拉法尔加 6 槽） | 已新增「实装配置」区块 |
| `equipment[i].count` / `enhanced` | 持有数量、强化等级 | 已用于卡片与详情页 |
| `playerInfo.position` / `flagship` | 阵容内位置、是否旗舰 | 仍是冗余字段：`FleetDetail` 用 `fleet.front/back` 数组决定位置，不看这两个字段 |

### 12. 工程闸门缺失

无任何机制能挡住上面第 1、10 类错误 —— JSON 能正常解析，错误只在运行时以小字或警告形式露出。

---

## 三、已修清单（本轮）

新增三条工程闸门：

| 命令 | 作用 |
|------|------|
| `npm run validate` | 主键唯一性、必填字段、引用完整性、枚举汇总；`prebuild` 钩子自动执行，不通过则构建失败 |
| `npm run validate -- --strict` | 把「引用未收录实体」的提示也视为失败 |
| `npm run test:smoke` | 97 个路由全部渲染成 HTML，断言无 `undefined`/`NaN`/`[object Object]` 泄漏 |

改动文件 32 个（+787 / −200）：

- **数据**：`equipment.json` 去重合并（53→50 条）；新增 `meta.json`（快照日期、收录范围）。
- **筛选项改为从数据派生**：`utils/options.js`；`Ships`/`Equipment`/`Fleets` 传入选项；`FilterPanel` 改为通用 `groups` 接口并支持分类中文名映射。新增品类会自动出现在筛选栏，无需改代码。
- **消除重复常量**：新增 `constants/display.jsx`，收敛原先散落在 6 个组件里的属性标签表、3 处的阵容分类表、3 处的图标表；未知键回退为键名，不再渲染 `undefined`。
- **可用性**：404 路由与 `NotFound` 页；`useDocumentTitle`（每个页面独立标题）；`useBackToList`（无历史栈时回退列表页，不再弹出站点）。
- **可访问性**：三张卡片与适配/掉落列表改成 `Link`，键盘可达、可新标签页打开、可被爬虫追踪。
- **降级展示**：引用未收录实体显示「尚未收录」，不再裸露英文 id、不再静默吞掉。
- **部署**：`vite.config.js` 加 `base`（默认 `/azur-lane-data-site/`，可用 `VITE_BASE_URL` 覆盖）；新增 GitHub Actions 工作流（推 `main` 自动构建发布到 Pages，并把 `index.html` 复制为 `404.html` 作 SPA 兜底）。
- **仓库卫生**：移除 `.trae-html-share-packages/` 旧构建残留并加入 `.gitignore`；补 `README.md`（此前完全没有）。

验证结果：

```
npm run validate    → 校验通过（舰娘 24 · 装备 50 · 阵容 8 · 关卡 5，提示 3 条）
npm run build       → ✓ built in 2.84s，JS 239.07 KB / gzip 72.98 KB
npm run test:smoke  → 冒烟测试：97 个路由，全部通过
```

---

## 四、待决策：更新方向

### A. 稀有度/舰种口径与游戏官方不一致（有硬证据）

对照 AzurAPI 官方数据集（614 舰娘 / 388 装备，已实测可用）：

| | 本站 | 官方 |
|---|---|---|
| 稀有度 | `N / R / SR / SSR / ELITE / META` 六档 | `Normal 42 / Rare 110 / Elite 247 / Super Rare 178 / Ultra Rare 9 / Priority 20 / Decisive 8` 七档 |
| 舰种 | 8 类 | 14 类（含战巡、大巡、浅水重炮舰、工作舰、运输舰、潜水母舰、风帆） |

两处具体偏差：

1. **`ELITE` 的位置错了**。本站把 ELITE 排在 SSR 之上（橙色、`#ff8c00`），而官方 Elite（精锐，紫）实际**低于** Super Rare（超稀有，金）。`utils/rarity.jsx` 的 `rarityStars` 里 `ELITE` 与 `SSR` 同为 `★★★★`，正是这个定义混乱的症状 —— 星级表已经无法区分这两档了。
2. **缺三档顶级稀有度**：Ultra Rare（9 艘）、Priority（20 艘）、Decisive（8 艘）不存在，而这三档恰是玩家最关心的。

另：舰种表把 `Battlecruiser` 归入 `BB`、`Large Cruiser` 归入 `CA`，属简化口径。

建议二选一：向官方七档 + 14 舰种对齐；或明确声明为自定义简化口径并写进 README。

### B. 规模问题：24 艘不等于「图鉴」

当前是私有数据集，不是全量图鉴。两条路：

- **保持私有集**：站名与首页口径改为「我的舰队数据站」「我的收藏」，把 `meta.json` 的 `scope` 显示在显眼位置。成本近乎为零。
- **接全量 AzurAPI**：614 舰娘 + 388 装备，原始数据 4.56 MB + 1.27 MB。**不能 `import` 进 bundle** —— 当前 bundle 只有 239 KB，全量会让它涨一个数量级以上，且首屏加载全部数据。必须改架构：构建期裁剪成精简字段 + 按需加载/分片，或直接换预渲染方案（见下条）。

这是架构级决定，需要先定方向。

### C. 「AI 友好」目前名不副实

站点首页与设计文档都把「AI 友好」列为核心原则，但纯客户端渲染的 SPA 对爬虫和 AI 抓取最不友好 —— 抓到的只有空壳 HTML，拿不到任何数据。要兑现这个原则，需要三选一：

- 预渲染 / 静态导出（Astro 或 `vite-plugin-ssr`），每个详情页出真实 HTML；
- 把 JSON 以静态路径暴露（`/data/ships.json`）+ sitemap + JSON-LD；
- 放弃该表述，改成「数据以结构化 JSON 存储」（这句是成立的，`src/data/*.json` 确实规范）。

### D. 设计文档承诺但未实现的功能

`docs/superpowers/specs/2026-08-18-...-design.md` 里写了、代码里没有的：

| 承诺 | 状态 |
|------|------|
| 舰娘搜索支持拼音 | 未实现（当前只匹配中文名与英文名） |
| 舰娘筛选：阵营、等级 | 未实现（当前只有稀有度、舰种） |
| 卡片/表格视图切换 | 未实现 |
| 装备筛选：适配舰种 | 未实现 |
| 关卡：活动时间表 | 未实现，数据里也没有活动/时间字段 |
| 首页：最近更新提示 | 未实现 |

### E. 其它可做项

- **无 ESLint/Prettier**：本轮改动量 787 行，纯靠人工保证风格一致，成本偏高。
- **bundle 未拆分**：44.7 KB 数据与代码打进同一个 chunk，数据更新会导致代码缓存整体失效。数据走 `fetch` 或单独 chunk 可分离二者。
- **无 TypeScript**：数据驱动的站点，用 TS 定义 Ship/Equipment/Fleet/Stage 接口，能在编辑器里直接标出第 10 类引用断裂，比运行时校验更早。
- **`playerInfo.position` / `flagship` 冗余**：或接入 UI（用于校验数据里的位置与旗舰声明），或从数据中移除。

---

## 五、结论

这套东西的**技术骨架没毛病** —— 组件划分清晰、Tailwind 主题 token 统一、数据与视图分离得干净，`slots`/`actual`/`count` 这些字段设计得比 UI 用到的还完整，说明当初是想扩展的。

真正的问题是三条：

1. **数据正确性靠人眼**，一次合并操作就能制造 3 组重复主键和 2 处引用断裂，且全部静默通过（已加 `validate` 与 `smoke` 闸门）；
2. **分享/部署链路没打通**，再好的东西也拿不出去（已加 base + Actions + 404 兜底）；
3. **枚举口径与游戏官方漂移**，这是内容层面的欠债，越晚对齐越难改（待决策）。

第 1、2 条已在本轮解决；第 3 条与数据规模扩张是产品决策，需要先定方向。
