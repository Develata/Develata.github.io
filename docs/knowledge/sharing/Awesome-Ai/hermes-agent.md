---
title: Hermes Agent
date: 2026-05-11
order: 5
---

# Hermes Agent 使用指南

## 1. Hermes Agent 是什么

[Github Repo](https://github.com/NousResearch/hermes-agent)

Hermes Agent（命令 `hermes`）是长期运行型 personal agent，独特优势在于长期记忆、skills自我改进，其余功能类似openclaw，跨会话检索、cron 定时任务，多入口支持如：Telegram、飞书等。

官方文档：

* https://hermes-agent.nousresearch.com/
* https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/docker.md
* https://github.com/NousResearch/hermes-agent/blob/main/docker-compose.yml

> 截至 **2026-05-11**，官方 README 仍称它为 **“The agent that grows with you”**。它不像 Claude Code / OpenCode 那样主要面向本地项目 TUI，更适合常驻 VPS，通过 gateway 接入多个聊天渠道；模型来源支持 OpenRouter、OpenAI、自定义 endpoint 等。v0.12.0 起官方强调 Autonomous Curator：后台周期性整理、评分、剪枝、合并 skill library，并改进“哪些经验值得保存”的自我更新循环。

---

## 2. 安装与更新

### 2.1 Linux / macOS / WSL2 / Termux

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
source ~/.bashrc
```

### 2.2 Windows

```powershell
irm https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.ps1 | iex
```

补充：

* 原生 Windows 安装目录通常为 `%LOCALAPPDATA%\hermes`
* WSL2 安装目录通常为 `~/.hermes`
* 原生 Windows 仍偏 early beta；dashboard chat pane 依赖 POSIX PTY，稳定使用建议放在 WSL2 内

### 2.3 Docker

Docker Compose部署：

* [Hermes Agent Docker Compose 1panel版](/knowledge/sharing/docker/compose/hermes-agent)

```bash
docker compose run --rm hermes setup
docker compose up -d
```

`setup` 会把 `.env`、`config.yaml` 等配置写入 `/opt/data` 对应的宿主机目录。

### 2.4 更新

脚本安装：重新执行安装脚本。Docker 部署：

```bash
docker compose pull
docker compose up -d
```

---

## 3. 快速开始

### 3.1 本地 CLI

```bash
hermes setup
hermes model
hermes tools
hermes
```

### 3.2 Gateway 服务

```bash
hermes gateway run
```

官方 Docker 端口：

* `8642`：gateway API / health endpoint
* `9119`：dashboard；浏览器 Chat tab 需要 `HERMES_DASHBOARD_TUI=1`

健康检查：

```bash
curl http://127.0.0.1:8642/health
```

域名反代：

```text
dashboard: http://hermes-agent:9119
gateway:   http://hermes-agent:8642
```

## 4. 常用命令

```bash
hermes
hermes setup
hermes model
hermes tools
hermes config set
hermes gateway run
hermes update
hermes doctor
```

Docker 管理：

```bash
docker compose up -d
docker compose down
docker compose logs -f hermes
docker compose pull
```

容器内打开 Hermes CLI：

```bash
docker exec -it hermes-agent bash
/opt/hermes/.venv/bin/hermes
```

排查优先看日志：

```bash
docker compose logs -f hermes
```

---

## 5. 配置与数据目录

Docker 内数据目录：

```text
/opt/data
```

常见内容：

```text
.env          API keys and secrets
config.yaml   Hermes 配置
SOUL.md       Agent personality / identity
sessions/     会话历史
memories/     长期记忆
skills/       skills
cron/         定时任务
hooks/        事件 hooks
logs/         日志
skins/        CLI 皮肤
```

规则：

* 定期备份 `data/`
* 不提交 `.env`、API keys、sessions、memories
* 不让多个 gateway 同时写同一个 data 目录
* 迁移服务器时，`data/` 比 compose 文件更重要

---

## 6. 模型与中转

常见环境变量：

```text
OPENROUTER_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
GEMINI_API_KEY=
DEEPSEEK_API_KEY=
```

OpenAI-compatible endpoint（vLLM / LiteLLM / xinference）检查：

* `base_url` 形如 `http://vllm:8000/v1`，不要带结尾斜杠
* Hermes 容器内能访问模型服务
* 模型服务监听 `0.0.0.0`，不是只监听 `127.0.0.1`

```bash
docker exec hermes-agent curl -s http://vllm:8000/v1/models
```

---

## 7. 聊天渠道

Gateway 启动后，CLI 和聊天平台共享很多 slash command：

```text
/new
/reset
/model
/personality
/retry
/undo
/compress
/usage
/skills
/stop
```

Telegram 最小配置：

```text
TELEGRAM_BOT_TOKEN=你的bot token
TELEGRAM_ALLOWED_USERS=你的telegram user id
```

流程：

1. BotFather 创建 bot。
2. `.env` 写入 token 和 allowed users。
3. `setup` / 配置流程启用 Telegram channel。
4. 重启并看日志。

```bash
docker compose restart hermes
docker compose logs -f hermes
```

先只允许自己的 Telegram user id，不要一开始放开群聊。

### 7.1 飞书 / Lark

官方 Feishu/Lark 适配支持私聊、群聊、cron 结果投递、文本、图片、音频、文件附件。推荐 `websocket` 模式：Hermes 主动连飞书，不需要公网 webhook。

最短流程：

```bash
hermes gateway setup
```

选择 Feishu / Lark 后扫码创建，或手动填写 App ID / App Secret。

手动 `.env` 最小项：

```text
FEISHU_APP_ID=cli_xxx
FEISHU_APP_SECRET=secret_xxx
FEISHU_DOMAIN=feishu
FEISHU_CONNECTION_MODE=websocket
FEISHU_ALLOWED_USERS=ou_xxx,ou_yyy
FEISHU_HOME_CHANNEL=oc_xxx
```

说明：

* `FEISHU_DOMAIN=feishu` 用国内飞书，`lark` 用国际版
* 私聊默认每条消息都响应
* 群聊默认需要 @bot
* `FEISHU_HOME_CHANNEL` 接收 cron 结果和跨平台通知
* 生产环境务必设置 `FEISHU_ALLOWED_USERS`

---

## 8. 核心功能

### 8.1 Tools

```bash
hermes tools
```

配置启用哪些工具。官方 README 提到 Hermes 有 toolset system 和 40+ tools；按场景逐步开启，不建议一开始全放开。

### 8.2 Skills

Hermes 会在使用中创建和改进 skills，也兼容 agentskills.io 开放标准。常用入口：

```text
/skills
/<skill-name>
```

自我更新的关键在 skills：Hermes 会把可复用流程沉淀为 procedural memory；Autonomous Curator 按 gateway 的 cron ticker 后台运行，默认 7 天周期，负责合并重复技能、剪掉低价值技能、保留高价值经验。

### 8.3 Memory

长期记忆、用户画像和跨会话信息主要在：

```text
data/memories/
data/sessions/
```

### 8.4 Cron

内置 cron scheduler，可把日报、备份、审计、项目跟踪等任务投递到配置好的聊天平台。数据目录：

```text
cron/
```

---

## 9. Docker 文件访问与安全

Hermes 容器只能访问容器内文件和显式挂载目录。要管理宿主机项目，在 compose 里加 `volumes`：

```yaml
volumes:
    - ./data:/opt/data
    - /opt/projects:/workspace/projects
```

在 Hermes 中使用容器内路径：

```text
/workspace/projects
```

安全规则：

* 不挂载宿主机根目录
* 只挂载需要管理的目录
* secrets 目录不要默认交给 agent
* dashboard 域名加访问密码或 IP 白名单
* `API_SERVER_KEY` 使用强随机字符串
* 不直接暴露 `9119` / `8642`
* 不覆盖官方镜像 entrypoint；官方要求保留 `/opt/hermes/docker/entrypoint.sh`，否则可能生成 root-owned 状态文件


## 10. 排错

### 10.1 dashboard 访问不了

确认：

```text
HERMES_DASHBOARD=1
HERMES_DASHBOARD_HOST=0.0.0.0
HERMES_DASHBOARD_PORT=9119
```

Chat tab 不可用再确认：

```text
HERMES_DASHBOARD_TUI=1
```

### 10.2 API 无法访问

确认：

```text
API_SERVER_ENABLED=true
API_SERVER_HOST=0.0.0.0
API_SERVER_KEY=至少8位强随机字符串
```

测试：

```bash
curl http://127.0.0.1:8642/health
```

### 10.3 data 权限问题

查宿主机用户：

```bash
id -u
id -g
```

然后修改：

```text
HERMES_UID=
HERMES_GID=
```

官方 Docker 文档说明容器入口会切换到非 root 的 `hermes` 用户，默认 UID 为 `10000`。挂载目录不可写时，通常就是这里不匹配。

### 10.4 浏览器工具异常

如果 Playwright / 浏览器工具异常，给容器加：

```yaml
shm_size: 1g
```
