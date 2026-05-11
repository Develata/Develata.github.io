---
title: OpenClaw
date: 2026-05-11
order: 1
---

# OpenClaw 使用指南

## 1. OpenClaw 是什么

[Github Repo](https://github.com/openclaw/openclaw)

OpenClaw（命令 `openclaw`）是 self-hosted personal AI assistant：一个常驻 Gateway 连接 WhatsApp、Telegram、Slack、Discord、飞书 / Lark、Signal、iMessage、Matrix、Teams、WebChat 等渠道，再把消息交给 agent、tools、skills、memory、cron 处理。

官方文档：

* https://docs.openclaw.ai
* https://docs.openclaw.ai/start/getting-started
* https://docs.openclaw.ai/install/docker
* https://docs.openclaw.ai/channels/feishu

> 截至 **2026-05-11**，官方 README 仍把 OpenClaw 定位为 **Personal AI Assistant**，并强调 Gateway 只是 control plane，产品本体是 assistant。当前推荐运行时是 **Node 24**，最低 **Node 22.16+**；Windows 建议通过 WSL2 使用。最新 GitHub release 已到 **v2026.5.6（2026-05-06）**，旧文中的 `v2026.4.12` 已过时。

### 1.1 推荐配置

`>= 2 核 2G`（建议开 SWAP），最好 `>= 2 核 4G`。

若服务器性能不足，可考虑基于 Rust 的轻量替代方案 [zeroclaw](https://github.com/zeroclaw-labs/zeroclaw)。


## 2. 安装与更新

### 2.1 npm / pnpm

```bash
npm install -g openclaw@latest
# 或
pnpm add -g openclaw@latest
```

初始化：

```bash
openclaw onboard --install-daemon
```

`onboard` 会引导你配置 Gateway、模型、工作区、聊天渠道、skills 和后台服务。

### 2.2 onboard 关键选择

`openclaw onboard` 默认 quickstart：本地 Gateway、默认工作区、端口 `18789`、Token 认证、Tailscale 关闭。单机自用直接选默认；要远程访问、多设备、公开渠道，再走 advanced。

已有配置时：

* `Keep`：保留现有配置，只补缺项
* `Modify`：保留为主，逐步修改关键项
* `Reset`：重置配置；优先 `Config only`，不要一开始 full reset

非交互模式必须显式承认风险：

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --gateway-bind loopback \
  --gateway-port 18789 \
  --install-daemon \
  --daemon-runtime node
```

### 2.3 Docker

Docker Compose部署：

* [OpenClaw Docker Compose 1panel版](/knowledge/sharing/docker/compose/openclaw)

官方 Docker 流程推荐从仓库根目录执行：

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
./scripts/docker/setup.sh
```

这个脚本会自动 onboarding、生成 Gateway token、写入 `.env` 并启动 compose。手写 compose 时，也要先跑一次 onboarding / config 写入，否则 Gateway 可能因为缺少 `gateway.mode=local` 拒绝启动。

### 2.4 更新

```bash
openclaw update
openclaw doctor
```

Docker 部署：

```bash
docker compose pull
docker compose up -d
docker compose run --rm openclaw-cli doctor
```

---

## 3. 快速开始

本地最短路径：

```bash
openclaw onboard --install-daemon
openclaw agent --message "Ship checklist" --thinking high
openclaw status --deep
```

前台启动 Gateway：

```bash
openclaw gateway run
```

默认端口：

* `18789`：Gateway WebSocket、Control UI / WebChat、health endpoint
* `18790`：bridge port，官方 compose 默认也暴露

浏览器打开：

```text
http://127.0.0.1:18789/
```

Docker 健康检查：

```bash
curl http://127.0.0.1:18789/healthz
curl http://127.0.0.1:18789/readyz
```

---

## 4. 常用命令

```bash
openclaw onboard --install-daemon
openclaw configure
openclaw config get
openclaw agent --message "..."
openclaw gateway run
openclaw gateway restart
openclaw status --deep
openclaw logs --follow
openclaw doctor
openclaw health
openclaw gateway status
openclaw gateway probe
```

Docker 管理：

```bash
docker compose up -d
docker compose down
docker compose logs -f openclaw-gateway
docker compose run --rm openclaw-cli dashboard --no-open
```

渠道命令：

```bash
docker compose run --rm openclaw-cli channels login
docker compose run --rm openclaw-cli channels add
docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"
```

---

## 5. 配置与数据目录

默认配置：

```text
~/.openclaw/openclaw.json
~/.openclaw/.env
~/.openclaw/workspace/
```

`openclaw.json` 是 JSON5：支持注释和尾逗号，但 schema 校验严格。未知键、类型错误、非法值都会让 Gateway 拒绝启动。

Docker 内路径：

```text
/home/node/.openclaw
/home/node/.openclaw/workspace
```

常见内容：

```text
openclaw.json                 Gateway / agents / channels 配置
.env                          Gateway token 与模型服务 key
agents/*/agent/auth-profiles   provider OAuth / API-key auth
workspace/MEMORY.md            主记忆
workspace/memory/*.md          结构化记忆
workspace/sessions/            会话数据
workspace/cron/                定时任务运行记录
```

规则：

* 定期备份 `.openclaw/` 或 Docker 的 `config/`、`workspace/`
* 不提交 `.env`、auth profiles、sessions、memory
* Docker 中不要把宿主机路径写进容器运行时的 `OPENCLAW_CONFIG_DIR`
* 多 agent 用 `openclaw agents add work`，不要手动复制工作区混用

改配置的三种入口：

```bash
openclaw configure
openclaw configure --section models --section channels
openclaw config get
openclaw config set gateway.mode local
```

远程 / UI 场景可用 Gateway RPC：

```bash
openclaw gateway call config.get --params '{}'
openclaw gateway call config.patch --params '{"raw":"{ gateway: { mode: \"local\" } }","baseHash":"<hash>"}'
```

如果通过 systemd / launchd 常驻运行，模型 Key 要同时对服务进程可见。Linux user service 常见做法是把 key 放进环境文件，再重启 Gateway；CLI 侧也可放入 `~/.openclaw/.env`。

---

## 6. 模型与中转

常见认证方式：

* OpenAI / Codex OAuth
* OpenAI API key
* Anthropic API key
* OpenRouter API key
* 自定义 OpenAI-compatible / Anthropic-compatible endpoint

第三方 OpenAI-compatible 示例：

```json5
{
  models: {
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        auth: "api-key",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-responses",
        models: [
          { id: "kimi-k2.5", name: "Kimi K2.5" }
        ]
      }
    }
  },
  agents: {
    defaults: {
      model: {
        primary: "moonshot/kimi-k2.5",
        fallbacks: [
          "anthropic/claude-sonnet-4-5",
          "openai/gpt-5.2"
        ]
      }
    }
  }
}
```

Docker 里访问宿主机 Ollama / LM Studio：

```text
http://host.docker.internal:11434
http://host.docker.internal:1234
```

宿主机模型服务要监听 `0.0.0.0`，不是只监听 `127.0.0.1`。

---

## 7. 聊天渠道

官方 README 列出的渠道包括 WhatsApp、Telegram、Slack、Discord、Google Chat、Signal、iMessage、IRC、Teams、Matrix、飞书 / Lark、LINE、Mattermost、Nextcloud Talk、Nostr、Synology Chat、Twitch、Zalo、WeChat、QQ、WebChat 等。

安全默认：

* 私信默认 pairing：陌生人先收到配对码，批准后才处理消息
* 群聊默认建议 require mention
* 不要把 `dmPolicy` 改成 `open` 后再放开 `"*"`，除非你非常明确风险

批准配对：

```bash
openclaw pairing approve <channel> <code>
```

### 7.1 WhatsApp / Telegram

WhatsApp 扫码：

```bash
openclaw channels login
```

Telegram：

```bash
openclaw channels add --channel telegram --token "<bot-token>"
openclaw gateway restart
```

### 7.2 飞书 / Lark

官方 Feishu/Lark 渠道默认事件传输是 `websocket`，`webhook` 为可选模式。WebSocket 长连接不需要公网回调 URL，更适合个人服务器。

最短流程：

```bash
openclaw channels add
openclaw gateway restart
```

选择 Feishu 后填入 App ID / App Secret。飞书开放平台需要启用 Bot 能力、导入权限、事件订阅选择长连接，并添加 `im.message.receive_v1`。

手动配置结构：

```json5
{
  channels: {
    feishu: {
      enabled: true,
      domain: "feishu",
      dmPolicy: "pairing",
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      requireMention: true,
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "${FEISHU_APP_SECRET}",
          name: "My AI assistant"
        }
      }
    }
  }
}
```

说明：

* `domain: "feishu"` 用国内飞书，`"lark"` 用国际版
* group ID 通常形如 `oc_xxx`
* 私聊默认 pairing；allowlist 模式下用 open_id，通常形如 `ou_xxx`
* 支持文本、图片、文件、音频、视频 / media、交互卡片

---

## 8. 核心功能

### 8.1 Gateway

Gateway 是 OpenClaw 的常驻控制平面，负责 channels、nodes、sessions、hooks、tools 和 WebChat。默认要求配置中存在：

```json5
{
  gateway: {
    mode: "local"
  }
}
```

如果缺少该项，Gateway 会拒绝启动；临时调试可用 `--allow-unconfigured`，但不要把它当成生产配置。

绑定与认证：

* `loopback`：只允许本机访问，适合 SSH 隧道
* `tailnet`：通过 Tailscale 访问，优先于直接开 LAN
* `lan`：局域网访问，必须配 token / 反代认证 / 防火墙
* 非 loopback 绑定不要关闭认证

服务管理：

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway restart
openclaw gateway stop
openclaw gateway uninstall
```

Tailscale：

```json5
{
  gateway: {
    tailscale: {
      mode: "serve"
    }
  }
}
```

`serve` 只暴露到 tailnet；`funnel` 是公网入口，默认不建议。

### 8.2 Memory

OpenClaw 的记忆不是黑盒数据库，而是工作区内可编辑的 Markdown：

```text
MEMORY.md
memory/**/*.md
```

常用命令：

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory index --verbose
openclaw memory search "release checklist"
```

关键行为：

* 默认会索引 `MEMORY.md`、`memory/**/*.md`
* 可用 `memorySearch.extraPaths` 加入额外路径
* `memory_search` 返回片段、路径、行号和分数；完整上下文再用 `memory_get`
* direct chat 默认展示引用；group / channel 默认可能不展示 source 行号
* OAuth 不等于 embedding key；记忆检索需要单独可用的 embedding provider

provider 自动选择逻辑：先看本地模型，再看 OpenAI key，再看 Gemini key；都不可用则 memory search disabled。

OpenAI-compatible embedding 示例：

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "${OPENAI_COMPAT_API_KEY}"
        },
        sync: {
          watch: true
        }
      }
    }
  }
}
```

本地 embedding 示例：

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        fallback: "none",
        local: {
          modelPath: "hf:ggml-org/embeddinggemma-300M-GGUF/embeddinggemma-300M-Q8_0.gguf"
        }
      }
    }
  }
}
```

### 8.3 Multi-Agent

多身份、多工作区、多渠道路由时，核心是：

* `agents.defaults`：默认 agent 设置
* `agents.list[]`：多个 agent，每个可有独立 workspace、model、tools、sandbox
* `bindings`：把不同渠道、账号、会话路由到不同 agent

新增隔离 agent：

```bash
openclaw agents add work
```

新 agent 会有独立工作区、会话和认证配置；不要把多个身份直接混在一个 workspace。

### 8.4 Skills / Tools

OpenClaw 支持 bundled / managed / workspace skills。工具权限用 profile、allow、deny 控制：

```json5
{
  agents: {
    defaults: {
      tools: {
        profile: "messaging",
        deny: ["browser", "canvas"]
      }
    }
  }
}
```

暴露到群聊或多人渠道时，不要使用无边界的 `full` profile。

补充规则：

* `allow` / `deny` 是显式白名单 / 黑名单
* `alsoAllow` 用于在 profile 基础上增量放行
* 同一作用域不要同时写 `allow` 和 `alsoAllow`
* `whatsapp_login`、`cron`、`gateway` 等高危工具通常应只允许 owner 使用
* 开自动化前建议启用 `tools.loopDetection`，避免重复工具调用无进展

高危执行权限建议按触发者收紧：

```json5
{
  agents: {
    defaults: {
      tools: {
        elevated: {
          enabled: true,
          allowFrom: {
            telegram: ["123456789"]
          }
        }
      }
    }
  }
}
```

### 8.5 Sandbox

OpenClaw 支持把工具执行放进 Docker sandbox。Gateway 仍在主机 / 主容器，工具执行在隔离容器，适合开启执行类工具时降低影响面。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          network: "none",
          user: "1000:1000"
        }
      }
    }
  }
}
```

常用命令：

```bash
openclaw sandbox explain
openclaw sandbox list
openclaw sandbox recreate --all
```

安全护栏：

* Docker sandbox 禁止 `network: "host"`
* 禁止 `seccompProfile: "unconfined"` 和 `apparmorProfile: "unconfined"`
* `binds.source` 必须是绝对路径
* 镜像或 sandbox 配置更新后，建议 `sandbox recreate --all`

### 8.6 Cron / Hooks

Cron 适合日报、提醒、巡检、项目跟踪：

```bash
openclaw cron --help
```

常见行为：

* `cron add` 默认可用 `--announce` 投递摘要
* `--no-deliver` 只内部运行，不投递消息
* 一次性 `--at` 任务成功后默认删除；需要保留用 `--keep-after-run`

Hooks 适合事件驱动自动化：

```bash
openclaw hooks list --verbose
openclaw hooks enable session-memory
```

内置 hooks 可直接 enable / disable；插件 hooks 通常显示为 `plugin:<id>`，由插件启停控制。

### 8.7 远程访问

远程访问优先顺序：

1. Tailscale `serve`
2. SSH 隧道
3. 带认证的反向代理

SSH 隧道示例：

```text
Host openclaw-vps
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
```

```bash
ssh -N openclaw-vps
```

本机客户端连接 `ws://127.0.0.1:18789`，并提供同一个 `OPENCLAW_GATEWAY_TOKEN`。

---

## 9. Docker 文件访问与安全

OpenClaw Docker 容器只能访问容器内文件和显式挂载目录。要让 agent 管理宿主机项目，在 compose 中额外挂载：

```yaml
volumes:
    - ./config:/home/node/.openclaw
    - ./workspace:/home/node/.openclaw/workspace
    - /opt/projects:/workspace/projects
```

安全规则：

* Gateway 优先绑定 `127.0.0.1` 或只通过 1Panel / Nginx 反代访问
* `OPENCLAW_GATEWAY_TOKEN` 使用强随机字符串
* 不直接公网暴露 `18789`
* 不挂载宿主机根目录
* secrets 目录不要默认交给 agent
* 群聊和陌生私信保持 pairing / allowlist
* 非 main 会话建议启用 sandbox：`agents.defaults.sandbox.mode: "non-main"`
* Docker 默认用户是 `node`，uid 通常为 `1000`；权限错误时优先修正挂载目录所有权

---

## 10. 排错

### 10.1 Gateway 起不来

确认配置里有：

```json5
{
  gateway: {
    mode: "local",
    bind: "lan"
  }
}
```

Docker 里修复：

```bash
docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
docker compose up -d
```

### 10.2 Control UI 访问不了

确认容器健康：

```bash
docker compose logs -f openclaw-gateway
curl http://127.0.0.1:18789/healthz
```

如果需要重新拿 dashboard URL：

```bash
docker compose run --rm openclaw-cli dashboard --no-open
```

### 10.3 记忆检索不可用

```bash
openclaw memory status --deep
```

OAuth 不一定覆盖 embedding；按 `memorySearch.provider` 配齐 OpenAI / Gemini / local / voyage / mistral 等 embedding provider。

### 10.4 Docker 权限问题

官方镜像默认用 uid `1000`：

```bash
sudo chown -R 1000:1000 ./config ./workspace
```

### 10.5 飞书消息不响应

确认：

```bash
openclaw --version
openclaw gateway status
openclaw logs --follow
```

再检查 `dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`requireMention`。群聊默认不要取消 mention 门控。
