---
title: Cockpit Tools
date: 2026-04-13
order: 6
---

# Cockpit Tools 使用指南

## 1. Cockpit Tools 是什么
[Github Repo](https://github.com/jlcodes99/cockpit-tools)

Cockpit Tools 是一个**通用 AI IDE 账号管理工具**。它不是新的 AI IDE，也不是新的 CLI，而是一个桌面侧“账号中控台”：

* 管理多平台 AI IDE 账号
* 查看配额/重置时间
* 一键切换当前活跃账号
* 支持部分平台多开实例并行工作
* 提供本地 WebSocket / 插件集成能力

> 截至 **2026-04-13**，我已用 `gh api repos/jlcodes99/cockpit-tools/releases/latest` 直接核对：最新 GitHub release 为 **v0.21.2（2026-04-13）**。

仓库当前 README 显示，已经不再只是早期的 Antigravity / Codex 工具，而是扩展为支持：

* Antigravity
* Codex
* GitHub Copilot
* Windsurf
* Kiro
* Cursor
* Gemini Cli
* CodeBuddy
* CodeBuddy CN
* Qoder
* Trae
* Zed

补充：

* 它本身并不直接“管理 OpenCode 账号”
* 但 README 中已经出现 **OpenCode App Path** 与 **Codex 切号后自动重启 OpenCode** 的联动设置，说明它开始兼顾 OpenCode 生态的实际配套需求

---

## 2. 安装与更新

> 当前 README 明确把 **手动下载 Releases 包** 作为推荐安装方式；Homebrew 主要是 macOS 方案，Arch Linux 额外提供 AUR。

### 2.1 手动下载（推荐）

前往：

* [GitHub Releases](https://github.com/jlcodes99/cockpit-tools/releases)

常见安装包：

* macOS：`.dmg`（Apple Silicon / Intel）
* Windows：`.msi`（推荐）或 `.exe`
* Linux：`.deb`、`.rpm` 或 `.AppImage`

### 2.2 macOS（Homebrew）

```bash
brew tap jlcodes99/cockpit-tools https://github.com/jlcodes99/cockpit-tools
brew install --cask cockpit-tools
```

如果遇到 macOS “App is damaged”：

```bash
brew install --cask --no-quarantine cockpit-tools
```

如果提示应用已存在：

```bash
rm -rf "/Applications/Cockpit Tools.app"
brew install --cask cockpit-tools
```

或者直接强制覆盖：

```bash
brew install --cask --force cockpit-tools
```

### 2.3 Arch Linux（AUR）

```bash
# 源码构建包
yay -S cockpit-tools

# 预编译二进制包
yay -S cockpit-tools-bin
```

> 仓库 README 当前写的是 `yay` 示例，但按 AUR 习惯，`paru` 同样可用。

### 2.4 macOS 打不开（额外修复）

```bash
sudo xattr -rd com.apple.quarantine "/Applications/Cockpit Tools.app"
```

---

## 3. 快速上手

### 3.1 第一次启动后先做什么

建议顺序：

1. 打开 Cockpit Tools
2. 先进入 Settings
3. 检查各平台的可执行路径是否自动识别成功
4. 再添加/导入账号
5. 最后按平台启用自动刷新或 WebSocket 集成

### 3.2 核心使用流

以 Codex / Antigravity / Copilot 这类平台为例，Cockpit Tools 的典型用法是：

1. 导入账号（OAuth / Token / JSON / 本地状态导入，具体取决于平台）
2. 查看当前账号配额与 reset time
3. 在账号列表里切换活跃账号
4. 如有需要，直接启动对应平台客户端
5. 如果你有多项目并行需求，再启用多实例

### 3.3 Dashboard（总览页）

当前 README 里 Dashboard 的定位很明确：

* 多平台账号状态总览
* 配额与重置时间可视化
* 一键刷新
* 一键唤醒
* 统一进度条视图

如果你手里账号很多，Cockpit Tools 的价值主要就在这里：  
把原本分散在多个 IDE / CLI / 浏览器页里的“账号状态”收拢到一个桌面面板里。

---

## 4. 核心能力

## 4.1 多账号切换

这是最核心的能力。

不同平台支持的导入方式略有不同，但总体上都围绕：

* OAuth
* Token / JSON 导入
* 本地登录态导入

你不再需要手工反复替换本地配置文件，而是直接在桌面面板切号。

## 4.2 配额监控

仓库 README 当前强调的不是“只有账号切换”，而是：

* 配额剩余量
* reset time
* plan 类型识别
* 某些平台的额外 credit / budget / cycle 信息

这对多账号调度很关键，因为切号不是目的，**配额可见性**才是切号决策的依据。

## 4.3 多实例并行

当前 README 已明确支持多实例的平台包括：

* Antigravity
* Codex
* GitHub Copilot（VS Code 侧）
* Windsurf
* Kiro
* Cursor
* CodeBuddy
* CodeBuddy CN
* Qoder
* Trae

共同特征：

* 每个实例可绑定不同账号
* 实例目录/用户数据目录隔离
* 可独立启动/停止/强制停止
* 适合同时跑多个项目

这类设计的底层逻辑很简单：  
不是“让一个 IDE 支持多账号同时在线”，而是通过**实例隔离**把账号和项目运行时分开。

## 4.4 唤醒任务（Wake-up Tasks）

目前 README 里对 Antigravity 的支持最深，包括：

* 唤醒任务
* 配额重置周期预热
* 设备指纹管理
* 多实例

如果你主要是 Antigravity 用户，这块会是 Cockpit Tools 的重点价值区。

## 4.5 本地 WebSocket / 插件集成

README 明确提到：

* WebSocket 默认绑定 `127.0.0.1`
* 默认端口 `19528`
* 可在 Settings 中关闭或改端口

这意味着 Cockpit Tools 不只是一个“手动点按钮”的桌面应用，也可以作为本地 companion service 被插件或扩展读取状态。

---

## 5. 配置与数据（你要知道它改了哪里）

## 5.1 本地数据存储

README 当前写得比较直接：

* `~/.antigravity_cockpit`：Antigravity 账号、配置、WebSocket 状态等
* `~/.codex`：Codex 官方当前登录态（如 `auth.json`）
* `~/.gemini`：Gemini Cli 本地 session 文件
* 本地应用数据目录 `com.antigravity.cockpit-tools`：多平台索引数据等

这说明它不是“纯展示工具”，而是**真实会写本地状态**的账号管理器。

## 5.2 常见设置项

README 的设置说明里，当前最值得记住的几类：

* 显示语言 / 主题
* 关闭窗口行为
* 各平台自动刷新间隔
* 数据目录
* 各平台 App Path
* WebSocket 开关与端口
* OpenCode App Path
* Codex 切号后自动重启 OpenCode

补充：`v0.21.2` 新增了**本地备份/导入包**与**备份管理器**，也就是现在可以在设置页里做“仅账号 / 仅配置 / 两者一起”的备份与恢复。

### 5.3 建议的默认策略

如果你只是想稳定用，不想折腾：

* 自动刷新：`5-10` 分钟
* WebSocket：不用插件就关闭
* App Path：优先让它自动识别
* 多实例：有明确并行项目需求再开

---

## 6. 安全与风险

Cockpit Tools 当前 README 的安全表述核心是：

* 这是本地桌面工具，不是云端托管服务
* 主要数据保存在你的机器上
* 开网络主要发生在 OAuth、刷新 token、拉取配额、检查更新等场景

实战建议：

* 不需要插件联动时，关闭 WebSocket
* 不要直接分享完整用户目录
* 备份时先处理 token / auth 文件
* 在公用电脑上使用后及时移除账号并退出

---

## 7. FAQ（常见问题）

### 7.1 这和 CC Switch 的区别是什么？

两者都属于“多工具账号/配置管理”方向，但 Cockpit Tools 当前更偏：

* 桌面总控台
* 配额可视化
* 多实例并行
* 对 Antigravity / Codex / Copilot / Windsurf / Kiro / Cursor 等平台的账号管理

如果你的核心诉求是“多账号调度 + 配额总览 + 平台多开”，Cockpit Tools 更贴近这个方向。

### 7.2 它支持 OpenCode 吗？

严格说，当前 README 里它的主支持对象不是 OpenCode 账号本身。  
但已经能看到：

* `OpenCode App Path`
* `Auto-restart OpenCode on Codex switch`

所以更准确的说法是：**它主要管理 Codex 等账号，但已经开始兼容 OpenCode 联动场景。**

### 7.3 WebSocket 要不要开？

如果你不用本地插件集成，建议默认关闭。  
理由很简单：减少常驻暴露面，也减少无意义的后台占用。

### 7.4 多实例适合什么场景？

适合：

* 多个项目并行
* 多账号隔离运行
* 测试不同环境/不同额度账号

不适合：

* 只偶尔切一次账号
* 不需要同时开多个 IDE / CLI

---

## 8. 参考链接

```text
https://github.com/jlcodes99/cockpit-tools
https://github.com/jlcodes99/cockpit-tools/releases
https://github.com/jlcodes99/cockpit-tools#readme
```
