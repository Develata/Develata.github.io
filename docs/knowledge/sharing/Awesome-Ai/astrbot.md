---
title: AstrBot
date: 2026-04-13
order: 7
---

# AstrBot 使用指南

## 1. AstrBot 是什么
[Github Repo](https://github.com/AstrBotDevs/AstrBot)

AstrBot 是一个**开源的一体化 Agent 聊天机器人平台**。它的定位不是单一聊天前端，而是“基于即时通讯平台的 AI Agent 基础设施”：

* 接入主流 IM 平台
* 连接多种 LLM / STT / TTS / Agent 平台
* 提供插件系统、知识库、人格设定、MCP、Skills
* 带 WebUI / Web ChatUI
* 支持 Agent Sandbox，用于隔离执行代码、shell 调用与会话级资源复用

> 截至 **2026-04-13**，已用 `gh api repos/AstrBotDevs/AstrBot/releases/latest` 直接核对：最新 GitHub release 为 **v4.23.0（2026-04-12）**。

仓库当前简介里还明确把它描述成：

* 面向个人、开发者和团队的 conversational AI infrastructure
* 可用于个人 AI 伙伴、客服机器人、自动化助手、企业知识库等场景
* 可以视作某些 IM Agent 场景下的 **OpenClaw alternative**

---

## 2. 安装与部署

> AstrBot 当前最推荐的不是“手动源码启动”，而是按场景选择合适部署方式：`uv` 一键部署、Docker、桌面端、Launcher、AUR、面板部署等。

### 2.1 `uv` 一键部署（推荐）

适合：

* 想快速体验
* 能接受命令行
* 本机可安装 `uv`

```bash
uv tool install astrbot
astrbot init
astrbot run
```

更新：

```bash
uv tool upgrade astrbot
```

注意：

* 需要先安装 [uv](https://docs.astral.sh/uv/)
* 用 `uv` 部署的 AstrBot **不支持通过 WebUI 升级**
* macOS 首次运行 `astrbot` 可能因系统安全检查而更慢（README 提示约 `10-20s`）

### 2.2 Docker / Docker Compose

适合：

* 生产环境
* 希望部署更稳定
* 已有容器经验

官方文档：

* [Deploy AstrBot with Docker](https://astrbot.app/deploy/astrbot/docker.html#%E4%BD%BF%E7%94%A8-docker-%E9%83%A8%E7%BD%B2-astrbot)

仓库根目录当前也直接提供：

* `Dockerfile`
* `compose.yml`
* `compose-with-shipyard.yml`

### 2.3 桌面端部署

如果你主要想在桌面环境里使用 ChatUI，官方更推荐：

* [AstrBot-desktop](https://github.com/AstrBotDevs/AstrBot-desktop)

这个方向更偏“桌面使用体验”，不适合作为服务端部署方案。

### 2.4 Launcher 部署

如果你是桌面用户，同时还想要：

* 更快部署
* 隔离多实例

可以考虑：

* [AstrBot Launcher](https://github.com/Raven95676/astrbot-launcher)

### 2.5 AUR（Arch Linux）

```bash
yay -S astrbot-git
```

### 2.6 其他部署方式

README 当前还列出：

* RainYun 一键云部署
* Replit 部署
* BT Panel 部署
* 1Panel 部署
* CasaOS 部署
* Manual Deployment（手动源码部署）

如果你是 NAS / 面板 / 家庭服务器用户，这些入口会比自己从头配环境更省时间。

---

## 3. 快速开始

### 3.1 最短体验路径

如果你只是想先跑起来：

```bash
uv tool install astrbot
astrbot init
astrbot run
```

然后：

1. 打开 WebUI
2. 配置模型服务
3. 接入一个 IM 平台
4. 安装需要的插件

### 3.2 你真正需要先配置的三件事

对多数人来说，AstrBot 的落地顺序应该是：

1. **模型服务**  
   例如 OpenAI Compatible / Anthropic / Gemini / DeepSeek / Ollama

2. **平台适配器**  
   例如 QQ、Telegram、Discord、Slack、飞书、钉钉

3. **插件 / Agent 能力**  
   根据场景再加知识库、MCP、工具调用、人格设定等

也就是说，AstrBot 的本体更像是一个“可编排底座”，不是装完就自动有完整业务能力。

---

## 4. 核心能力

## 4.1 多平台 IM 接入

这是 AstrBot 和很多“单模型聊天壳”最不一样的地方。

当前 README 列出的官方支持平台包括：

* QQ
* OneBot v11
* Telegram
* 企业微信 / Wecom AI Bot
* 微信公众号
* 飞书（Lark）
* 钉钉
* Slack
* Discord
* LINE
* Satori
* Misskey
* Mattermost

另外还有社区适配器：

* Matrix
* KOOK
* VoceChat

这意味着 AstrBot 的思路不是“做一个新的聊天窗口”，而是把 Agent 部署到你已经在用的沟通渠道里。

## 4.2 多模型 / 多能力服务接入

AstrBot 当前支持的模型与相关服务非常广：

* OpenAI 及兼容服务
* Anthropic
* Google Gemini
* Moonshot AI
* 智谱 AI
* DeepSeek
* Ollama / LM Studio
* Dify / Bailian / Coze
* OpenAI Whisper / SenseVoice 等 STT
* OpenAI TTS / Gemini TTS / Edge TTS 等 TTS

这说明 AstrBot 不是绑死某一个 Provider 的产品，而是一个**多模型接入层 + IM 交互层**。

## 4.3 插件系统

README 当前强调：

* 1000+ 插件可一键安装

这部分是 AstrBot 的核心扩展能力之一。  
实际使用时，你通常不会只用“裸 AstrBot”，而是围绕插件去拼出：

* 命令扩展
* 工具调用
* 平台增强
* 知识库
* 角色玩法

## 4.4 Agent Sandbox

仓库 README 当前明确写到：

* AstrBot 提供 Agent Sandbox
* 用于隔离、安全执行代码与 shell 调用
* 支持 session 级资源复用

如果你要把它用于较强的 Agent 执行场景，这个能力很关键，因为它决定了“工具调用”不是纯文本模拟，而是有真正的执行隔离层。

## 4.5 WebUI / ChatUI

AstrBot 不是只有 Bot 后端：

* 有 WebUI
* 有 Web ChatUI
* ChatUI 内置 Agent Sandbox 与网页搜索能力

所以它既能做“接入 IM 平台的后端 Agent”，也能在浏览器侧提供直接可用的交互界面。

---

## 5. 平台与模型支持（速查）

### 5.1 适合什么人

AstrBot 更适合：

* 想把 Agent 接入 IM 平台的人
* 想做多平台聊天机器人 / 私人助手 / 自动化助手
* 想用插件和模型服务拼装复杂能力的人
* 想在团队或业务环境中部署“可长期运行”的机器人基础设施的人

### 5.2 不太适合什么人

如果你只想要：

* 一个轻量命令行 coding agent
* 一个本地单人聊天壳
* 不需要 IM 平台适配

那 AstrBot 可能会显得比你需要的更重。

它的强项在于：

* 平台接入
* 能力编排
* 插件生态
* 长期运行与扩展

而不是“极简单机聊天”。

---

## 6. 最近版本变化（按当前 release 理解）

最新的 `v4.23.0` 里，比较值得记住的变化有：

* 新增本地 Computer Use 文件系统工具：`read` / `write` / `edit` / `Grep`
* 新增 Brave Search 网页搜索工具
* 新增 Mattermost 平台适配器
* 新增 OpenAI / Gemini 音频输入支持
* 合并 Cron 工具并增强 Cron 任务编辑
* 大量优化 ChatUI、MCP 配置校验、内置工具管理
* 把很多低频内置命令迁移到独立插件 [builtin-command-extension](https://github.com/AstrBotDevs/builtin_commands_extension)

这说明 AstrBot 当前仍在非常活跃地迭代，而且重点不只是“接更多模型”，还包括：

* 工具调用链路
* MCP
* UI
* 适配器
* 插件拆分

---

## 7. FAQ（常见问题）

### 7.1 AstrBot 和 OpenCode / Codex / Claude Code 是一类东西吗？

不是。

* OpenCode / Codex / Claude Code 更偏**终端 coding agent**
* AstrBot 更偏**IM 平台上的 Agent 基础设施**

它们的定位不冲突，很多场景甚至可以互补。

### 7.2 AstrBot 和普通“聊天机器人框架”有什么区别？

AstrBot 当前已经不只是“收消息 -> 调模型 -> 回消息”的传统机器人框架，而是把这些都做成了更完整的能力层：

* 多平台适配
* 多模型接入
* 插件生态
* Agent Sandbox
* 知识库 / Persona / MCP / Skills

所以更准确的理解是：  
它是一个**面向 Agent 场景的聊天机器人基础设施平台**。

### 7.3 新手该选哪种部署方式？

最简单的建议：

* 本地试用：`uv`
* 稳定运行：Docker
* 纯桌面体验：AstrBot-desktop
* 需要桌面多实例：AstrBot Launcher

### 7.4 它支持私有模型吗？

支持。

README 当前明确列了：

* Ollama
* LM Studio
* 各类 OpenAI Compatible 网关

所以本地模型、自建网关、第三方聚合 API 都是可行方向。

---

## 8. 参考链接

```text
https://github.com/AstrBotDevs/AstrBot
https://github.com/AstrBotDevs/AstrBot/releases
https://astrbot.app/
https://astrbot.app/deploy/astrbot/docker.html
https://github.com/AstrBotDevs/AstrBot-desktop
https://github.com/Raven95676/astrbot-launcher
```
