# Develata's Space 🌌
> Mathematics, Coding, Thinking, and Gaming.

欢迎来到 **develata.me** 的源码仓库。这里是一个数学系大学生的数字花园，记录了我学习编程、探索数学、阅读哲学的过程，同时也包含了一个基于 Vue 3 编写的互动游戏实验室。

## 📖 项目简介
本项目使用 **VitePress** 构建，充分利用了其“静态 Markdown + 动态 Vue 组件”的特性。这不仅是一个静态博客，更是一个集成了数学公式渲染、代码高亮和交互式应用的全功能个人站点。

## ✨ 核心特性
* **数学友好**：集成 `markdown-it-mathjax3`，完美支持 LaTeX 数学公式渲染。
* **互动组件**：内置多个使用 Vue 3 编写的经典小游戏。
* **图表支持**：集成 Mermaid.js，支持绘制流程图与时序图。
* **自动部署**：配置了 GitHub Actions，提交代码即可自动构建并发布到 GitHub Pages。
* **动态侧边栏**：编写了自定义脚本，自动根据文件目录生成侧边栏导航。

## 🗂️ 内容板块
内容主要分为以下几个领域：

### 1. 🧠 知识库 (Knowledge)
沉淀我的学习与思考：
* **Math (数学)**：概率论、大偏差理论等学术笔记，支持 LaTeX 公式。
* **Coding (编程)**：Linux 运维、Web 开发 (Vue/VitePress)、网络技术 (VPS/内网穿透) 等实战经验。
* **Sharing (分享)**：杂项分享与生活经验。

### 2. 🗓️ Daily
`/daily/` 是轻量入口，分为 News 新闻日汇总与 Math 每日数学；各自拥有按年/月/日期倒序的完整归档。

### 3. 🎮 游戏实验室 (Game Lab)
完全由 Vue 3 编写的网页端小游戏，无需后端，纯前端逻辑：
* **Convergence (收敛)**：The Gradient War (梯度战争)，策略/动作类实验性作品。
* **认知任务实验室 (Cognitive Lab)**：舒尔特数字搜索、Flanker、空间 n-back 与规则切换；强调任务表现与科学解释边界。
* **Tetris (俄罗斯方块)**：经典消除游戏，针对移动端触控优化。
* **Snake (贪吃蛇)**：包含经典模式与平滑移动特性。
* **2048**：经典的数字合并游戏，支持撤销。
* **扫雷 (Minesweeper)**：支持“智能和弦”操作（双击数字自动插旗/挖开）。
* **数独 (Sudoku)**：包含笔记模式、撤销及递归求解可视化动画。
* **生命游戏 (Game of Life)**：康威生命游戏，内置滑翔机、脉冲星等预设。
* **关灯游戏 (Lights Out)**：基于线性代数原理的解谜游戏。
* **五子棋 (Gomoku)**：包含 PVE（AI 对战）与 PVP 模式。
* **井字棋 (Tic Tac Toe)**：包含 Minimax 算法实现的 AI。

### 4. 📚 阅读室 (Books)
哲学经典阅读笔记与摘录：
* 斯宾诺莎：《伦理学》(Ethics)
* 培根：《新工具》(Novum Organum)
* 维特根斯坦：《逻辑哲学论》(Tractatus)

### 5. ✍️ 关于 (About)
生活记录、杂谈以及年度归档。

## 🚀 快速开始 / 模板使用
本项目提供了一个纯净的分支，去除了我的个人文章和笔记，保留了完整的架构、配置以及所有游戏组件。如果您喜欢这个站点的风格和功能，可以直接克隆该分支作为起点。

### 方式一：克隆纯净模板 (推荐复用)
如果您想使用本站架构搭建自己的博客：

```bash
# 克隆 template 分支
git clone -b template [https://github.com/Develata/develata.github.io.git](https://github.com/Develata/develata.github.io.git) my-blog

cd my-blog
bun install
bun run dev
```

### 方式二：克隆完整内容 (查看源码)
如果您想查看或参考我写的具体文章内容和配置细节：

```bash
# 克隆默认分支 (main)
git clone [https://github.com/Develata/develata.github.io.git](https://github.com/Develata/develata.github.io.git)

cd develata.github.io
bun install
bun run dev
```

## 🛠️ 技术栈
* **框架**: VitePress
* **语言**: TypeScript / Markdown
* **图表**: Mermaid.js
* **数学渲染**: MathJax 3
* **样式**: 自定义 CSS 变量 (支持深色模式)

## 📂 目录结构

```text
.
├── docs/
│   ├── .vitepress/        # 核心配置、主题与组件
│   │   ├── config.mts     # VitePress 主配置文件 (含侧边栏生成逻辑)
│   │   └── theme/
│   │       ├── components/ # 存放所有游戏 Vue 组件 (Game2048, Sudoku 等)
│   │       └── ...
│   ├── about/             # "关于我"页面 (Me, Blog)
│   ├── books/             # 读书笔记
│   ├── games/             # 游戏页面入口 (Markdown 引入 Vue 组件)
│   ├── knowledge/         # 知识库 (Math, Coding, Sharing)
│   ├── daily/             # Daily 入口与每日数学公共投影
│   ├── news/              # 自动新闻的原始输入（构建重写至 /daily/news/）
│   └── index.md           # 网站首页
├── package.json           # 项目依赖与脚本
└── .github/workflows/     # 自动部署脚本
```

## 每日数学发布

`docs/daily/math/` 是注册归档的公共投影，不是编辑源。
在归档所在主机运行 `bun run daily-math:sync /absolute/archive`；导入器只接受
`state/issues.jsonl` 中登记、路径/日期/标题一致且 SHA-256 匹配的文章。
网站标题统一为 `YYYY-MM-DD · 主标题`，仅在导入时移除栏目前缀及首个顶层中文
冒号后的解释性副标题；数学、代码、括号内的冒号与 ASCII 映射/比值冒号不截断。
同一纯函数生成 page title、H1、索引，侧栏与 RSS 直接消费该投影；完整原题保留在
manifest，原有 description 保持。除首个 H1 外正文保持不变，仅修复历史 TeX 中已确认的 form-feed + `rac`、backspace + `igl`
转义损坏；原归档及 Telegram 回执不改动。内部编辑元数据不写入网站 pageData。

归档首页与侧栏统一按年份倒序 → 月份倒序 → 原日期倒序组织。Daily 拥有
`daily/calendar.ts` 与 DailySidebarGroup/Item 的折叠和活动分支策略；News 的分类、
最近 20 条卡片和文章页的“其他分类/月份链接到最新文章”语义由 News adapter 保留。
每日数学由 manifest adapter 提供元数据。两个归档首页都提供 SSR 原生历史链接；
禁用 JavaScript 仍可通过 details 浏览。`/daily/` 只序列化两栏各最新 5 项元数据。
普通 Knowledge/Math 恢复 DefaultSidebarGroup 与通用目录排序，同级文件夹独立折叠，
不嵌入每日数学，只保留一个可选入口链接。通用 sidebar 不含每日数学路径条件。

VitePress 1.x 的预取器只提供全局开关，没有按链接或路由的 opt-out。实查恢复原生
预取会下载 Daily 可见链接的文章正文，因此暂时保留 `prefetchLinks: false`，而非为
Math/Daily 注入运行时预取补丁；SPA 点击导航与按需搜索不变。这与恢复普通 Math
侧栏是两个独立决策。

### 路由与生产者

- 网站 canonical：`/daily/news/`、`/daily/math/`，导航为 Daily 下拉菜单。
- News 生产者 `rss-ai-news` 的 `github_path_prefix`/分类/年/日期输出契约继续写入
  `docs/news/`；VitePress wildcard rewrites 直接映射至 `daily/news/`。不改生产者
  配置、不复制新闻，后续新增文件自动得到新路由、旧链接跳转和同一套索引/侧栏/RSS。
- journal importer 和独立 `publish_website.py` 的允许投影目录均为 `docs/daily/math/`。
  原归档、ledger、Telegram receipts 不移动；迁移后实际重跑发布器并检查 no-op。
- GitHub Pages **不解释 `_redirects`**。构建结束后 `daily/routes.ts` 为所有旧
  `/news/`、`/knowledge/math/daily-math/` 首页和文章输出独立 HTTP 200 HTML 跳转页，
  `location.replace` 保留 query/hash，提供 meta-refresh 和无 JS 原生链接；不声称 HTTP 301。
  Unicode 目标使用 URL 编码。这些文件不进入 VitePress 页面表、搜索、sitemap 或 RSS。
  canonical、导航、prev/next、搜索只使用新文章路由；历史文章 URL 仍用于稳定 RSS GUID。
- 订阅 canonical 为 `/rss/daily-news.xml`、`/rss/daily-math.xml`。没有为旧 News RSS
  地址添加 alias 或跳转。Knowledge/Math feeds 仅包含普通笔记，All 汇总两类 Daily
  和其他栏目；一个 GUID 只出现一次。`/about/rss` 和页面 autodiscovery 指向新 feeds。

`/rss/daily-math.xml` 保留全部条目，最近 5 篇
（不足 5 篇时为全部）通过 `content:encoded` 内嵌完整 HTML/MathML；其余仅含标题、
原日期（Asia/Shanghai）、新文章 URL、稳定旧 GUID 与简短纯文本摘要。新文章加入后第六篇
转为摘要，但身份与日期不变，不创建新条目。All 聚合复用同一窗口，
只为窗口内文章执行 RSS 数学渲染；
其他文章不受影响。全文保留在服务器渲染的文章页；阅读器可按自身功能从链接提取
全文，RSS 没有强制客户端自动抓取全文的通用标准。订阅入口在 `/about/rss`。

每日数学使用构建期 TeX → 原生 MathML（现代浏览器支持），避免每个公式膨胀成
SVG 路径；256 项有界公式缓存，无客户端 MathJax 下载。其他页面保持 SVG 行为。
RSS 阅读器可打开文章阅读。完整站点构建固定 Node 4 GiB 堆上限，
避免 Node 自动选择的 2 GiB 堆在全量历史下溢出。

验证：`bun run daily-math:test` + `bun run sidebar:test` → `bun run build` → `bun run daily-math:verify`。
路由门禁遍历每个 News/Math 原始页面与真实 dist，检查旧跳转、新 canonical、完整
SSR 历史、News 最近 20 条、无重复 RSS 身份及 sitemap；未来生产者路径也有独立用例。
GitHub Actions 和 clean-source 构建均包含这些门禁，校验所有文章与 RSS 的数量、
投影 hash、简洁标题、GUID、原日期、滚动全文窗口和文章 SSR 数学。同步重复运行不改变文件时间，也不产生
空提交；本地 journal 自动化独立重试推送，CI/Pages 负责部署，不依赖 Telegram。

## 📬 联系方式

* **Author**: Develata
* **Email**: [develata@qq.com](mailto:develata@qq.com)
* **GitHub**: [Develata](https://github.com/Develata)