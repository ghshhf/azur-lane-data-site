# 碧蓝航线数据查询站 - 设计文档

## 概述

一个纯数据驱动的碧蓝航线（Azur Lane）查询工具，提供舰娘数据、装备数据、阵容搭配和关卡活动信息的查询功能。网站不包含任何图片/立绘，专注于文本数据的展示和检索，方便 AI 和用户直接读取、处理数据。

## 目标用户

- 碧蓝航线玩家，需要快速查阅数据
- AI 智能体，需要结构化数据进行阵容分析和推荐
- 数据爱好者，需要整理和比对游戏数据

## 设计原则

1. **纯数据驱动**：无图片、无立绘，全部文本/数值数据
2. **AI 友好**：结构化 JSON 数据，便于 AI 读写
3. **高效检索**：快速搜索、筛选、排序
4. **易于扩展**：数据模块化，方便新增/更新

## 技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| 框架 | React 18 + Vite | 组件化 SPA 开发 |
| 样式 | TailwindCSS 3 | 游戏风格 UI 定制 |
| 路由 | React Router v6 | 单页应用路由 |
| 图标 | Lucide React | 轻量图标 |
| 数据 | 本地 JSON 文件 | 可后续对接 API |
| 构建 | Vite | 快速开发和构建 |

## 页面结构

```
首页
├── 舰娘图鉴     /ships
├── 装备图鉴     /equipment
├── 阵容推荐     /fleets
└── 关卡活动     /stages
```

### 首页
- 站点导航入口
- 热门推荐阵容
- 最近更新提示

### 舰娘图鉴 `/ships`
- 搜索框（名称、拼音）
- 筛选器（舰种、稀有度、阵营、等级）
- 列表视图（卡片/表格切换）
- 详情页 `/ships/:id`

### 装备图鉴 `/equipment`
- 搜索框
- 筛选器（类型、稀有度、适配舰种）
- 列表视图
- 详情页 `/equipment/:id`

### 阵容推荐 `/fleets`
- 分类（推图、EX、PvP、低耗、 Boss）
- 阵容卡片：前排/后排配置、装备推荐、属性要求
- 阵容详情页 `/fleets/:id`

### 关卡活动 `/stages`
- 章节列表
- 掉落表（舰娘、装备）
- 活动时间表
- 活动详情页 `/stages/:id`

## 数据结构

### 舰娘 (Ship)
```json
{
  "id": "laffey_ii",
  "name": "拉菲II",
  "nameEn": "USS Laffey II",
  "rarity": "ELITE",
  "shipType": "DD",
  "faction": "白鹰",
  "levelCap": 125,
  "stats": {
    "hp": 2111,
    "fp": 117,
    "trp": 305,
    "aa": 208,
    "air": 0,
    "asw": 154,
    "spd": 40,
    "luck": 95
  },
  "slots": ["炮击", "鱼雷", "防空"],
  "skills": [
    { "name": "战意激增", "level": 10, "desc": "..." },
    { "name": "哨戒任务", "level": 10, "desc": "..." },
    { "name": "背水之战", "level": 10, "desc": "..." }
  ],
  "equipment": {
    "recommended": ["130mm单装炮", "五联装533mm鱼雷", "25mm三连装机炮"],
    "slot1": "炮击",
    "slot2": "鱼雷",
    "slot3": "防空"
  },
  "notes": "反潜/雷击特化，有潜艇感知"
}
```

### 装备 (Equipment)
```json
{
  "id": "gun_130mm_single",
  "name": "130mm单装炮",
  "rarity": "R",
  "type": "炮击",
  "stats": {
    "fp": 8,
    "dps": 15.2
  },
  "fitShipTypes": ["DD", "CL"],
  "source": ["掉落：3-1", "商店"],
  "rating": 7.5,
  "description": ""
}
```

### 阵容 (Fleet)
```json
{
  "id": "boss_auto_v1",
  "name": "Boss 自律队 V1",
  "category": "boss",
  "front": ["baltimore", "st_louis", "laffey_ii"],
  "back": ["alabama", "unicorn_mod", "shinano"],
  "recommendedLevel": 100,
  "description": "通用 Boss 自律阵容，巴尔的摩核心",
  "equipmentTips": {
    "baltimore": "重巡主炮+重型弹",
    "laffey_ii": "鱼雷+防空"
  },
  "notes": "前排可根据敌方伤害类型调整"
}
```

### 关卡 (Stage)
```json
{
  "id": "3_1",
  "name": "3-1 珊瑚海海战",
  "chapter": 3,
  "difficulty": "普通",
  "drops": {
    "ships": ["laffey", "simon_van"],
    "equipment": ["gun_130mm_single", "torpedo_533mm"]
  },
  "notes": ""
}
```

## 视觉风格

### 配色
- 主背景：深蓝 `#0f1923`
- 面板：深蓝灰 `#1a2332`
- 强调：金色 `#d4a843`
- 文字：白色 `#ffffff` / 浅灰 `#b0b8c4`

### 稀有度色阶
| 稀有度 | 颜色 |
|--------|------|
| N | 灰 `#8a8a8a` |
| R | 蓝 `#4a9eff` |
| SR | 紫 `#c77dff` |
| SSR | 金 `#ffd700` |
| ELITE | 橙 `#ff8c00` |
| META | 红 `#ff4444` |

### 舰种色阶
| 舰种 | 颜色 |
|------|------|
| DD | 青 `#00bcd4` |
| CL | 绿 `#4caf50` |
| CA | 橙 `#ff9800` |
| BB | 红 `#f44336` |
| CV | 紫 `#9c27b0` |
| CVL | 粉 `#e91e63` |
| SS | 蓝 `#2196f3` |
| BBV | 深紫 `#6a1b9a` |

### 布局
- 响应式：移动端单列，桌面端多列
- 卡片式列表，表格详情
- 搜索/筛选栏固定在顶部

## 数据管理

### 数据存放
- `src/data/ships.json` - 舰娘数据
- `src/data/equipment.json` - 装备数据
- `src/data/fleets.json` - 阵容数据
- `src/data/stages.json` - 关卡数据

### 数据维护
- 手动整理核心数据
- 后续可接入社区维护的数据源
- JSON 格式便于 AI 读写和更新

## 无图片策略

全站不使用任何游戏图片/立绘/头像。通过以下方式替代视觉识别：
- 稀有度用颜色徽章（文字+色块）
- 舰种用颜色标签
- 用星级符号表示稀有度（★）
- 所有信息通过文字和数值传达

## AI 集成

设计上支持 AI 工具直接读取数据：
- JSON 文件结构规范
- 字段命名清晰统一
- 可通过 API 路由暴露数据（后续扩展）
- 支持文本搜索和程序化查询

## 项目结构

```
/workspace
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── data/
│   │   ├── ships.json
│   │   ├── equipment.json
│   │   ├── fleets.json
│   │   └── stages.json
│   ├── components/
│   │   ├── Layout.jsx
│   │   ├── SearchBar.jsx
│   │   ├── FilterPanel.jsx
│   │   ├── ShipCard.jsx
│   │   ├── EquipmentCard.jsx
│   │   ├── FleetCard.jsx
│   │   ├── ShipDetail.jsx
│   │   ├── EquipmentDetail.jsx
│   │   ├── FleetDetail.jsx
│   │   └── StageDetail.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Ships.jsx
│   │   ├── Equipment.jsx
│   │   ├── Fleets.jsx
│   │   └── Stages.jsx
│   └── utils/
│       ├── rarity.js
│       └── shipType.js
```
