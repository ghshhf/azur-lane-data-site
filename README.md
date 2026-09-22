# 碧蓝航线数据查询站 + 配装台

纯文本的碧蓝航线数据检索与配装工具：舰娘属性、装备属性、阵容搭配、关卡掉落，
以及「按我的库存求最优配装并对比战力」。不使用任何游戏图片/立绘，全部信息以文字与数值呈现。

## 快速开始

```bash
npm install
npm run dev              # 本地开发
npm run fetch:official   # 从官方档案生成槽位/效率/面板数据（需要网络）
npm run validate         # 数据校验（主键、引用、槽位规则、官方档案一致性）
npm run build            # 构建（prebuild 会自动先跑校验）
npm run preview          # 预览构建产物
npm test                 # 校验 + 构建 + 引擎自检 + 路由冒烟
```

## 配装台 `/fitting`

解决三件事：不会配装、不知道配装后战力多少、只能用已有的装备。

- 约束：槽位类型 + 装备适配舰种 + 库存件数，求确定解（求解器，不是让模型猜）
- 对比四组：空装 / 数据记录 / 我的仓库最优 / 理论最优
- 输出缺口清单（差哪几件、去哪刷）与全舰队库存盘点
- 舰娘面板与武器效率取自官方档案，三轴权重是自建口径 —— 分界写在 `docs/FITTING-ENGINE-2026-09-22.md`

## 目录结构

```
├── index.html
├── src/
│   ├── main.jsx                     入口，BrowserRouter
│   ├── App.jsx                      路由表（含 404 兜底）
│   ├── index.css                    Tailwind 与 al-* 组件类
│   ├── components/                  布局、卡片、详情、筛选、搜索
│   ├── constants/display.jsx        属性/分类的中文名、图标、配色（跨组件共用）
│   ├── pages/                       首页、四个列表页与配装台
│   ├── utils/
│   │   ├── slots.js                 槽位口径：官方槽位展开 + 设备槽补齐 + 可装性
│   │   ├── combat.js                战力模型：面板合成 + 三轴归一 + 评分
│   │   ├── fit.js                   配装求解器：库存约束搜索 + 缺口清单
│   │   └── ...                      稀有度/舰种映射、筛选选项派生、标题、返回
│   └── data/                        舰娘 / 装备 / 阵容 / 关卡 / 槽位 / 面板 / 元信息
├── scripts/
│   ├── fetch-official.mjs           从官方档案生成槽位与面板数据
│   ├── validate-data.mjs            数据校验
│   ├── test-engine.mjs              引擎自检 + 三轴值域诊断
│   └── smoke.mjs                    路由渲染冒烟测试
└── .github/workflows/deploy.yml     自动部署到 GitHub Pages
```

## 数据

数据放在 `src/data/`，直接改 JSON 即可，无需改代码。

| 文件 | 内容 | 当前条数 |
|------|------|----------|
| `ships.json` | 舰娘 | 24 |
| `equipment.json` | 装备 | 50 |
| `fleets.json` | 阵容 | 8 |
| `stages.json` | 关卡 | 5 |
| `slotRules.json` | 槽位→装备类型的可装性规则 | — |
| `shipSlots.json` | 官方槽位与武器效率（生成物，勿手改） | 18 |
| `shipPanels.json` | 官方分档面板（生成物，勿手改） | 18 |
| `meta.json` | 数据快照日期、收录范围 | — |

收录范围是**本人持有与常用条目，不是全量图鉴**，范围写在 `meta.json` 的 `scope` 字段。

`shipSlots.json` / `shipPanels.json` 由 `npm run fetch:official` 从官方档案（AzurAPI）生成，
覆盖 18/24 艘；未覆盖的舰娘回退用 `ships.json` 里的记录，界面与校验器会标注。

### 改完数据必须做的事

1. 跑 `npm run validate`。它会检查：
   - 主键 `id` 是否重复（重复会导致列表渲染 key 冲突、详情页只认第一条）
   - 必填字段是否缺失
   - `fleets` / `stages` 引用的舰娘、装备是否存在
   - `ships.equipment.recommended` 里的装备名是否在 `equipment.json` 中
2. 更新 `meta.json` 的 `updatedAt`（YYYY-MM-DD），首页和页脚会显示。

引用到尚未收录的实体不报错，页面会显示「尚未收录」。需要严格模式时：

```bash
npm run validate -- --strict
```

### 设计约定

- 同一件装备只有一条记录。持有数量/强化等级写在同一条记录的 `count` / `enhanced` 字段上，不要新增重复记录。
- **槽位以官方档案为准**（`shipSlots.json`）。`ships[i].slots` 是旧的手录字段，只是「去重后的槽型列举」，
  数量不可信（曾把阿拉巴马记成 4 槽、丢掉整条副炮线），仅在官方未收录该舰时作为回退。
  改槽位请改 `scripts/fetch-official.mjs` 的映射表后重跑，不要手改 `ships.json` 的 slots。
- 属性键名：`eva` = 机动、`spd` = 航速、`speed` = 射速（秒）。舰娘面板只有 `spd`，装备只给 `eva`，
  两者含义不同，不可当作同一个量相加。
- 筛选项（稀有度、舰种、装备类型、阵容分类）由页面从数据派生，不硬编码。
  新增一个装备类型或舰种，筛选栏会自动出现，无需改代码。

## 部署

仓库已配 GitHub Actions：推到 `main` 后自动构建并发布到 GitHub Pages。

- 子路径部署的资源前缀在 `vite.config.js` 的 `base`（默认 `/azur-lane-data-site/`）。
- 部署在域名根目录时，用环境变量覆盖：`VITE_BASE_URL=/ npm run build`。
- 工作流会把 `dist/index.html` 复制为 `dist/404.html`，用于 SPA 深链接刷新兜底。

## 已知限制

- 纯客户端渲染：搜索引擎与 AI 抓取只能拿到空壳 HTML，需要预渲染或静态导出才能兑现「AI 友好」。
- 装备表只收录 50 件，设备类仅 4 件且偏输出型，导致配装推荐里每个设备槽都去抢同一件。
- 装备属性是单标量 `dps`，未用官方 `tiers` 里的 `damage` / `rateOfFire` / `coefficient` 算期望伤害。
- 稀有度枚举（`N/R/SR/SSR/ELITE/META`）与游戏官方口径（Normal / Rare / Elite / Super Rare / Ultra Rare / Priority / Decisive）并不一致；
  同一个官方 Elite 在本站被拆成 SSR / R / ELITE 三种显示。
- 11 艘未持有条目的 `name` / `nameEn` 有错（如 `ark` 名称是「发」、`linn` 是「拎」、`shinano` 是「十纱」），
  抓取脚本用别名表对齐了一部分，`ships.json` 本身尚未改。

## 说明

游戏数据版权归发行商所有，本仓库仅作个人查询用途。
