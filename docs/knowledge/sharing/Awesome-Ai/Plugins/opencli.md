---
title: OpenCLI
date: 2026-09-18
order: 6
---

# OpenCLI 使用指南

> 信息来源：OpenCLI 官方 README、Installation / Browser Bridge 文档、Browser Extension Privacy Policy 与 adapters 文档。本文以 **2026-09-18** 上游状态为准。

## 1. OpenCLI 是什么

[GitHub Repo](https://github.com/jackwener/OpenCLI)

OpenCLI 是一个面向人和 AI Agent 的统一自动化 CLI。它的核心目标不是再造一个 Browser Agent，而是把：

- 网站
- 已登录的 Chrome 会话
- Electron 桌面应用
- 本地 CLI

统一成 **可发现、可脚本化、尽量 deterministic 的命令接口**。

可以把它理解成三层能力：

```text
OpenCLI
├── Built-in Adapters
│   ├── Xiaohongshu
│   ├── Reddit
│   ├── Twitter/X
│   ├── Bilibili
│   └── 100+ sites
│
├── Browser Primitives
│   ├── open / state / click
│   ├── type / fill / select
│   ├── extract / network / eval
│   └── screenshot / tabs / wait ...
│
└── Local / Desktop Integration
    ├── gh / docker / wrangler ...
    └── Cursor / Codex / Antigravity / ChatGPT ...
```

它与 Playwright / Browser Use 一类工具最大的区别之一是：

> 对高频、稳定的网站操作，优先把流程收敛为 adapter，而不是每一次都让大模型重新理解页面、找按钮、点击和观察。

因此重复任务可以从：

```text
Agent
  ↓
理解页面
  ↓
找按钮
  ↓
点击 / 观察
  ↓
继续推理
```

逐渐变成：

```text
Agent
  ↓
opencli <site> <command> -f json
  ↓
structured result
```

这通常更快、更稳定，也更省上下文。

---

## 2. 我为什么安装 OpenCLI

OpenCLI 最适合填补的是这一层：

```text
API / native CLI 不好用
        ↓
但浏览器里已经有登录态
        ↓
Agent 需要真实操作网站
```

典型场景：

- Reddit / 小红书 / Twitter 等登录后才能稳定访问的平台
- 没有合适公开 API 的网站
- 临时网页操作、表单填写、页面数据提取
- 把反复出现的网页流程固化成 adapter
- 让 Agent 操作 Cursor、Codex 等支持的 Electron 应用
- 给本地已有 CLI 增加统一 discovery surface

不应该把它理解成：

> 所有互联网访问都走 OpenCLI。

更合理的是：

```text
API / Native CLI first
        ↓
专用 structured backend
        ↓
OpenCLI adapter
        ↓
通用 Browser primitives
```

例如 GitHub 已经有 `gh` 时，通常没有必要让 Chrome 去点 GitHub 页面。

---

## 3. CLI、Browser Bridge 与 Desktop App 的区别

这是 OpenCLI 最容易混淆的地方。

### 3.1 OpenCLI CLI / Runtime

真正提供核心能力的是：

```text
opencli
```

包括：

- built-in adapters
- browser commands
- plugin/adapters
- external CLI hub
- Electron desktop adapters

因此：

> **操作网页和支持的 Electron App，并不要求必须安装 OpenCLI Desktop App。**

### 3.2 Browser Bridge

如果需要控制 Chrome，则还需要：

```text
OpenCLI CLI
    ↓
Local daemon
    ↓
Chrome Browser Bridge Extension
    ↓
Logged-in Chrome
```

官方 Browser Bridge 使用本机 daemon，并在需要时自动启动。

浏览器侧需要安装官方 Chrome 扩展：

<https://chromewebstore.google.com/detail/opencli/ildkmabpimmkaediidaifkhjpohdnifk>

验证：

```bash
opencli doctor
```

### 3.3 OpenCLIApp

Windows / macOS 官方还提供 OpenCLIApp。

它主要增加：

- system tray
- setup / diagnostics
- updates
- browser-login keepalive
- Web → Markdown
- managed `opencli` command

它更像 **桌面管理层**，不是 OpenCLI 核心能力的唯一入口。

如果 OpenCLI 完全交给 Agent 使用，我更倾向：

```text
CLI-only
+
Browser Bridge
```

而不是再增加一个常驻 Desktop UI。

---

## 4. Windows 安装：Bun CLI-only

我目前更偏好用 Bun 管理 npm / Node.js 生态的全局 CLI，因此 Windows 上采用：

```powershell
bun add -g --trust @jackwener/opencli
```

上游 Installation 文档明确支持 Bun；官方示例主要使用 npm。

这里使用 `--trust` 是为了允许受信任包执行安装阶段需要的 lifecycle scripts，避免 postinstall 被 Bun 默认阻止后出现 adapter / resource 不完整的问题。

验证：

```powershell
opencli --version
opencli list
opencli doctor
```

更新可以重新安装 latest：

```powershell
bun add -g --trust @jackwener/opencli@latest
```

### 4.1 是否还需要 OpenCLIApp

如果：

```text
opencli --version   OK
opencli list        OK
opencli doctor      OK
Browser Bridge      connected
```

并且主要由 Agent 调用，那么没有必要额外安装 OpenCLIApp。

如果以后希望获得：

- 图形化 diagnostics
- tray 状态
- login keepalive
- Desktop managed runtime

再迁移到 OpenCLIApp 即可。

不建议长期同时维护：

```text
Bun global opencli
+
OpenCLIApp managed opencli
```

否则 `PATH` 中可能出现两个 `opencli`，升级来源也会变得不清楚。

检查：

```powershell
where.exe opencli
```

---

## 5. Browser Bridge 与独立 Chrome Profile

OpenCLI 会复用已有 Chrome 登录态。

我推荐单独创建：

```text
Chrome
├── Personal
└── Agent
    ├── OpenCLI Extension
    ├── Reddit
    ├── Twitter/X
    ├── Xiaohongshu
    └── 其它允许自动化的网站
```

不要把主浏览器的所有登录态直接暴露给 Agent。

OpenCLI 支持多个 Chrome Profile，并可以管理 profile alias：

```bash
opencli profile list
opencli profile rename <contextId> agent
opencli profile use agent
```

之后可以显式指定：

```bash
opencli --profile agent browser main state
```

这个结构的好处是把自动化账号与私人浏览环境隔离开。

---

## 6. Built-in Adapters

先查看已有能力：

```bash
opencli list
```

再查看某个平台：

```bash
opencli reddit --help
opencli twitter --help
opencli xiaohongshu --help
```

常见例子：

### 6.1 Reddit

```bash
opencli reddit search "random graphs" -f yaml
opencli reddit hot -f yaml
opencli reddit read POST_ID -f yaml
```

### 6.2 Twitter / X

```bash
opencli twitter search "AI agent" -f yaml
opencli twitter timeline -f yaml
opencli twitter profile USERNAME -f yaml
```

### 6.3 小红书

```bash
opencli xiaohongshu search "AI Agent" -f yaml
opencli xiaohongshu feed -f yaml
opencli xiaohongshu note "NOTE_URL" -f yaml
```

小红书的笔记读取通常需要搜索 / feed 返回的完整 URL 或 token 信息，不要假设裸 `note_id` 永远可用。

### 6.4 输出格式

Built-in commands 通常可以统一输出：

```text
table
json
yaml
md
csv
```

例如：

```bash
opencli reddit search "OpenCode" -f json
```

对于 Agent，优先：

```text
JSON / YAML
```

而不是让模型重新解析终端表格。

---

## 7. 通用 Browser Primitives

如果目标网站没有现成 adapter，OpenCLI 仍然可以直接驱动浏览器。

常见 primitives 包括：

```text
open
state
click
type
fill
select
keys
wait
get
find
extract
frames
screenshot
scroll
back
eval
network
tab list / new / select / close
```

典型模式：

```text
Open page
   ↓
Read structured state
   ↓
Interact
   ↓
Extract result
```

这更适合：

- 一次性的网页任务
- 新网站探索
- adapter 还没建立
- 表单操作
- 需要 network interception 的页面

---

## 8. 给 Agent 安装 OpenCLI Skills

OpenCLI 自带一组 Agent Skills。

如果使用 Bun，可以把官方 `npx` 示例替换成：

```bash
bunx skills add jackwener/opencli
```

或者只装需要的：

```bash
bunx skills add jackwener/opencli --skill opencli-browser
bunx skills add jackwener/opencli --skill opencli-usage
bunx skills add jackwener/opencli --skill opencli-adapter-author
bunx skills add jackwener/opencli --skill opencli-autofix
```

主要用途：

| Skill | 用途 |
|---|---|
| `opencli-browser` | 让 Agent 驱动真实浏览器 |
| `opencli-usage` | OpenCLI 命令发现 |
| `opencli-adapter-author` | 把探索过的网站流程写成 adapter |
| `opencli-autofix` | adapter 因网站改版失效后辅助修复 |

不要因为有很多 skill 就全部长期注入上下文。按需安装、progressive disclosure 更适合 Coding Agent。

---

## 9. Electron / Desktop App 能力

OpenCLI 不只操作网页。

上游目前还提供一批 Electron Desktop adapters，例如：

```text
Cursor
Codex
Antigravity
ChatGPT App
ChatWise
Qoder
Discord
Doubao
Trae / Trae SOLO
...
```

其底层通常通过 CDP 与 Electron app 交互。

因此 OpenCLI 可以形成：

```text
Agent A
  ↓
OpenCLI
  ↓
Agent / IDE App B
```

这类能力适合：

- 自动读取另一个 Agent 的输出
- 发送 prompt
- 获取 history / diff
- 在多个桌面 Agent 工具间做轻量协调

具体能力以：

```bash
opencli list
opencli <adapter> --help
```

为准，不要假设所有 Electron App 在所有操作系统上都具有完全相同的支持。

---

## 10. 与 Agent Reach 的关系

OpenCLI 与 [Agent Reach](/knowledge/sharing/Awesome-Ai/Plugins/agent-reach) 不是替代关系。

更合理的职责划分：

```text
                 Agent
                   │
           Agent Reach Skill
                   │
       ┌───────────┼───────────┐
       ▼           ▼           ▼
   Native CLI     API       OpenCLI
    gh / yt-dlp   Exa       Browser
    bili-cli      RSS       logged-in sites
```

Agent Reach 负责：

- 工具选型
- backend routing
- health check
- fallback knowledge

OpenCLI 负责：

- 登录态网站
- deterministic adapters
- 通用 browser control
- Electron app control

因此：

> 已经安装 Agent Reach，不代表不需要 OpenCLI；已经安装 OpenCLI，也不代表所有互联网任务都应该走浏览器。

---

## 11. 安全模型与风险控制

OpenCLI 的能力很强，因此安全边界比普通网页 reader 更重要。

### 11.1 Browser Extension 权限

当前扩展声明包括：

```text
debugger
tabs
cookies
activeTab
alarms
storage
tabGroups
downloads
<all_urls>
```

官方 Privacy Policy 说明：

- 不做 analytics / telemetry
- Browser Bridge 与本机 daemon 通信
- daemon 默认使用 localhost
- cookie 按目标域读取
- 扩展本身不把 cookie 上传到第三方

但是：

> “OpenCLI 自己不上传数据”不等于“给 Agent 浏览器控制权没有风险”。

真正需要考虑的是 **capability risk**：

```text
Untrusted Web Content
        ↓
      Agent
        ↓
     OpenCLI
        ↓
Authenticated Browser
```

如果 Agent 被 prompt injection 误导，可能把一个原本只影响回答的问题升级成实际账号操作。

### 11.2 我的默认安全策略

推荐：

```text
独立 Agent Chrome Profile
+
read-first
+
高风险写操作人工确认
+
localhost only
+
第三方 plugin 不自动安装
```

具体包括：

1. Agent Profile 不登录银行、券商、支付、密码管理器等敏感服务
2. Twitter / Reddit / 小红书优先使用次要账号
3. `post / delete / comment / follow / publish` 等动作不要默认自动执行
4. 不主动把 OpenCLI daemon 端口反向代理到 LAN / WireGuard / 公网
5. 第三方 OpenCLI plugin 先审查代码，再安装
6. 不进行高频批量采集，尊重目标平台限流和风控

---

## 12. 平台风控

OpenCLI 使用真实登录态并不代表平台会认为所有自动化行为都是正常人工行为。

高风险模式：

```text
大量 search
+
快速翻页
+
深翻 comments
+
高频 follow / like / post
```

尤其：

- 小红书
- Twitter/X
- LinkedIn
- Instagram
- 招聘平台

都应该降低频率。

小红书这类平台更适合作为：

```text
人工账号
+
低频只读 Agent
```

而不是无人值守 crawler。

---

## 13. OpenCLI 是否常驻

CLI 本身不需要持续占用大量资源。

Browser Bridge 的本地 daemon 会在需要时自动启动；真正占资源较多的通常还是 Chrome / Electron App 本身。

如果采用 CLI-only：

```text
Bun global OpenCLI
+
Browser Extension
```

不需要为了打游戏或普通使用电脑专门“关闭 OpenCLI Desktop 面板”，因为本来就没有 Desktop App 常驻 UI。

---

## 14. 当前推荐配置

我的 Windows 配置：

```text
Bun
└── @jackwener/opencli

Chrome Agent Profile
└── OpenCLI Browser Bridge

Agent Reach
└── 将 OpenCLI 作为登录态 / browser backend
```

安装：

```powershell
bun add -g --trust @jackwener/opencli
```

验证：

```powershell
opencli --version
opencli list
opencli doctor
```

如果未来需要 GUI 管理，再迁移到 OpenCLIApp；目前不同时维护两个 runtime。

整体原则：

> **优先使用结构化 API / native CLI；需要真实登录态和浏览器交互时再进入 OpenCLI。**

这样 OpenCLI 是能力补全层，而不是把所有网络任务重新变回 Browser Agent。

---

## 15. 参考链接

- [OpenCLI GitHub](https://github.com/jackwener/OpenCLI)
- [Installation](https://github.com/jackwener/OpenCLI/blob/main/docs/guide/installation.md)
- [Browser Bridge](https://github.com/jackwener/OpenCLI/blob/main/docs/guide/browser-bridge.md)
- [Browser Extension Privacy Policy](https://github.com/jackwener/OpenCLI/blob/main/PRIVACY.md)
- [Adapters](https://github.com/jackwener/OpenCLI/blob/main/docs/adapters/index.md)
- [Agent Reach](/knowledge/sharing/Awesome-Ai/Plugins/agent-reach)
