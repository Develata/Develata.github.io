# OpenCode（opencode）完整使用指南（Markdown）

## 目录

- [OpenCode（opencode）完整使用指南（Markdown）](#opencodeopencode完整使用指南markdown)
  - [目录](#目录)
  - [1. OpenCode 是什么](#1-opencode-是什么)
  - [2. 安装与更新](#2-安装与更新)
    - [2.1 macOS / Linux](#21-macos--linux)
      - [A. 官方安装脚本](#a-官方安装脚本)
      - [B. Homebrew（推荐）](#b-homebrew推荐)
    - [2.2 Arch Linux（Paru）](#22-arch-linuxparu)
    - [2.3 Windows](#23-windows)
      - [A. Chocolatey](#a-chocolatey)
      - [B. Scoop](#b-scoop)
      - [C. NPM（推荐，全局安装）](#c-npm推荐全局安装)
  - [3. 快速开始](#3-快速开始)
    - [3.1 在项目目录启动](#31-在项目目录启动)
    - [3.2 连接模型（必须）](#32-连接模型必须)
    - [3.2\*第三方中转 / 代理 API（OpenAI-Compatible Relay）](#32第三方中转--代理-apiopenai-compatible-relay)
        - [B 第一步：在 opencode.json 中配置 baseURL + models](#b-第一步在-opencodejson-中配置-baseurl--models)
        - [B 第二步：在 TUI 里添加凭据（/connect → Other）](#b-第二步在-tui-里添加凭据connect--other)
        - [C) 第三步（可选）：如果中转需要“自定义 Header”而不是标准 Authorization](#c-第三步可选如果中转需要自定义-header而不是标准-authorization)
    - [3.3 列出并切换模型](#33-列出并切换模型)
    - [3.4 项目初始化](#34-项目初始化)
  - [4. TUI 交互基础（核心用法）](#4-tui-交互基础核心用法)
    - [4.1 会话与上下文](#41-会话与上下文)
    - [4.2 引用文件 `@file`](#42-引用文件-file)
    - [4.3 执行命令 `!cmd`](#43-执行命令-cmd)
    - [4.4 常用斜杠命令 `/...`](#44-常用斜杠命令-)
  - [5. 基本流程（固定）](#5-基本流程固定)
  - [6. 配置体系（opencode.json/jsonc）](#6-配置体系opencodejsonjsonc)
    - [6.1 配置加载顺序](#61-配置加载顺序)
    - [6.2 常用配置项](#62-常用配置项)
    - [6.3 权限控制（强烈建议启用）](#63-权限控制强烈建议启用)
  - [Rules](#rules)
  - [MCP](#mcp)
  - [SKILLS](#skills)

---

## 1. OpenCode 是什么

OpenCode（命令通常为 `opencode`）是一个面向代码库的 AI 编码agent

---

## 2. 安装与更新

> 下面按系统选择一种安装方式即可。

### 2.1 macOS / Linux

#### A. 官方安装脚本
```bash
curl -fsSL https://opencode.ai/install | bash
```

#### B. Homebrew（推荐）

```bash
brew install anomalyco/tap/opencode
```

### 2.2 Arch Linux（Paru）

```bash
paru -S opencode-bin
```

### 2.3 Windows

#### A. Chocolatey

```powershell
choco install opencode
```

#### B. Scoop

```powershell
scoop install opencode
```

#### C. NPM（推荐，全局安装）

```powershell
npm install -g opencode-ai
```

> 更新：使用你的包管理器进行更新（brew upgrade / choco upgrade / scoop update / npm update -g opencode-ai
等）。

---

## 3. 快速开始
> 打开命令行窗口cmd
### 3.1 在项目目录启动

```bash
cd /path/to/your/project
opencode
```

启动后会进入终端交互界面（TUI）。

### 3.2 连接模型（必须）

在 TUI 输入：

```text
/connect
```

按提示选择 provider，并填写/登录获取 API Key。

### 3.2*第三方中转 / 代理 API（OpenAI-Compatible Relay）

> 适用场景：你使用的是“第三方中转/聚合/企业网关/LiteLLM/自建代理”等，提供 **OpenAI 兼容**的接口（通常是 `/v1` + `chat/completions` 风格）。

OpenCode 的做法是：先在 `opencode.json/jsonc` 里把该中转服务配置成一个“自定义 Provider”,再在 TUI 用 `/connect` 保存 API Key（凭据）。

##### B 第一步：在 opencode.json 中配置 baseURL + models

在全局目录`$USER\.config\opencode`项目根目录创建/修改 `opencode.jsonc`：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",

  "provider": {
    "relay": {
      "npm": "@ai-sdk/openai-compatible",
      //claude就写@ai-sdk/anthropic
      "name": "My Relay (OpenAI-Compatible)",
      //名字随便取，后面对应地方也要修改
      "options": {
        "baseURL": "https://你的中转域名/v1"
      },
      "models": {
        "gpt-5.1": { "name": "GPT-5.2 (via relay)" },
        //填写模型名称，后面的name是自定义的
        "claude-sonnet-4-5": { "name": "Claude Sonnet 4.5 (via relay)" }
      }
    }
  },

  "model": "My Relay (OpenAI-Compatible)/GPT-5.2"
  //选择你进入页面后的默认model
}
```

##### B 第二步：在 TUI 里添加凭据（/connect → Other）

1. 打开 TUI：`opencode`
2. 输入：`/connect`
3. 在列表输入你刚刚填写的名称，找到后并选择
4. 输入你的中转 API Key（如 `sk-...`）

配置完成后回到 TUI：

* 输入 `/models`，你会看到 “My Relay (OpenAI-Compatible)” 下的模型并可切换。
---



##### C) 第三步（可选）：如果中转需要“自定义 Header”而不是标准 Authorization

有些中转不是 `Authorization: Bearer ...`，而是例如：

* `api-key: xxx`
* `X-API-Key: xxx`
* `Authorization: Bearer <自定义token>`

这时你可以在 `options.headers` 里加自定义头。官方示例支持 `options.headers`。

示例（把 Key 放在环境变量里更安全）：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "relay": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "My Relay",
      "options": {
        "baseURL": "https://你的中转域名/v1",
        "headers": {
          "api-key": "{env:RELAY_API_KEY}"
        }
      },
      "models": {
        "gpt-4.1": { "name": "GPT-4.1 (relay)" }
      }
    }
  },
  "model": "relay/gpt-4.1"
}
```


然后在 shell 中设置环境变量（举例）：

* macOS/Linux：

  ```bash
  export RELAY_API_KEY="你的key"
  ```
* Windows PowerShell：

  ```powershell
  setx RELAY_API_KEY "你的key"
  ```

> 官方也给出了 `options.apiKey` 与 `env` 变量写法、以及 headers 的示例，你可以按自己的中转要求选择：
>
> * 如果你已用 `/connect` 存了 key，通常不必再写 `options.apiKey`；
> * 如果你的中转只认自定义 header（例如 `api-key`），就按上面这样在 `headers` 里显式设置。

### 3.3 列出并切换模型

在 TUI 输入：

```text
/models
```

然后选择你要用的模型（通常会显示 provider/model）。

### 3.4 项目初始化

在 TUI 输入：

```text
/init
```

它会生成（或更新）当前目录下的`AGENTS.md`，用于帮助 OpenCode 更快理解项目结构与约定。建议提交到 Git。

---

## 4. TUI 交互基础（核心用法）

### 4.1 会话与上下文

* OpenCode 会把对话当作“会话（session）”来管理
* 你可以随时切换/恢复不同会话，避免不同任务互相污染上下文

常用命令：

```text
/sessions
```

---

### 4.2 引用文件 `@file`

在消息里使用 `@` 搜索并引用文件/路径，让模型把文件内容加入上下文。

示例：

```text
请解释 @src/auth/index.ts 的认证流程，并指出入口函数与调用链。
```

建议用法：

* 先让它概览，再逐个 `@` 关键文件深挖
* 大文件优先引用关键片段所在文件或模块

---

### 4.3 执行命令 `!cmd`

在消息中以 `!` 开头，OpenCode 会执行 shell 命令并把输出带回对话。

示例：

```text
!npm test
```

常见用途：

* 复现 bug：`!pytest -q` / `!npm test` / `!go test ./...`
* 运行 linter：`!eslint .` / `!ruff check .`
* 打印目录结构：`!ls -la` / `!tree -L 3`

> 强烈建议配合“权限控制”使用（见 6.3）。

---

### 4.4 常用斜杠命令 `/...`

以下命令在 TUI 里输入即可：

* `/connect`：连接/管理 provider 凭据
* `/models`：列出与切换模型
* `/sessions`：列出/切换会话
* `/init`：生成/更新 `AGENTS.md`
* `/compact`：压缩当前会话（把长上下文总结后继续）
* `/undo`、`/redo`：撤销/重做（通常依赖 Git 仓库）
* `/share`：分享当前会话（协作/排错）
* `/editor`：用外部编辑器编辑长输入（依赖 `EDITOR` 环境变量）
* `/export`：导出对话到 Markdown（便于归档）

---

## 5. 基本流程（固定）

1. cmd `opencode` 或者vscode opencode 扩展（推荐）启动 TUI
2. `/connect` 连接 provider（填 key 或登录）
3. `/models` 选择模型
4. `/init` 更新 AGENTS.md
5. `/sessions` 选择历史对话
6. `/new` 新对话
---

## 6. 配置体系（opencode.json/jsonc）

OpenCode 支持项目级与全局配置文件：

* `opencode.json`
* `opencode.jsonc`（允许注释，推荐）

---

### 6.1 配置加载顺序

常见的覆盖逻辑（后者覆盖前者的冲突项）：

1. 组织级默认（远程）
2. 全局配置（如 `~/.config/opencode/opencode.json`）
3. 环境变量指定 `OPENCODE_CONFIG`
4. 项目根目录 `opencode.json`/`opencode.jsonc`
5. 项目 `.opencode/` 下的 agents/commands/plugins 等扩展内容（如你使用了）

> 建议：团队统一的默认策略放全局或组织层；项目特殊策略放项目根。

---

### 6.2 常用配置项

在项目根创建 `opencode.jsonc`：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",

  // 默认使用的主模型
  "model": "anthropic/claude-sonnet-4-5",

  // 工具权限（建议先保守，逐步放开）
  "permission": {
    "edit": "ask",
    "bash": "ask",
    "webfetch": "allow"
  }
}
```

### 6.3 权限控制（强烈建议启用）

OpenCode 常见高风险能力：

* 写入/修改文件（edit）
* 执行命令（bash）
* 网络抓取（webfetch）

建议在初期把关键权限设为 `ask`：

* `allow`：允许自动执行
* `deny`：禁止
* `ask`：每次执行前询问（推荐默认）

团队项目建议：

* `bash` 默认 `ask`，避免误删/误改环境
* `edit` 默认 `ask`，避免大范围变更未审
* `webfetch` 可 `allow` 或 `ask`（看你是否允许拉取外部信息）

## Rules

## MCP

## SKILLS