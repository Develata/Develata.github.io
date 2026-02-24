# OpenClaw 使用说明


[Github Repo](https://github.com/openclaw/openclaw)
本文主要参考：[官方说明文档](https://docs.openclaw.ai)
## 1 3 个关键概念

### 1）Gateway 网关

* OpenClaw 的 **Gateway 网关**是一个 WebSocket 服务器：负责 **渠道接入、会话、hooks、节点、控制 UI** 等。CLI、桌面 App、Web UI 都是通过它来交互。

### 2）智能体（Agent）与工作区（Workspace）

* OpenClaw 默认就能跑一个内置智能体 + 默认工作区（通常在 `~/.openclaw/workspace`）。只有当你需要 **限制触发人、群聊策略、改工作区、多智能体、模型/工具/沙箱** 等时，才需要写配置。

### 3）“记忆”不是聊天记录，而是一套可索引的笔记体系

* 记忆的核心是工作区里的 `MEMORY.md` 与 `memory/*.md`（以及你额外加入的路径），OpenClaw可对它们做语义索引，用 `memory_search` / `memory_get` 工具按需召回。

---

## 2 快速安装
### 推荐配置
 $\ge$ 2核2G（开SWAP），最好$\ge$ 2核4G,若服务器性能不足推荐去使用基于RUST的[zeroclaw](https://github.com/zeroclaw-labs/zeroclaw)，十分轻量

### A.安装 

#### 推荐方式：安装器 + 新手引导

官方推荐走安装器，它会装 CLI 并引导你把网关、模型、工作区、渠道与守护进程（服务）一起配好。

```bash
# macOS / Linux
curl -fsSL https://openclaw.ai/install.sh | bash

# Windows PowerShell（或更推荐 WSL2）
iwr -useb https://openclaw.ai/install.ps1 | iex

# Windows CMD
curl -fsSL https://openclaw.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```
更新openclaw：在最后添加`--no-onboard`即可跳过新手引导
#### npm包管理器（全局）
如果你已经有 Node
```bash
# 官方安装版本
npm install -g openclaw@latest

# 某个第三方汉化
npm install -g @qingchencloud/openclaw-zh@latest
# [Github Repo](https://github.com/1186258278/OpenClawChineseTranslation)
```
更新openclaw：`npm install -g openclaw@latest`或`npm install -g openclaw@latest`
#### docker(隔离但配置复杂)
从仓库根目录：
```bash
./docker-setup.sh
```
安装完成后（或如果你跳过了新手引导），最关键的一步通常是：

```bash
openclaw onboard --install-daemon
```

* 系统要求：Node >= 22（官方明确）。
* 新手引导入口：`openclaw onboard`，并支持后续用 `openclaw configure` 做二次配置。
* 具体选项不清楚可见附录

### B.更新
推荐：重新安装即可（原地升级）

或执行
```bash
openclaw update
```

### B. 不接任何渠道也能聊天：Dashboard（浏览器）

如果你只想最快开始对话（先不管 WhatsApp/Telegram），官方给的“最快开聊方式”就是：直接开 Web 控制界面/仪表板。

```bash
openclaw dashboard
```

它会打开浏览器，让你在本地就能跟智能体聊天（无需先配置任何消息渠道）。

---

### C. 立刻接入 WhatsApp（最常用）

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

---

## 3 日常管理（配置/服务/诊断）

### 配置文件在哪里、是什么格式

默认配置路径：

* `~/.openclaw/openclaw.json`

它是 **JSON5**（支持注释、尾逗号），并且 **严格 schema 校验**：

* 任何未知键、类型不对、非法值都会导致 Gateway 拒绝启动（安全护栏）。

最小可用配置（官方示例风格）：

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

---

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

#### 装成服务（launchd/systemd/schtasks）

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
openclaw gateway uninstall
```

---

### 诊断：status / logs / doctor / health

官方给了一套“60 秒快速分类命令”，非常实用：

* `openclaw status`：本地摘要（网关可达性、服务、会话、提供商配置状态）
* `openclaw logs --follow`：实时日志
* `openclaw doctor`：配置/环境/服务诊断（配置不合法时尤其关键）
* `openclaw gateway status` / `openclaw gateway probe`：探测你到底连的是哪个网关、端口有没有错
* `openclaw health` / `openclaw status --deep`：更深的健康检查（需要网关可达）

其中一个高频坑：如果你曾经用 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` 之类设置过环境变量，它可能覆盖配置文件导致持续“未授权”，doctor 文档专门提醒了检查/取消方式。

---

## 4 进阶：多智能体与路由

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

## 5 进阶：记忆系统（MemSearch / MEMORY.md）

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

---

### memory CLI：索引、探测、搜索

OpenClaw 的 `memory` CLI 由当前启用的 memory 插件提供（默认 memory-core），可用于检查状态、强制索引与测试搜索。

常用命令：

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory index --verbose
openclaw memory search "release checklist"
```

---

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

---

### 源码补充：引用模式与群聊默认不展示引用

源码里有两个容易忽略但非常实用的细节：

1）`memory_search` 的工具描述明确要求：如果返回 `disabled=true`，应把“记忆检索不可用”这件事明确暴露出来（而不是假装你检索过）。

2）引用（Source: path#Lx-Ly）是否插入到 snippet 里，受 `memory.citations` 控制（`on/off/auto`）。并且 `auto` 模式下：

* **direct chat 默认展示引用**
* **group/channel 默认不展示引用**（通过解析 sessionKey token `group/channel` 来判断）

这意味着：你在群里用 OpenClaw 时，即使记忆召回正常，用户也可能看不到“Source 行号”，这是设计选择，不是 bug。

---

## 6 进阶：工具系统（Tools）与权限策略

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

## 7 进阶：沙箱（Docker Sandbox）与执行安全

OpenClaw 支持把工具执行放进 Docker 沙箱里，降低影响面：网关仍在主机上，工具执行在隔离容器里跑。

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

## 8 进阶：自动化（Cron / Hooks）

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

## 9 进阶：远程访问与远程 Gateway

你会遇到两类“远程”：

1）**CLI 远程连接到网关**（`gateway.mode=remote` + remote.url/token 等）
2）**OpenClaw.app 通过 SSH 隧道连接远程网关**（官方给了完整指南）

### SSH 隧道方式（OpenClaw.app 官方指南）

核心拓扑是：客户端机器连 `ws://127.0.0.1:18789`，由 SSH `LocalForward` 转发到远程机器的 18789。

示例（官方给的关键片段）：

```sshconfig
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

## A 实战最佳实践与常见坑

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

---
## 附录
### A openclaw onboard

下面把 **`openclaw onboard` 向导里会遇到的每个“选项/选择”**（交互式提示 + 非交互 CLI 参数）按流程拆开说明：内容以官方向导参考文档为准，并用源码把 `--auth-choice` / flags 的完整枚举补齐。

## 1) 入口：你先会选 “快速开始” 还是 “高级”

### A. 快速开始（Quickstart / 默认）

含义：尽量少问问题，直接用安全默认值把系统跑起来。官方文档列出的默认值包括：**本地 Gateway（loopback）**、默认工作区、端口 **18789**、**自动生成 Token 认证**、Tailscale 关闭等。

怎么选（建议）：

* 你是**单机自用**（Mac/WSL/Linux）→ 选 **快速开始**就对了（后面随时 `openclaw configure` 再改）。
* 你明确要“公网暴露 / 多设备访问 / 远程网关”→ 选 **高级**（否则默认值可能不匹配你的拓扑）。

### B. 高级（Advanced / Manual）

含义：把每一步都展开问你（模式、工作区、网关绑定/认证、渠道、守护进程、Skills 等）。 
补充：`--flow manual` 在源码与文档中都是 `advanced` 的别名。

---

## 2) 第一步：检测到已有配置时（Keep / Modify / Reset）

当 `~/.openclaw/openclaw.json` 已存在时，向导会让你选：

* **Keep（保留）**：不改现有配置，只补缺的部分（最稳）。
* **Modify（修改）**：保留为主，但允许你逐步改关键项（常用）。
* **Reset（重置）**：会用 `trash` 丢弃（不会直接 `rm`），并让你选重置范围：

  * **Config only**（只删配置）
  * **Config + credentials + sessions**（再删凭证/会话）
  * **Full reset**（连工作区也删）

怎么选（建议）：

* 你只是“上次没配好/想补配置”→ **Modify**
* 你怀疑“旧配置乱了/升级后字段过期”→ 先跑 `openclaw doctor`，能修就修；修不了再 **Reset（Config only）** 起步（别一上来 Full reset）。 
---

## 3) 第二步：模型/认证（Auth & Model）——这是最关键的选择

向导会让你选“用哪个提供商、用什么方式拿凭证”，并据此写入默认模型与认证存储。官方参考页列了主要选项与行为（例如：Anthropic API key 推荐、OpenAI Codex OAuth、OpenAI API key 写入 `~/.openclaw/.env` 等）。

**（1）推荐路线：Anthropic API key**

* 含义：用 `ANTHROPIC_API_KEY`（若没有就提示输入）并保存，方便守护进程使用。
* 适合：你就是要稳定省心、服务端跑守护进程。

**（2）OpenAI：Codex OAuth 或 OpenAI API key**

* Codex OAuth：浏览器走 OAuth，粘贴 `code#state`；向导会在符合条件时把默认模型设为 Codex 路线。
* OpenAI API key：用 `OPENAI_API_KEY`（无则提示），并写到 `~/.openclaw/.env` 给 launchd/systemd 用。

不想现在选可以 **Skip**：只是不配置认证，后面要么重新跑 onboard，要么 `openclaw models auth ...` / `openclaw configure` 补上。 

**（3）第三方API**

使用 models.providers（或 models.json）添加自定义提供商或 OpenAI/Anthropic 兼容的代理。

文件位置`~/.openclaw/openclaw.json`
在models.providers下添加第三方服务器配置，如Kimi K2.5(openai 兼容格式)
```
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.5", name: "Kimi K2.5" }],
      },
    },
  },
}
```


## 4) 第三步：工作区（Workspace）位置

含义：工作区是智能体的“知识/记忆/会话/引导文件”的落盘位置，默认是 `~/.openclaw/workspace`，向导会播种首次运行需要的 bootstrap 文件。

怎么选（建议）：

* 单人单机：保持默认即可。
* 你要隔离工作/生活：用 `openclaw agents add work` 创建**独立 agent + 独立 workspace**（不要手动拷来拷去）。

---

## 5) 第四步：Gateway 网关（端口 / 绑定 / 认证 / Tailscale）

向导会问四件事：**port、bind、auth、tailscale 暴露**。

### 5.1 Port（端口）

* 含义：WebSocket 端口；默认通常是 **18789**。 
* 怎么选：没特殊原因别改；改了记得所有客户端 URL 都要跟着改。

### 5.2 Bind（绑定方式）

源码与 CLI 参数里支持：`loopback | lan | tailnet | auto | custom`。 ([GitHub][5])

怎么选（建议）：

* **loopback**：只允许本机访问（最安全；SSH 端口转发也常用它）。
* **tailnet**：你用 Tailscale，多设备安全互联（推荐优先于 lan）。
* **lan**：局域网内可直接连（要配好防火墙 + 认证）。
* **auto**：让它自己选（不熟就别用，排障会更绕）。
* **custom**：你明确要绑到某个 IP/网卡（高级玩家）。

### 5.3 Auth（认证方式）

文档明确建议：**即使是 loopback 也保持 Token 认证**，只有当你“完全信任本机每个进程”才考虑关闭；而非 loopback 绑定仍然需要认证。

怎么选（建议）：

* 99% 情况：选 **Token**（向导会自动生成或提示你设置）。
* Password：只在你有特定兼容需求时用（比如某些客户端/环境更容易输密码）。

### 5.4 Tailscale 暴露（off / serve / funnel）

CLI 支持：`--tailscale off|serve|funnel`。 ([GitHub][5])

怎么选（建议）：

* **off**：默认、最稳。
* **serve**：在 tailnet 内用 HTTPS 暴露（适合多设备访问 Control UI）。
* **funnel**：把服务暴露到公网（风险高，除非你非常清楚自己在做什么）。

---

## 6) 第五步：Channels（WhatsApp/Telegram/Discord…）以及私信安全（Pairing / Allowlist）

向导会让你选要配置哪些渠道，并分别收集 token/二维码/配置文件等。支持渠道在官方参考里列得很清楚（WhatsApp/Telegram/Discord/Google Chat/Mattermost 插件/Signal/BlueBubbles/iMessage 等）。 

### 6.1 私信安全默认是什么？

官方参考明确写：**默认是 pairing（配对）**：陌生人第一次私信会收到验证码，你需要用 `openclaw pairing approve <channel> <code>` 批准；当然也可以改成 allowlist。

怎么选（建议）：

* 你只给自己用：

  * 最省事：在向导里把你自己的账号/号码加入 allowlist（相当于直接放行你）。
  * 更稳：保持 pairing，第一次自己发消息后 approve 一次即可。
* 你要加群：把“群聊触发策略”收紧（例如 requireMention / allowFrom），别让机器人见人就回。

---

## 7) 第六步：安装守护进程（Install daemon）+ 运行时（node / bun）

含义：把 Gateway 作为后台服务常驻运行（macOS 用 LaunchAgent；Linux/WSL2 用 systemd user，并可能尝试 `loginctl enable-linger` 让你登出后也继续跑）。

运行时选择：

* 文档明确：**Node 推荐且 WhatsApp/Telegram 需要**；Bun 不推荐。

怎么选（建议）：

* 你希望“随时能回消息/自动化”：**Install daemon = Yes**，runtime 选 **node**。
* 你只是临时试用：可以先不装 daemon，之后再 `openclaw gateway install` 也行。

---

## 8) 第七步：Health check（健康检查）

含义：向导会启动网关（如果需要）并跑 `openclaw health`；`openclaw status --deep` 也会加入网关健康探测。 

怎么选（建议）：

* 除非你在 CI/脚本里跑、并且确定环境没法连网关，否则不要跳过。

---

## 9) 第八步：Skills（技能）+ Node manager（npm/pnpm/bun）

含义：向导会读取可用 Skills，检查依赖，然后让你选包管理器（npm/pnpm；bun 不推荐），并安装可选依赖（macOS 可能用 Homebrew）。 

怎么选（建议）：

* 新手/追求稳：先 **Skip skills**（后面随时装）。
* 要装：选 **pnpm**（一般更快更省空间），其次 npm；别用 bun（官方不推荐）。

---

## 10) Remote 模式（如果你选了 remote）

含义：只是在**本机**写入“去连远程网关”的 URL 和 token；不会在远程主机上安装/修改任何东西。 

怎么选（建议）：

* 远程网关只绑 loopback：用 **SSH 隧道**或 tailnet。 
* 远程网关开了认证：把 token 配上（推荐）。 

---

## 11) 非交互模式（`--non-interactive`）有哪些“选项”必须知道

### 11.1 必须显式承认风险：`--accept-risk`

源码强制：只要 `--non-interactive`，你必须加 `--accept-risk`，否则直接退出并提示去看安全文档。 

### 11.2 `openclaw onboard` 的 CLI 参数全量（按源码）

下面这些都是 `onboard` 命令注册出来的参数（也就是“每个选项”）：

* 流程/模式

  * `--flow <quickstart|advanced|manual>`
  * `--mode <local|remote>`
* 工作区与重置

  * `--workspace <path>`
  * `--reset`
* 非交互

  * `--non-interactive`
  * `--accept-risk`
  * `--json`
* 认证（大类）

  * `--auth-choice <…很长…>`（值见上面枚举）
* 认证（各 provider 的 key flags）

  * `--anthropic-api-key` / `--openai-api-key` / `--openrouter-api-key` / `--ai-gateway-api-key` / …（一大串）
* Custom provider（OpenAI/Anthropic 兼容端点）

  * `--custom-base-url` / `--custom-model-id` / `--custom-api-key` / `--custom-provider-id` / `--custom-compatibility <openai|anthropic>` ([GitHub][5])
* Gateway

  * `--gateway-port`
  * `--gateway-bind <loopback|tailnet|lan|auto|custom>`
  * `--gateway-auth <token|password>`
  * `--gateway-token` / `--gateway-password`
* Remote gateway

  * `--remote-url` / `--remote-token`
* Tailscale

  * `--tailscale <off|serve|funnel>`
  * `--tailscale-reset-on-exit`
* Daemon

  * `--install-daemon` / `--no-install-daemon`（或 `--skip-daemon`）
  * `--daemon-runtime <node|bun>`
* 跳过项

  * `--skip-channels` / `--skip-skills` / `--skip-health` / `--skip-ui`
* Skills 安装器

  * `--node-manager <npm|pnpm|bun>` 

### 11.3 三个“直接可抄”的选择模板

**A) 单机自用（最推荐）**

```bash
openclaw onboard --install-daemon
```

走快速开始默认值即可（loopback + token + 18789）。

**B) 远程客户端（本机只连接别处网关）**

```bash
openclaw onboard --mode remote --remote-url ws://gateway-host:18789 --remote-token <token>
```

remote 只写本机连接信息，不会动远端。

**C) 非交互脚本（Anthropic API key + 本地网关）**

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

这个结构与官方自动化示例一致。

---

如果你把你的目标场景告诉我（例如：**只本机** / **家里一台 NAS 跑网关、笔记本当客户端** / **需要 Telegram 群** / **要用某个特定模型平台**），我可以直接给你一份“该选哪些选项”的**逐题答案版**（一问一答对应 onboard 每一步）。

## 参考链接（原始 URL）

```text
https://github.com/openclaw/
https://docs.openclaw.ai/zh-CN
https://www.80aj.com/2026/02/03/openclaw-memsearch-configuration/
https://holtchas.github.io/openclaw-docs-zh/
https://clawd.org.cn/
https://open-claw.me/zh
```
