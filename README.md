# 碧蓝航线数据查询站

纯文本的碧蓝航线数据检索工具：舰娘属性、装备属性、阵容搭配、关卡掉落。
不使用任何游戏图片/立绘，全部信息以文字与数值呈现，便于人和 AI 直接读取。

## 快速开始

```bash
npm install
npm run dev        # 本地开发
npm run validate   # 数据校验（主键唯一、引用完整、必填字段）
npm run build      # 构建（prebuild 会自动先跑校验）
npm run preview    # 预览构建产物
```

## 目录结构

```
├── index.html
├── src/
│   ├── main.jsx                     入口，BrowserRouter
│   ├── App.jsx                      路由表（含 404 兜底）
│   ├── index.css                    Tailwind 与 al-* 组件类
│   ├── components/                  布局、卡片、详情、筛选、搜索
│   ├── constants/display.jsx        属性/分类的中文名、图标、配色（跨组件共用）
│   ├── pages/                       首页与四个列表页
│   ├── utils/                       稀有度/舰种映射、筛选选项派生、标题、返回
│   └── data/                        舰娘 / 装备 / 阵容 / 关卡 / 元信息
├── scripts/validate-data.mjs        数据校验脚本
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
| `meta.json` | 数据快照日期、收录范围 | — |

收录范围是**本人持有与常用条目，不是全量图鉴**，范围写在 `meta.json` 的 `scope` 字段。

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
- `ships[i].slots` 是槽位类型数组（如 `["战列主炮","副炮","防空","设备","设备"]`），详情页按它渲染槽位，`equipment.recommended` 按位置对应到槽位。
- 筛选项（稀有度、舰种、装备类型、阵容分类）由页面从数据派生，不硬编码。
  新增一个装备类型或舰种，筛选栏会自动出现，无需改代码。

## 部署

仓库已配 GitHub Actions：推到 `main` 后自动构建并发布到 GitHub Pages。

- 子路径部署的资源前缀在 `vite.config.js` 的 `base`（默认 `/azur-lane-data-site/`）。
- 部署在域名根目录时，用环境变量覆盖：`VITE_BASE_URL=/ npm run build`。
- 工作流会把 `dist/index.html` 复制为 `dist/404.html`，用于 SPA 深链接刷新兜底。

## 已知限制

- 纯客户端渲染：搜索引擎与 AI 抓取只能拿到空壳 HTML，需要预渲染或静态导出才能兑现「AI 友好」。
- 无自动化测试，数据正确性靠 `npm run validate` 加人工核对。
- 稀有度枚举（`N/R/SR/SSR/ELITE/META`）与游戏官方口径（Normal / Rare / Elite / Super Rare / Ultra Rare / Priority / Decisive）并不一致。

## 说明

游戏数据版权归发行商所有，本仓库仅作个人查询用途。
