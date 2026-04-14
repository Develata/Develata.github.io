---
title: OpenClaw
date: 2026-04-14
order: 1
---

# OpenClaw 使用说明

[Github Repo](https://github.com/openclaw/openclaw)

本文主要参考：[官方说明文档](https://docs.openclaw.ai)

> 截至 **2026-04-14**，我已用 `gh api repos/openclaw/openclaw/releases/latest` 直接核对：最新 GitHub release 为 **v2026.4.12（2026-04-13）**。当前主仓库 README 已把 OpenClaw 明确定位为 **personal AI assistant**，并强调“产品本体是 assistant，Gateway 只是 control plane”。

## 0. 最短上手路径

如果你只想先跑起来，再慢慢细化配置，可以按下面这 5 步：

1. 安装（按系统二选一）：
   - 全局安装：`npm install -g openclaw@latest`
   - 或：`pnpm add -g openclaw@latest`
2. 初始化：`openclaw onboard --install-daemon`
3. 直接对 assistant 发送消息：`openclaw agent --message "Ship checklist" --thinking high`
4. 连接渠道（可选）：`openclaw channels login`
5. 健康检查：`openclaw status --deep`

---

## 1. 3 个关键概念

### 1）Gateway 网关

* OpenClaw 的 **Gateway 网关**是一个 WebSocket 服务器：负责 **渠道接入、会话、hooks、节点、Control UI / WebChat** 等。CLI、桌面 App、Web UI 都是通过它来交互。

### 2）智能体（Agent）与工作区（Workspace）

* OpenClaw 默认就能跑一个内置智能体 + 默认工作区（通常在 `~/.openclaw/workspace`）。只有当你需要 **限制触发人、群聊策略、改工作区、多智能体、模型/工具/沙箱** 等时，才需要写配置。
* **多智能体并发 (Multi-Agent)**：你甚至可以在配置文件中写多个完全不同的智能体，根据渠道或人来做自动路由（比如家里用一个，Slack里用另一个）。

### 3）“记忆”不是聊天记录，而是一套可索引的笔记体系

* 记忆的核心是工作区里的 `MEMORY.md` 与 `memory/*.md`（以及你额外加入的路径），OpenClaw可对它们做语义索引，用 `memory_search` / `memory_get` 工具按需召回。

---

## 2. 快速上手

### 推荐配置

`>= 2 核 2G`（建议开 SWAP），最好 `>= 2 核 4G`。

若服务器性能不足，可考虑基于 Rust 的轻量替代方案 [zeroclaw](https://github.com/zeroclaw-labs/zeroclaw)。

### 2.1 安装

#### 推荐方式：npm / pnpm + 新手引导

当前主 README 的推荐安装方式已经收敛为：先全局安装 CLI，再执行 `openclaw onboard`。它会引导你把网关、模型、工作区、渠道与守护进程（服务）一起配好。

```bash
npm install -g openclaw@latest
# 或
pnpm add -g openclaw@latest
```

然后执行：

```bash
openclaw onboard --install-daemon
```

补充：

* 当前 README 写明：**Node 24 推荐，最低 Node 22.16+**
* Windows 仍然建议通过 **WSL2** 使用

#### npm 包管理器（全局）

如果你已经安装 Node：

```bash
npm install -g openclaw@latest

# 或
pnpm add -g openclaw@latest
```

更新 OpenClaw：`npm install -g openclaw@latest`

#### Docker（隔离但配置复杂）

从仓库根目录：

```bash
./docker-setup.sh
```

安装完成后（或如果你跳过了新手引导），最关键的一步通常是：

```bash
openclaw onboard --install-daemon
```

* 系统要求：**Node 24 推荐，最低 22.16+**（官方 README 当前明确）。
* 新手引导入口：`openclaw onboard`，并支持后续用 `openclaw configure` 做二次配置。
* 具体选项不清楚可见附录或参考官方 onboarding 文档或执行 `openclaw onboard --help`

### 2.2 更新

推荐：重新安装即可（原地升级）。

或执行

```bash
openclaw update
```

### 2.3 不接任何渠道也能聊天：CLI / Control UI / WebChat

如果你只想最快开始对话（先不管 WhatsApp/Telegram），当前 README 的 quick start 更强调 CLI 直接发消息给 assistant：

```bash
openclaw agent --message "Ship checklist" --thinking high
```

如果你更喜欢浏览器界面，当前主 README 已经把 **Control UI / WebChat** 作为 Gateway 自带的 Web surface 来介绍，而不只是早期“单独 dashboard 命令”的理解。

---

### 2.4 立刻接入 WhatsApp（最常用）

WhatsApp 渠道的推荐流程是：

1. 在配置文件中写 WhatsApp 配置（至少建议做 allowlist / pairing，避免公开暴露）
2. 用 CLI 扫码登录（关联设备）
3. 启动 Gateway 网关
4. 让机器人只响应你（allowFrom / dmPolicy / group requireMention）

官方 WhatsApp 文档明确：用 `openclaw channels login` 扫二维码。

```bash
openclaw channels login
```

然后启动网关（前台）：

```bash
openclaw gateway run
# 或简写
openclaw gateway
```

> 注意：默认情况下，Gateway **要求配置里设置** `gateway.mode=local` 才允许启动；临时调试可以用 `--allow-unconfigured`。

#### 立刻接入 Feishu（国内常用）

Feishu/Lark 一般通过渠道配置接入，建议按下面流程做最小可用联通：

1. 在飞书开放平台创建应用，拿到 App ID / App Secret，并配置事件订阅回调地址。
2. 在 OpenClaw 配置中补充 Feishu 渠道，并先限制触发范围（测试账号或测试群）。
3. 启动 Gateway，完成事件校验与消息回调连通。
4. 用日志和状态命令确认是否收发正常。

```bash
openclaw configure --section channels
openclaw gateway run
openclaw logs --follow
```

安全建议（强烈建议先做）：

* 先用测试账号/测试群验证，不要直接全员放开
* 群聊开启 mention 门控，避免机器人“见消息就回”
* token/secret 优先放环境变量或受限权限文件，不要明文入库



## 3. 日常管理（配置/服务/诊断）

### 配置文件在哪里、是什么格式

默认配置路径：

* `~/.openclaw/openclaw.json`

它是 **JSON5**（支持斜杠 `//` 注释、也支持尾逗号），这对复杂的环境变配非常友好，并且有着 **严格 schema 校验**：

* 任何未知键、类型不对、非法值都会导致 Gateway 拒绝启动（安全护栏）。

### 3 种改配置方式：向导 / config set / RPC patch

#### 方式 1：向导（最稳）

```bash
openclaw configure
# 或分段
openclaw configure --section models --section channels
```

#### 方式 2：非交互式改键（适合脚本）

官方推荐 `openclaw config get|set|unset` 做非交互编辑。

例如（把网关模式设为本地）：

```bash
openclaw config set gateway.mode local
```

#### 方式 3：RPC 级别（适合远程/控制台 UI）

网关提供 `config.apply`（整份替换）与 `config.patch`（merge patch 语义局部更新）。

示例（先取 hash，再 patch）：

```bash
openclaw gateway call config.get --params '{}'
openclaw gateway call config.patch --params '{
  "raw": "{\n  channels: { telegram: { groups: { \"*\": { requireMention: false } } } }\n}\n",
  "baseHash": "<hash-from-config.get>",
  "restartDelayMs": 1000
}'
```

---

### Gateway 网关怎么跑、怎么装成服务

#### 前台运行

```bash
openclaw gateway run
# 或
openclaw gateway
```

关键点（官方）：

* 默认会拒绝启动，除非配置了 `gateway.mode=local`（安全护栏）。
* 非 loopback 绑定时，如果没有认证会被阻止（建议始终用 token）。
* 设备需要pairing

#### 装成服务（launchd/systemd/schtasks）

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
openclaw gateway uninstall
```

### 诊断：status / logs / doctor / health

官方给了一套“60 秒快速分类命令”，非常实用：

* `openclaw status`：本地摘要（网关可达性、服务、会话、提供商配置状态）
* `openclaw logs --follow`：实时日志
* `openclaw doctor`：配置/环境/服务诊断（配置不合法时尤其关键）
* `openclaw gateway status` / `openclaw gateway probe`：探测你到底连的是哪个网关、端口有没有错
* `openclaw health` / `openclaw status --deep`：更深的健康检查（需要网关可达）

其中一个高频坑：如果你曾经用 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` 之类设置过环境变量，它可能覆盖配置文件导致持续“未授权”，doctor 文档专门提醒了检查/取消方式。

---

## 4. 进阶：多智能体与路由

当你要把 OpenClaw变成“多机器人/多工作区/多身份”的系统时，核心在：

* `agents.defaults`：默认智能体的通用设置
* `agents.list[]`：定义多个智能体（每个可不同 workspace、model、sandbox、tools…）
* `bindings`：把不同渠道/账号/会话匹配路由到不同 agent（配置页有专门章节提示多智能体路由与绑定思路）。

新增一个隔离智能体（向导提到的方式）：

```bash
openclaw agents add work
```

它会为新智能体创建独立工作区、会话与认证配置文件（这点非常关键：**认证是按智能体隔离**的，不是全局共享）。

---

## 5. 进阶：记忆系统（MemSearch / MEMORY.md）

### 记忆检索的工作方式（你必须知道的“真实行为”）

官方概念页讲得很透：OpenClaw 会对 `MEMORY.md`、`memory/**/*.md`（以及 `memorySearch.extraPaths`）构建向量索引，用于“措辞不同也能召回”的语义检索。

并且有几条关键事实：

* **默认启用**记忆索引与文件变更监视（去抖）。
* provider 自动选择逻辑（未显式设置时）：

  * 若 `memorySearch.local.modelPath` 可用 → local
  * 否则若能解析 OpenAI key → openai
  * 否则若能解析 Gemini key → gemini
  * 否则记忆检索保持禁用直到配置完成 
* `memory_search` 返回的是 **片段（snippet）+ 路径 + 行号范围 + 分数**，不是整个文件；需要再用 `memory_get` 读指定行范围。


### memory CLI：索引、探测、搜索

OpenClaw 的 `memory` CLI 由当前启用的 memory 插件提供（默认 memory-core），可用于检查状态、强制索引与测试搜索。

常用命令：

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory index --verbose
openclaw memory search "release checklist"
```


### memorySearch 配置全解（含 provider、batch、hybrid）

#### 1）memorySearch 在 schema 里到底有哪些字段？

从配置 schema（源码）可以确认 memorySearch 的关键结构如下（我用“路径 → 含义”来讲）：

* `agents.defaults.memorySearch.enabled`：开关
* `agents.defaults.memorySearch.sources`：可选 `["memory","sessions"]`（会话记忆是实验性）
* `agents.defaults.memorySearch.extraPaths`：额外索引路径
* `agents.defaults.memorySearch.provider`：支持 `openai | local | gemini | voyage | mistral`（比很多旧教程多）
* `agents.defaults.memorySearch.remote`：`baseUrl/apiKey/headers` + `batch`（批处理）
* `agents.defaults.memorySearch.fallback`：`openai | gemini | local | voyage | mistral | none` 
* `agents.defaults.memorySearch.local`：本地嵌入模型路径/缓存目录
* `agents.defaults.memorySearch.store`：SQLite 存储、sqlite-vec 向量扩展等
* `agents.defaults.memorySearch.chunking`：chunk tokens/overlap
* `agents.defaults.memorySearch.sync`：watch、interval、会话增量阈值等
* `agents.defaults.memorySearch.query.hybrid`：BM25 + 向量混合检索参数（权重、候选倍率、MMR、时间衰减等）

#### 2）一个“靠谱、可控”的 memorySearch 示例（推荐起点）

**（a）最省事：用 OpenAI 兼容嵌入端点（也支持自定义 baseUrl）**

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "${OPENAI_COMPAT_API_KEY}",
          headers: { "X-Project": "myproj" }
        },
        sync: { watch: true }
      }
    }
  }
}
```

官方概念页明确支持“自定义 OpenAI 兼容端点”通过 `remote.baseUrl/apiKey/headers` 来配置。

**（b）不想用任何远程：强制本地嵌入 + 禁止回退**

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        local: { modelPath: "hf:ggml-org/embeddinggemma-300M-GGUF/embeddinggemma-300M-Q8_0.gguf" },
        fallback: "none"
      }
    }
  }
}
```

概念页对 local 模式（node-llama-cpp）和 fallback 行为写得非常明确。

#### 补充：如何添加API_KEY环境变量
1.网关服务（systemd）环境变量
```
mkdir ~/.config/systemd/user/openclaw-gateway.service.d
nano override.conf
```
写入
```
[Service]
# 目录里面的user需要换成自己的用户名
EnvironmentFile=-/home/user/.config/openclaw/env
Environment="NODE_OPTIONS=--dns-result-order=ipv4first --require=/home/user/.openclaw/patches/undici-connect-timeout.js"
```
```
nano ~/.config/openclaw/env
# 写入env环境变量
# 如OPENAI_COMPAT_API_KEY=sk-xxxxxxxxx
chmod 600 ~/.config/openclaw/env
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway
```
2.CLI commands 环境变量
```
cp ~/.config/openclaw/env ~/.openclaw/.env
```
（访问权限自行chmod设置）
或者把以下内容加入加到 `~/.bashrc`
```
# OpenClaw env (for CLI commands)
if [ -f "$HOME/.config/openclaw/env" ]; then
  set -a
  . "$HOME/.config/openclaw/env"
  set +a
fi
```

### 源码补充：引用模式与群聊默认不展示引用

源码里有两个容易忽略但非常实用的细节：

1）`memory_search` 的工具描述明确要求：如果返回 `disabled=true`，应把“记忆检索不可用”这件事明确暴露出来（而不是假装你检索过）。

2）引用（Source: path#Lx-Ly）是否插入到 snippet 里，受 `memory.citations` 控制（`on/off/auto`）。并且 `auto` 模式下：

* **direct chat 默认展示引用**
* **group/channel 默认不展示引用**（通过解析 sessionKey token `group/channel` 来判断）

这意味着：你在群里用 OpenClaw 时，即使记忆召回正常，用户也可能看不到“Source 行号”，这是设计选择，不是 bug。

---

## 6. 进阶：工具系统（Tools）与权限策略

### allow / deny / alsoAllow / profile

配置 schema（源码）显示了 tools policy 的核心约束：

* `tools.allow` / `tools.deny`：显式白/黑名单
* `tools.alsoAllow`：**“增量允许”**（用在 profile 的基础上加工具）
* 同一作用域里 **不能同时设置 allow 与 alsoAllow**（schema 会报错并阻止启动）
* `tools.profile`：`minimal | coding | messaging | full`（不同场景的预设工具集）

一个典型策略是：

* 平时用 `profile: "coding"` 或 `"messaging"`
* 再用 `alsoAllow` 添加少量额外工具
* 用 `deny` 禁掉你不希望模型碰的高风险工具（例如某些执行类工具）

---

### 源码补充：Owner-only 工具与降权行为

OpenClaw 有一类工具是 **owner-only**（只允许“所有者发送者”使用），源码里有两层机制：

* 如果工具对象标记 `ownerOnly: true` → 非 owner 直接不可见/不可执行
* 还有一个兜底列表：`whatsapp_login`、`cron`、`gateway` 这类工具名会被视为 owner-only（即便插件/工具元数据没标）

这对安全非常关键：

* 你可以把机器人暴露到群里，但仍保证只有 owner 能做“登录 WhatsApp/改网关/改 cron”等高权限动作（前提是你把 allowFrom / pairing / groupChat 策略设置好）。

---

### 防止“工具死循环”：loopDetection

在 schema 里能看到 `tools.loopDetection`：支持阈值与多种检测器（重复调用、已知无进展轮询、乒乓等），并且要求 warning/critical/global 阈值有严格大小关系，否则配置校验直接失败。

你想把 OpenClaw 用在“自动化 + 工具链”场景时，我建议你把 loopDetection 明确打开并把阈值调得保守些（尤其是执行工具/网络工具很多时）。

---

### 工具权限精细控制 (Tools Policy)

对于暴露给别人用的机器人，务必通过 `tools.allow` 或 `tools.deny` 来控制能力边界：

```json5
tools: { 
  profile: "messaging", // minimal | coding | messaging | full
  deny: ["browser", "canvas"] // 直接干掉浏览器与绘图板工具
}
```

针对高危的宿主机执行权限，还可以通过白名单限制触发者：

```json5
tools: {
  elevated: {
    enabled: true,
    allowFrom: {
      whatsapp: ["+15555550123"],  // 只有自己的手机号能要求执行终端命令
      discord: ["1234567890123"]
    }
  }
}
```

---

## 7. 进阶：沙箱（Docker Sandbox）与执行安全

OpenClaw 支持把工具执行放进 Docker 沙箱里，降低影响面：网关仍在主机上，工具执行在隔离容器里跑。这对于防止 Agent 误删文件或被“提示词注入”后作恶非常关键。

补充：最新 `v2026.4.12` 又进一步强调了本地执行与安全策略，例如：

* 新增本地 `openclaw exec-policy` 命令
* 安全修复里继续收紧 shell-wrapper / approval / busybox 等边界
* 文档和默认行为更强调显式权限策略，而不是“默认全放开”

开启沙盒：
```json5
agents: {
  defaults: {
    sandbox: {
      mode: "non-main", // off | non-main | all
      docker: {
        image: "openclaw-sandbox:bookworm-slim",
        network: "none", // 无网环境，极端安全
        user: "1000:1000"
      }
    }
  }
}
```

### 常用沙箱命令

```bash
openclaw sandbox explain
openclaw sandbox list
openclaw sandbox recreate --all
```

并且官方强调：当你更新镜像或配置后，最好用 `sandbox recreate` 强制重建容器，避免“老容器一直带着旧配置跑”。

### 源码级安全护栏（非常重要）

从 schema 可确认几条“会直接挡住配置”的安全规则：

* Docker sandbox `network: "host"` **被禁止**（会报错并阻止启动）
* `seccompProfile: "unconfined"`、`apparmorProfile: "unconfined"` **被禁止**
* `binds` 的 source 必须是绝对路径（否则报错）

这意味着：如果你是“自托管重度玩家”，想用 host 网络或 unconfined profile，OpenClaw 会硬挡；你需要改架构（比如用 bridge 网络、显式端口映射、或自建安全 profile）。

---

## 8. 进阶：自动化（Cron / Hooks）

### Cron：定时任务 / 一次性任务

Cron 是 Gateway 调度器的一部分：

```bash
openclaw cron --help
```

官方提示了两个常见行为点：

* “隔离式 cron add” 默认用 `--announce` 投递摘要；`--no-deliver` 只内部运行
* 一次性 `--at` 任务成功后默认删除；用 `--keep-after-run` 保留

> 实战建议：先用 `--announce` 把摘要投递到你自己的私聊（或专用频道），确认稳定后再做更激进的自动化。

---

### Hooks：事件驱动自动化（如 /new 时写入记忆）

Hooks 由 `openclaw hooks` 管理：可以 list/info/check/enable/disable/install/update。

```bash
openclaw hooks list --verbose
openclaw hooks enable session-memory
```

官方还明确区分：

* 内置 hooks：可直接 enable/disable
* 插件 hooks：显示为 `plugin:<id>`，需要通过启用/禁用插件来控制 

---

## 9. 进阶：Web 控制台 (Control UI) 与远程访问

你会遇到两类“远程”：

1）**CLI 远程连接到网关**（`gateway.mode=remote` + remote.url/token 等）
2）**OpenClaw.app 通过 SSH 隧道连接远程网关**（官方给了完整指南）

### 内置可视化面板与 Tailscale 原生集成

OpenClaw 实际内建了一个可视化管理面板和极其方便的内网穿透能力，只需在 `openclaw.json` 里添加：

```json5
  gateway: {
    controlUi: { 
      enabled: true, 
      basePath: "/openclaw" 
    },
    tailscale: { 
      mode: "serve" // "off" | "serve" | "funnel"
    }
  }
```

* **Control UI**：启动后即可在浏览器访问 `http://localhost:18789/openclaw`，获取可视化网关和对话管理功能。
* **Tailscale**：设置 `serve` 后，OpenClaw 会自动化与主机的 Tailscale 通讯，直接将网关服务暴露到你的私有 Tailnet 子网中，无需折腾 SSH 隧道或 Nginx 反代。

### SSH 隧道方式（OpenClaw.app 官方指南）

核心拓扑是：客户端机器连 `ws://127.0.0.1:18789`，由 SSH `LocalForward` 转发到远程机器的 18789。

示例（官方给的关键片段）：

```
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

然后：

```bash
ssh -N remote-gateway &
```

并在 macOS 上用 `launchctl setenv OPENCLAW_GATEWAY_TOKEN "<your-token>"` 设置 token（以便 app/CLI 认证）。

> 如果你更偏“运维视角”，也别忘了 `openclaw gateway probe --ssh user@host` 这类命令（gateway CLI 文档里写得很清楚）。

---

## A. 实战最佳实践与常见坑

### 1）强烈建议：先把“谁能触发机器人”收紧

最小安全姿势（WhatsApp）：

* `channels.whatsapp.dmPolicy` 默认是 `"pairing"`：陌生人先拿配对码，owner 批准后才放行
* 或者用 `"allowlist"` + `allowFrom` 只允许你的号码

### 2）群聊必做：mention 门控（避免机器人见人就回）

官方配置页推荐了“自聊天模式 / 群组控制”的写法：群里 requireMention=true，只对你 allowFrom。

### 3）记忆检索“不工作”时，优先看两件事

* `openclaw memory status --deep`：provider、模型、向量存储是否可用
* 如果你用的是 OAuth（比如 Codex OAuth），概念页明确提醒：它可能只覆盖聊天/补全，不等同于嵌入所需的 API key（需要按 memorySearch provider 配齐）。

### 4）配置写错导致网关起不来？别硬猜，直接 doctor

严格 schema 校验会让网关“拒绝启动”，这时只允许诊断命令（status/logs/doctor 等）。

## 参考链接（原始 URL）

```text
https://github.com/openclaw/openclaw
https://docs.openclaw.ai
https://docs.openclaw.ai/start/getting-started
https://docs.openclaw.ai/start/wizard
https://docs.openclaw.ai/install/updating
https://docs.openclaw.ai/tools/skills
```
