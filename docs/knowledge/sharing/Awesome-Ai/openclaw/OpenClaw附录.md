---
title: OpenClaw附录
date: 2026-2-24
order: 2
---

## A. `openclaw onboard`

下面把 **`openclaw onboard` 向导里会遇到的每个“选项/选择”**（交互式提示 + 非交互 CLI 参数）按流程拆开说明：内容以官方向导参考文档为准，并用源码把 `--auth-choice` / flags 的完整枚举补齐。

### 1) 入口：你先会选 “快速开始” 还是 “高级”

#### A. 快速开始（Quickstart / 默认）

含义：尽量少问问题，直接用安全默认值把系统跑起来。官方文档列出的默认值包括：**本地 Gateway（loopback）**、默认工作区、端口 **18789**、**自动生成 Token 认证**、Tailscale 关闭等。

怎么选（建议）：

* 你是**单机自用**（Mac/WSL/Linux）→ 选 **快速开始**就对了（后面随时 `openclaw configure` 再改）。
* 你明确要“公网暴露 / 多设备访问 / 远程网关”→ 选 **高级**（否则默认值可能不匹配你的拓扑）。

#### B. 高级（Advanced / Manual）

含义：把每一步都展开问你（模式、工作区、网关绑定/认证、渠道、守护进程、Skills 等）。 
补充：`--flow manual` 在源码与文档中都是 `advanced` 的别名。

---

### 2) 第一步：检测到已有配置时（Keep / Modify / Reset）

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

### 3) 第二步：模型/认证（Auth & Model）——这是最关键的选择

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


### 4) 第三步：工作区（Workspace）位置

含义：工作区是智能体的“知识/记忆/会话/引导文件”的落盘位置，默认是 `~/.openclaw/workspace`，向导会播种首次运行需要的 bootstrap 文件。

怎么选（建议）：

* 单人单机：保持默认即可。
* 你要隔离工作/生活：用 `openclaw agents add work` 创建**独立 agent + 独立 workspace**（不要手动拷来拷去）。

---

### 5) 第四步：Gateway 网关（端口 / 绑定 / 认证 / Tailscale）

向导会问四件事：**port、bind、auth、tailscale 暴露**。

#### 5.1 Port（端口）

* 含义：WebSocket 端口；默认通常是 **18789**。 
* 怎么选：没特殊原因别改；改了记得所有客户端 URL 都要跟着改。

#### 5.2 Bind（绑定方式）

源码与 CLI 参数里支持：`loopback | lan | tailnet | auto | custom`。

怎么选（建议）：

* **loopback**：只允许本机访问（最安全；SSH 端口转发也常用它）。
* **tailnet**：你用 Tailscale，多设备安全互联（推荐优先于 lan）。
* **lan**：局域网内可直接连（要配好防火墙 + 认证）。
* **auto**：让它自己选（不熟就别用，排障会更绕）。
* **custom**：你明确要绑到某个 IP/网卡（高级玩家）。

#### 5.3 Auth（认证方式）

文档明确建议：**即使是 loopback 也保持 Token 认证**，只有当你“完全信任本机每个进程”才考虑关闭；而非 loopback 绑定仍然需要认证。

怎么选（建议）：

* 99% 情况：选 **Token**（向导会自动生成或提示你设置）。
* Password：只在你有特定兼容需求时用（比如某些客户端/环境更容易输密码）。

#### 5.4 Tailscale 暴露（off / serve / funnel）

CLI 支持：`--tailscale off|serve|funnel`。

怎么选（建议）：

* **off**：默认、最稳。
* **serve**：在 tailnet 内用 HTTPS 暴露（适合多设备访问 Control UI）。
* **funnel**：把服务暴露到公网（风险高，除非你非常清楚自己在做什么）。

---

### 6) 第五步：Channels（WhatsApp/Telegram/Discord…）以及私信安全（Pairing / Allowlist）

向导会让你选要配置哪些渠道，并分别收集 token/二维码/配置文件等。支持渠道在官方参考里列得很清楚（WhatsApp/Telegram/Discord/Google Chat/Mattermost 插件/Signal/BlueBubbles/iMessage 等）。 

#### 6.1 私信安全默认是什么？

官方参考明确写：**默认是 pairing（配对）**：陌生人第一次私信会收到验证码，你需要用 `openclaw pairing approve <channel> <code>` 批准；当然也可以改成 allowlist。

怎么选（建议）：

* 你只给自己用：

  * 最省事：在向导里把你自己的账号/号码加入 allowlist（相当于直接放行你）。
  * 更稳：保持 pairing，第一次自己发消息后 approve 一次即可。
* 你要加群：把“群聊触发策略”收紧（例如 requireMention / allowFrom），别让机器人见人就回。

---

### 7) 第六步：安装守护进程（Install daemon）+ 运行时（node / bun）

含义：把 Gateway 作为后台服务常驻运行（macOS 用 LaunchAgent；Linux/WSL2 用 systemd user，并可能尝试 `loginctl enable-linger` 让你登出后也继续跑）。

运行时选择：

* 文档明确：**Node 推荐且 WhatsApp/Telegram 需要**；Bun 不推荐。

怎么选（建议）：

* 你希望“随时能回消息/自动化”：**Install daemon = Yes**，runtime 选 **node**。
* 你只是临时试用：可以先不装 daemon，之后再 `openclaw gateway install` 也行。

---

### 8) 第七步：Health check（健康检查）

含义：向导会启动网关（如果需要）并跑 `openclaw health`；`openclaw status --deep` 也会加入网关健康探测。 

怎么选（建议）：

* 除非你在 CI/脚本里跑、并且确定环境没法连网关，否则不要跳过。

---

### 9) 第八步：Skills（技能）+ Node manager（npm/pnpm/bun）

含义：向导会读取可用 Skills，检查依赖，然后让你选包管理器（npm/pnpm；bun 不推荐），并安装可选依赖（macOS 可能用 Homebrew）。 

怎么选（建议）：

* 新手/追求稳：先 **Skip skills**（后面随时装）。
* 要装：选 **pnpm**（一般更快更省空间），其次 npm；别用 bun（官方不推荐）。

---

### 10) Remote 模式（如果你选了 remote）

含义：只是在**本机**写入“去连远程网关”的 URL 和 token；不会在远程主机上安装/修改任何东西。 

怎么选（建议）：

* 远程网关只绑 loopback：用 **SSH 隧道**或 tailnet。 
* 远程网关开了认证：把 token 配上（推荐）。 

---

### 11) 非交互模式（`--non-interactive`）有哪些“选项”必须知道

#### 11.1 必须显式承认风险：`--accept-risk`

源码强制：只要 `--non-interactive`，你必须加 `--accept-risk`，否则直接退出并提示去看安全文档。 

#### 11.2 `openclaw onboard` 的 CLI 参数全量（按源码）

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

  * `--custom-base-url` / `--custom-model-id` / `--custom-api-key` / `--custom-provider-id` / `--custom-compatibility <openai|anthropic>`
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

#### 11.3 三个“直接可抄”的选择模板

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
