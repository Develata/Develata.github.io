---
title: OpenCode
date: 2026-1-28
order: 1
---

# OpenCode使用指南

## 1. OpenCode 是什么
[Github Repo](https://github.com/anomalyco/opencode)

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

以下命令在 TUI 里输入即可（括号内为常用别名）：

* `/help`：显示帮助对话框
* `/connect`：连接/管理 provider 凭据
* `/models`：列出与切换模型
* `/sessions` (`/resume`, `/continue`)：列出/切换历史会话
* `/new` (`/clear`)：开启全新会话
* `/init`：生成/更新 `AGENTS.md`
* `/compact` (`/summarize`)：压缩当前会话（总结长上下文以节省 Token）
* `/undo`：撤销上一次代码修改（依赖 Git）
* `/redo`：重做撤销的修改
* `/share` / `/unshare`：分享/取消分享当前会话
* `/editor`：调用外部编辑器（如 VS Code）编写长输入
* `/export`：将对话导出为 Markdown 文件
* `/theme`：切换界面主题
* `/exit` (`/quit`, `/q`)：退出

---

### 4.5 快捷键大全（核心效率）

OpenCode 使用 **Leader 键**（默认 `Ctrl+x`）来触发快速操作：

| 快捷键 | 功能 | 快捷键 | 功能 |
| :--- | :--- | :--- | :--- |
| **Ctrl+x n** | 开启新会话 | **Ctrl+x u** | 撤销修改 |
| **Ctrl+x l** | 列出历史会话 | **Ctrl+x r** | 重做修改 |
| **Ctrl+x m** | 切换模型 | **Ctrl+x s** | 分享会话 |
| **Ctrl+x i** | 初始化项目 | **Ctrl+x e** | 外部编辑器 |
| **Ctrl+x t** | 切换主题 | **Ctrl+x q** | 退出 |
| **Ctrl+x b** | 切换侧边栏 | **Ctrl+x y** | 复制消息 |
| **Ctrl+x a** | Agent 列表 | **Ctrl+x g** | 会话时间线 |

**基础操作与导航：**
- `Tab` / `Shift+Tab`：在 **Plan（规划）** 与 **Build（构建）** 模式间切换。
- `Ctrl+x →` / `Ctrl+x ←`：在 **父会话** 与 **子会话**（由 `@general` 等触发）之间快速切换。
- `Shift+Enter` / `Ctrl+j`：在输入框内换行。
- `PgUp` / `PgDown`：向上/下翻页。
- `Ctrl+Alt+u` / `Ctrl+Alt+d`：向上/下翻 **半页**。
- `Home` / `End`：跳至对话最顶部或最底部。
- `Escape`：中断当前的 AI 输出。

---

## 5. Agent 模式与子代理

OpenCode 并非单一的对话框，它通过不同的 Agent 协同工作。

### 5.1 Plan vs Build 模式
*   **Plan Mode (🧠)**：**只分析，不改代码**。适合架构设计、逻辑推演或大规模重构前的方案评估。
*   **Build Mode (🔨)**：**直接修改文件**。根据指令进行编码、修复 Bug。
*   **最佳实践**：复杂任务先在 Plan 模式确认方案，满意后再切到 Build 模式说“开始执行”。

### 5.2 子代理（Subagents）
在对话中使用 `@` 可以召唤特定功能的子代理：
*   **`@general`**：用于处理需要多步推理、跨文件搜索的复杂任务。
    *   *示例*：“@general 在整个项目中搜索所有使用了 localStorage 的地方并总结用途。”
    *   *示例*：“@general 分析项目依赖，找出是否存在循环引用。”
*   **`@explore`**：专注于代码库的快速探索与定位。
    *   *示例*：“@explore 找到所有包含 'TODO' 或 'FIXME' 注释的文件。”
    *   *示例*：“@explore 这个项目的入口文件和核心路由定义在哪里？”

---

## 6. 基本流程（固定）

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

## 7.Rules (规则系统)

Rules 允许你通过 `AGENTS.md` 文件为项目定义长期遵循的指令（类似于 Cursor 的 `.cursorrules`）。

### 7.1 AGENTS.md 层级
1.  **项目级**：存放在项目根目录。仅对该项目生效。
2.  **全局级**：存放在 `~/.config/opencode/AGENTS.md`。对所有项目生效（适合存放个人编程偏好）。

### 7.2 引入外部规则
在 `opencode.jsonc` 中，你可以通过 `instructions` 数组引用现有的 Markdown 文档作为规则：

```jsonc
{
  "instructions": [
    "CONTRIBUTING.md",
    "docs/coding-standards.md",
    ".cursor/rules/*.md" // 支持通配符导入 Cursor 规则
  ]
}
```

---

## 8.MCP (模型上下文协议)

MCP 允许 OpenCode 挂载外部工具（如 Google Search, GitHub API, SQL 查询等）。

### 8.1 本地 MCP 服务器
在配置文件的 `mcp` 字段下定义：

```jsonc
"mcp": {
  "my-local-tool": {
    "type": "local",
    "command": ["npx", "-y", "@modelcontextprotocol/server-everything"],
    "enabled": true
  }
}
```

### 8.2 远程 MCP 服务器
支持 OAuth 认证，初次使用时会在浏览器弹出授权：

```jsonc
"mcp": {
  "sentry": {
    "type": "remote",
    "url": "https://mcp.sentry.dev/mcp",
    "enabled": true
  }
}
```

---

## 9.SKILLS (技能系统)

Skills 是可复用的指令片段，通过 `SKILL.md` 文件定义。代理会自动发现这些技能并按需加载。

### 9.1 创建技能
路径：`.opencode/skills/<skill-name>/SKILL.md`

```markdown
---
name: git-release
description: 用于起草标准化的 Git Release 说明和版本号更新建议
---
## 指令
1. 检查当前已合并的 PR。
2. 按照 SemVer 建议版本号。
3. 生成 gh release create 命令。
```

### 9.2 权限管理
你可以控制哪些技能被允许、拒绝或需要询问：

```jsonc
"permission": {
  "skill": {
    "git-release": "allow",
    "experimental-*": "ask",
    "*": "deny"
  }
}
```

---

## 10. 进阶指南与最佳实践

### 10.1 避坑与性能优化
*   **上下文超限**：如果项目极大，务必使用 `/compact`。同时在 `opencode.jsonc` 中合理配置 `ignore` 列表（默认遵循 `.gitignore`）。
*   **图片支持**：直接将图片（报错截图、设计稿）**拖入终端**，OpenCode 即可理解图片内容。
*   **国产模型适配**：对于火山引擎、DeepSeek 等国内 Provider，推荐使用 **OpenAI-Compatible Relay** 模式配置（详见 3.2*）。

### 10.2 常用 Shell 技巧
使用 `!` 执行命令时，输出会直接进入上下文：
*   `!tree -L 2`：让 AI 快速预览目录结构。
*   `!git diff HEAD`：让 AI 总结你刚才手动做的修改。
*   `!npm test -- --grep "auth"`：运行特定测试并让 AI 修复报错。

### 10.4 提示词（Prompt）优化要素
为了让 OpenCode 给出最精准的代码，建议在消息中包含以下要素：
*   **具体文件**：使用 `@` 引用所有相关文件（如 `@api.ts @types.ts`），避免 AI 瞎猜。
*   **明确目标**：说清楚“要做什么”，而不是“帮我改下”。（例：“重构 request 函数，使用 async/await 替代 Promise”）。
*   **丰富上下文**：提供完整的错误信息（直接粘贴或拖入截图）、期望的运行结果。
*   **约束条件**：指定技术栈或代码风格（例：“请遵循项目现有的函数式编程风格”）。

### 10.5 调试与日志
如果遇到 OpenCode 自身运行异常，可以使用调试模式启动以查看详细日志：
```bash
# 开启 debug 级别日志并重定向到文件
opencode --log-level debug > opencode-debug.log
```
