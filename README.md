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

### 1. 🧮 数学笔记 (Mathematics)
记录我的专业课笔记与数学思考。
* 包含概率论（大偏差理论）等学术内容。
* 支持复杂的 LaTeX 公式展示。

### 2. 💻 编程与运维 (Coding & Linux)
实用的服务器搭建与开发指南，涵盖：
* **Linux 基础**：Debian/Ubuntu 配置、UFW 防火墙设置。
* **Web 服务**：OpenResty & Nginx 配置、SSL 证书自动签发 (Acme.sh)。
* **网络技术**：VPS 选购指南、内网穿透 (EasyTier/Tailscale)、Sing-box 搭建、网盘整合。

### 3. 🎮 游戏实验室 (Game Lab)
完全由 Vue 3 编写的网页端小游戏，无需后端，纯前端逻辑：
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

### 5. ✍️ 随笔 (Blog)
生活记录、杂谈以及年度归档。

## 🚀 快速开始 / 模板使用
本项目提供了一个纯净的分支，去除了我的个人文章和笔记，保留了完整的架构、配置以及所有游戏组件。如果您喜欢这个站点的风格和功能，可以直接克隆该分支作为起点。

### 方式一：克隆纯净模板 (推荐复用)
如果您想使用本站架构搭建自己的博客：

```bash
# 克隆 template 分支
git clone -b template [https://github.com/Develata/develata.github.io.git](https://github.com/Develata/develata.github.io.git) my-blog

cd my-blog
npm install
npm run dev
```

### 方式二：克隆完整内容 (查看源码)
如果您想查看或参考我写的具体文章内容和配置细节：

```bash
# 克隆默认分支 (main)
git clone [https://github.com/Develata/develata.github.io.git](https://github.com/Develata/develata.github.io.git)

cd develata.github.io
npm install
npm run dev
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
│   ├── about/             # "关于我"页面
│   ├── blog/              # 博客文章与归档数据逻辑
│   ├── books/             # 读书笔记
│   ├── games/             # 游戏页面入口 (Markdown 引入 Vue 组件)
│   ├── knowledge/         # 知识库 (Math, Coding, Sharing)
│   └── index.md           # 网站首页
├── package.json           # 项目依赖与脚本
└── .github/workflows/     # 自动部署脚本
```

## 📬 联系方式
* **Author**: Develata
* **Email**: [develata@qq.com](mailto:develata@qq.com)
* **GitHub**: [Develata](https://github.com/Develata)