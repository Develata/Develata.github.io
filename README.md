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

### 2. 📰 动态 (News)
站点的更新日志与最新动态。

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
│   ├── news/              # 站点动态
│   └── index.md           # 网站首页
├── package.json           # 项目依赖与脚本
└── .github/workflows/     # 自动部署脚本
```

## 每日数学发布

`docs/knowledge/math/daily-math/` 是注册归档的公共投影，不是编辑源。
在归档所在主机运行 `bun run daily-math:sync /absolute/archive`；导入器只接受
`state/issues.jsonl` 中登记、路径/日期/标题一致且 SHA-256 匹配的文章。
网站标题统一为 `YYYY-MM-DD · 主标题`，仅在导入时移除栏目前缀及首个顶层中文
冒号后的解释性副标题；数学、代码、括号内的冒号与 ASCII 映射/比值冒号不截断。
同一纯函数生成 page title、H1、索引，侧栏与 RSS 直接消费该投影；完整原题保留在
manifest，原有 description 保持。除首个 H1 外正文保持不变，仅修复历史 TeX 中已确认的 form-feed + `rac`、backspace + `igl`
转义损坏；原归档及 Telegram 回执不改动。内部编辑元数据不写入网站 pageData。

首页按原日期倒序列出全部历史；`/rss/daily-math.xml` 保留全部条目，最近 5 篇
（不足 5 篇时为全部）通过 `content:encoded` 内嵌完整 HTML/MathML；其余仅含标题、
原日期（Asia/Shanghai）、稳定文章 URL/GUID 与简短纯文本摘要。新文章加入后第六篇
转为摘要，但身份与日期不变，不创建新条目。Knowledge/Math/All 聚合复用同一窗口，
只为窗口内文章执行 RSS 数学渲染；
其他文章不受影响。全文保留在服务器渲染的文章页；阅读器可按自身功能从链接提取
全文，RSS 没有强制客户端自动抓取全文的通用标准。订阅入口在 `/about/rss`。

每日数学使用构建期 TeX → 原生 MathML（现代浏览器支持），避免每个公式膨胀成
SVG 路径；256 项有界公式缓存，无客户端 MathJax 下载。其他页面保持 SVG 行为。
RSS 阅读器可打开文章阅读。完整站点构建固定 Node 4 GiB 堆上限，
避免 Node 自动选择的 2 GiB 堆在全量历史下溢出。

验证：`bun run daily-math:test` → `bun run build` → `bun run daily-math:verify`。
GitHub Actions 和 clean-source 构建均包含这些门禁，校验所有文章与 RSS 的数量、
投影 hash、简洁标题、GUID、原日期、滚动全文窗口和文章 SSR 数学。同步重复运行不改变文件时间，也不产生
空提交；本地 journal 自动化独立重试推送，CI/Pages 负责部署，不依赖 Telegram。

## 📬 联系方式

* **Author**: Develata
* **Email**: [develata@qq.com](mailto:develata@qq.com)
* **GitHub**: [Develata](https://github.com/Develata)