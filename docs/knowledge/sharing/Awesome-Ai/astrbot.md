---
title: AstrBot
date: 2026-05-12
order: 7
---

# AstrBot 使用指南

## 1. AstrBot 是什么

[Github Repo](https://github.com/AstrBotDevs/AstrBot)

AstrBot 是开源的一体化 Agentic chatbot infrastructure。它的核心功能是把 Agent 接入 QQ、Telegram、飞书、钉钉、Slack、Discord、企业微信、微信公众号等 IM 平台，并在 WebUI 中统一管理模型、插件、知识库、MCP、Skills、人格设定、上下文压缩和沙盒执行。

官方文档：

* https://astrbot.app/
* https://docs.astrbot.app/
* https://docs.astrbot.app/deploy/astrbot/docker.html
* https://docs.astrbot.app/use/astrbot-agent-sandbox.html

> 截至 **2026-05-12**，官方 README 将 AstrBot 定位为面向个人、开发者和团队的 conversational AI infrastructure；最新 GitHub release 为 **v4.24.2（2026-05-03）**。v4.24.x 的重点包括 Plugin Pages、插件国际化、插件提供 Skills、WebUI 中编辑 Skills、CUA Computer Use 沙盒、后台 Shell、Provider 配置优化和若干安全修复。

---

## 2. 安装与更新

### 2.1 `uv` 一键部署

适合本地试用：

```bash
uv tool install astrbot --python 3.12
astrbot init
astrbot run
```

更新：

```bash
uv tool upgrade astrbot --python 3.12
```

注意：

* AstrBot 要求 Python 3.12+
* `uv` 部署不支持通过 WebUI 升级
* macOS 首次运行可能因系统安全检查慢 `10-20s`

### 2.2 Docker

Docker Compose 部署：

* [AstrBot Docker Compose 1Panel版](/knowledge/sharing/docker/compose/astrbot)

该模板包含三部分：

* AstrBot 主服务
* NapCat / OneBot：用于接入 QQ 个人号，可选
* Shipyard Neo：用于 Agent Sandbox，可选

官方文档：

* [Deploy AstrBot with Docker](https://docs.astrbot.app/deploy/astrbot/docker.html)

仓库根目录当前也直接提供：

* `Dockerfile`
* `compose.yml`
* `compose-with-shipyard.yml`

```bash
docker compose up -d
docker compose logs -f astrbot
```

官方镜像：

```text
soulter/astrbot:latest
```

默认 WebUI 端口：

```text
6185
```

### 2.3 其他部署方式

官方还提供桌面端、Launcher、AUR、宝塔、1Panel、CasaOS、RainYun、Replit、Kubernetes、手动源码部署。一般建议：

* 本地试用：`uv`
* 长期运行：Docker
* 桌面 ChatUI：AstrBot Desktop
* 面板用户：直接用 1Panel / 宝塔应用商店

---

## 3. 快速开始

最短路径：

```bash
uv tool install astrbot --python 3.12
astrbot init
astrbot run
```

Docker 路径：

```bash
docker compose up -d
docker compose logs -f astrbot
```

然后在 WebUI 中完成三件事：

1. 配置模型服务
2. 接入一个消息平台
3. 按需安装插件、知识库、MCP、Skills 或沙盒

如果只启动了 AstrBot 但没有接入平台，它只是一个可管理的 Agent 后端，还不能在 IM 里回复消息。

---

## 4. 常用命令

```bash
astrbot init
astrbot run
```

Docker 管理：

```bash
docker compose up -d
docker compose down
docker compose logs -f astrbot
docker compose pull
docker compose up -d
```

进入容器：

```bash
docker exec -it astrbot bash
```

查看 WebUI：

```text
http://127.0.0.1:6185
```

初始账号密码通常为：

```text
astrbot / astrbot
```

首次登录后立刻修改密码。

---

## 5. 配置与数据目录

Docker 内数据目录：

```text
/AstrBot/data
```

宿主机推荐挂载：

```text
./data:/AstrBot/data
```

这里会保存：

```text
config/       配置
plugins/      插件
data/         运行数据
temp/         临时文件
logs/         日志
```

规则：

* 定期备份 `data/`
* 不提交 API keys、平台 token、会话数据
* 不让多个 AstrBot 实例同时写同一个 `data/`
* 迁移服务器时，`data/` 比 compose 文件更重要

---

## 6. 模型与中转

AstrBot 支持 OpenAI-compatible、Anthropic、Gemini、Moonshot、智谱、DeepSeek、Ollama、LM Studio、硅基流动、PPIO、ModelScope、OneAPI、Dify、百炼、Coze 等。

常见顺序：

1. 在 WebUI 添加 Provider
2. 填写 API Key / Base URL / 模型名
3. 测试 Provider
4. 设置默认模型

OpenAI-compatible endpoint 常见检查：

```text
base_url = https://api.example.com/v1
model = provider暴露的真实模型名
```

Docker 访问宿主机 Ollama / LM Studio 时，优先使用：

```text
http://host.docker.internal:11434
http://host.docker.internal:1234
```

Linux Docker 下还需要在 compose 里加入 `host.docker.internal:host-gateway`。同时确保宿主机模型服务监听 `0.0.0.0`，不是只监听 `127.0.0.1`。

---

## 7. 消息平台

官方 README 当前列出的官方平台包括：

```text
QQ / OneBot v11 / Telegram / 企业微信 / Wecom AI Bot
微信公众号 / 飞书 / 钉钉 / Slack / Discord / LINE
Satori / KOOK / Misskey / Mattermost
```

社区平台包括：

```text
Matrix / Rocket.Chat / VoceChat
```

流程基本一致：

1. 在目标平台创建 bot / app
2. 在 WebUI 添加平台适配器
3. 填写 token、secret、回调地址或 websocket 配置
4. 保存并重启 / 热加载
5. 通过日志确认连接成功

飞书、钉钉、企业微信、Telegram 更适合正式机器人场景；QQ 个人号通常走 NapCat / OneBot v11。

### 7.1 NapCat / OneBot

NapCat 是常见的 QQ 个人号接入方案，通常通过 OneBot v11 WebSocket 和 AstrBot 通信。部署关系可以理解为：

```text
QQ 个人号
    ↓
NapCat
    ↓ OneBot v11
AstrBot
```

1Panel / Docker 部署时，建议让 `astrbot` 和 `napcat` 放在同一个 Docker network 中，再在 AstrBot WebUI 添加 OneBot v11 适配器。常见端口：

```text
6099  NapCat WebUI
6199  AstrBot OneBot v11 WebSocket
```

注意：

* NapCat 需要独立保存 QQ 登录态和配置
* 不要把 NapCat WebUI 无保护暴露到公网
* QQ 个人号方案有平台风控风险，生产业务更建议用官方机器人、企业微信、飞书、钉钉或 Telegram

---

## 8. 核心功能

### 8.1 WebUI / Web ChatUI

WebUI 用于管理 Provider、平台、插件、知识库、MCP、Skills、配置和日志；Web ChatUI 可以直接作为浏览器聊天入口，并集成 Agent Sandbox 和网页搜索。

### 8.2 插件

AstrBot 的插件生态很大，官方 README 当前写明有 `1000+` 插件可一键安装。v4.24.x 后插件能力继续增强：

* 插件可以暴露 Dashboard 页面
* 插件支持国际化
* 插件可以提供 Skills
* 插件详情页、短描述、置顶和官方插件存储下载能力增强

旧教程里某些“内置命令默认存在”的说法可能已经过时；部分低频命令已经迁移到插件，例如 `builtin_commands_extension`。

### 8.3 Skills / MCP / 知识库

AstrBot 支持：

* Skills：沉淀可复用能力和提示结构
* MCP：接入外部工具服务器
* 知识库：上传文档后做检索增强
* 自动上下文压缩：长会话中降低上下文溢出概率

使用顺序建议先配模型和平台，再逐步加知识库、MCP 和 Skills。

### 8.4 Agent Sandbox

AstrBot 从 `v4.12.0` 起引入 Agent 沙盒，用于替代旧代码执行器。当前驱动包括：

```text
Shipyard Neo   当前推荐
Shipyard       旧方案，兼容保留
CUA            Computer Use 运行时
```

Shipyard Neo 由 Bay、Ship、Gull 组成：

* Bay：控制面 API
* Ship：Python / Shell / 文件系统执行环境
* Gull：浏览器能力

部署关系：

```text
AstrBot
    ↓ Shipyard Neo API
Bay
    ↓ Docker socket
Ship / Gull sandbox containers
```

Shipyard Neo 的工作区根目录固定为 `/workspace`。在 AstrBot 的沙盒文件工具里应传相对路径，例如 `reports/result.txt`，不要传 `/workspace/reports/result.txt`。

WebUI 配置入口：

```text
AI 配置 -> Agent Computer Use
Computer Use Runtime = sandbox
沙箱环境驱动器 = Shipyard Neo / CUA
```

如果使用本文配套 compose，Shipyard Neo 的典型配置是：

```text
Shipyard Neo API Endpoint = http://astrbot-bay:8114
Shipyard Neo Access Token = Bay config.yaml 中的 security.api_key
Shipyard Neo Profile = python-default
```

资源建议：

* 仅 AstrBot：`1C1G` 可试用，长期建议 `2C2G+`
* AstrBot + Shipyard Neo：至少 `2C4G` 并开启 Swap
* 启用浏览器 / CUA：更适合资源充足的独立机器或 homelab

低配 VPS 不建议把 AstrBot、浏览器沙盒和多个 IM 适配器全塞在一起。

### 8.5 主动任务 / Cron

AstrBot 支持主动型 Agent 能力和 Cron 任务，可用于定时摘要、提醒、巡检、消息推送等。生产使用时应限制可主动发送的会话范围，避免普通用户借工具向任意 session 发消息。

---

## 9. Docker 文件访问与安全

AstrBot 容器只能访问容器内路径和显式挂载目录。要让它处理宿主机文件，需要挂载：

```yaml
volumes:
    - ./data:/AstrBot/data
    - /opt/projects:/workspace/projects
```

安全规则：

* 不挂载宿主机根目录
* 不把 secrets 目录交给 Agent
* WebUI 不直接公网裸奔
* 首次登录后修改默认密码
* 只开放必要端口
* 沙盒服务不要匿名访问
* 使用 Shipyard Neo 时，`security.api_key` 必须是强随机字符串
* Bay 需要 Docker socket，最好单独部署在更可信、更有资源的机器上

---

## 10. 排错

### 10.1 WebUI 打不开

确认容器运行：

```bash
docker compose logs -f astrbot
```

确认端口：

```text
6185
```

如果通过 1Panel 反代，目标应是：

```text
http://astrbot:6185
```

不要在 Docker 网络里把反代目标写成 `127.0.0.1:6185`。

### 10.2 平台收不到消息

检查：

* 平台 token / app secret 是否正确
* webhook 地址是否公网可达
* websocket 模式是否连上
* 平台事件订阅是否启用
* AstrBot 日志里是否有适配器报错

### 10.3 模型不可用

检查：

* Provider 是否启用
* API Key 是否有效
* Base URL 是否带 `/v1`
* 模型名是否真实存在
* 容器内是否能访问模型网关

### 10.4 沙盒不可用

检查：

* WebUI 中 `Computer Use Runtime` 是否设为 `sandbox`
* Shipyard Neo Endpoint 是否可访问
* Bay API Key 是否一致
* Docker socket 是否挂载给 Bay
* `config.yaml` 中 network 是否和 compose 网络一致
* 宿主机资源是否足够

---

## 11. 参考链接

```text
https://github.com/AstrBotDevs/AstrBot
https://github.com/AstrBotDevs/AstrBot/releases
https://astrbot.app/
https://docs.astrbot.app/
https://docs.astrbot.app/deploy/astrbot/docker.html
https://docs.astrbot.app/use/astrbot-agent-sandbox.html
https://github.com/AstrBotDevs/AstrBot-desktop
https://github.com/AstrBotDevs/builtin_commands_extension
```
