---
title: Claude Code
date: 2026-2-11
order: 4
---

# Claude Code 使用指南

## 1. Claude Code 是什么
[GitHub Repo](https://github.com/anthropics/claude-code)

Claude Code（命令 `claude`）是一个终端内的 Agent：读代码、改文件、执行命令、做 git 工作流。

官方文档：
* https://code.claude.com/docs/en/overview
* https://code.claude.com/docs/en/setup
* https://code.claude.com/docs/en/cli-reference

---

## 2. 安装与更新

> 官方说明：NPM 安装已标记为 deprecated，优先使用 Native 安装脚本 / Homebrew / WinGet。

### 2.1 macOS / Linux / WSL (推荐)
```bash
curl -fsSL https://claude.ai/install.sh | bash
```

### 2.2 Windows (推荐)
```powershell
irm https://claude.ai/install.ps1 | iex
```

WinGet (Windows)：

```powershell
winget install Anthropic.ClaudeCode
```

Homebrew (macOS/Linux)：

```bash
brew install --cask claude-code
```

NPM (Deprecated)：

```bash
npm install -g @anthropic-ai/claude-code
```

> Node.js 18+ 仅对 NPM 安装方式必需。

### 2.4 更新
```bash
claude update
```

> Homebrew/WinGet 安装不会自动更新：用 `brew upgrade claude-code` 或 `winget upgrade Anthropic.ClaudeCode`。

### 2.5 健康检查
```bash
claude -v
claude doctor
```

---

## 3. 快速开始

### 3.1 在项目目录启动
```bash
cd /path/to/your/project
claude
```

### 3.2 常用指令
```text
/init
/config
/permissions
/mcp
/compact
/rewind
```

### 3.3* 非官方中转 / 代理 API（LLM Gateway）

> 适用场景：企业网关 / 自建代理 / LiteLLM 等，把 Claude Code 的请求转发到你自己的网关。

#### A. 最小配置：鉴权 + Base URL

方式 1：环境变量（示例以 LiteLLM 的 Anthropic unified endpoint 为例）：

```bash
export ANTHROPIC_AUTH_TOKEN=sk-your-gateway-key
export ANTHROPIC_BASE_URL=https://litellm-server:4000
```

Windows PowerShell：

```powershell
$env:ANTHROPIC_AUTH_TOKEN="sk-your-gateway-key"
$env:ANTHROPIC_BASE_URL="https://litellm-server:4000"
```

方式 2：写进 `settings.json`（`/config` 里也可以改）：

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "sk-your-gateway-key",
    "ANTHROPIC_BASE_URL": "https://litellm-server:4000"
  }
}
```

> 网关侧要求：至少兼容 Anthropic Messages 端点（`/v1/messages`、`/v1/messages/count_tokens`），并正确转发 `anthropic-beta` / `anthropic-version` 等头；否则部分功能可能不可用。

#### B. 兼容性开关（常见）

当网关对 `anthropic-beta` 头不兼容时：

```bash
export CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS=1
```

#### C. Provider pass-through（按需）

Bedrock via gateway（示例为 LiteLLM pass-through）：

```bash
export ANTHROPIC_BEDROCK_BASE_URL=https://litellm-server:4000/bedrock
export CLAUDE_CODE_SKIP_BEDROCK_AUTH=1
export CLAUDE_CODE_USE_BEDROCK=1
```

Vertex via gateway（示例为 LiteLLM pass-through）：

```bash
export ANTHROPIC_VERTEX_BASE_URL=https://litellm-server:4000/vertex_ai/v1
export ANTHROPIC_VERTEX_PROJECT_ID=your-gcp-project-id
export CLOUD_ML_REGION=us-east5
export CLAUDE_CODE_SKIP_VERTEX_AUTH=1
export CLAUDE_CODE_USE_VERTEX=1
```

---

## 4. 交互基础（核心用法）

### 4.1 `@file` 引用文件
在输入中用 `@` 触发路径补全并引用文件。

### 4.2 `!cmd` 直接跑命令
在输入行以 `!` 开头执行命令并把输出带入上下文：

```text
!git status
!npm test
```

### 4.3 会话续跑
```bash
claude -c
claude -r "session-id-or-name" "prompt"
```

---

## 5. 配置体系（settings / 作用域）

Claude Code 的设置有 scope，优先级：Managed > CLI args > Local > Project > User。

### 5.1 Settings 文件
| Scope | 文件 | 说明 |
| :--- | :--- | :--- |
| User | `~/.claude/settings.json` | 个人全局设置 |
| Project | `.claude/settings.json` | 团队共享（建议提交 git） |
| Local | `.claude/settings.local.json` | 个人覆盖（通常 gitignore） |
| Managed | `managed-settings.json` | 组织级强制策略（系统目录下发） |

### 5.2 状态与 MCP
* `~/.claude.json`：偏好、OAuth 会话、用户/本地 MCP、每项目状态与缓存等。
* `.mcp.json`：项目级 MCP（适合提交 git）。

### 5.3 记忆文件 (CLAUDE.md)
* 项目：`CLAUDE.md` 或 `.claude/CLAUDE.md`
* 本地：`CLAUDE.local.md`

---

## 6. 权限控制（最小模板）

在项目内创建 `.claude/settings.json`：

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(pnpm *)",
      "Bash(yarn *)",
      "Bash(git status)",
      "Bash(git diff *)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)"
    ]
  }
}
```

---

## 7. MCP（模型上下文协议）

常用命令：

```bash
claude mcp list
claude mcp get github
claude mcp remove github
```

添加远程 HTTP server：

```bash
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

添加本地 stdio server：

```bash
claude mcp add --transport stdio airtable --env AIRTABLE_API_KEY=YOUR_KEY \
  -- npx -y airtable-mcp-server
```

---

## 8. Skills / Agents / Rules

### 8.1 Skills（技能系统）

技能文件：`.claude/skills/<skill-name>/SKILL.md`（项目级）或 `~/.claude/skills/<skill-name>/SKILL.md`（全局）。

最小模板：

```markdown
---
name: review
description: Review changes with a strict checklist
disable-model-invocation: true
---

1. 运行 `!git diff` 并总结风险点。
2. 检查是否有 secrets / 破坏性变更。
3. 给出可执行的修复建议。
```

使用：在 Claude Code 里输入 `/review`。

> 兼容说明：旧的 `.claude/commands/*.md` 仍可用；同名 skill 会优先于 command。

### 8.2 Subagents（子代理）

`/agents` 管理子代理（Project: `.claude/agents/`，User: `~/.claude/agents/`）。内置常用：Explore（只读搜索）、Plan（plan mode 辅助）。

最小示例：

```markdown
---
name: code-reviewer
description: Proactively review code for quality and security
tools: Read, Glob, Grep, Bash
model: sonnet
---

Review changes. Focus on security, correctness, and edge cases.
```

### 8.3 Rules / Memory（CLAUDE.md + .claude/rules）

启动时加载 `CLAUDE.md`（含 `~/.claude/CLAUDE.md`），并加载 `.claude/rules/*.md` 作为模块化规则。

常用结构：

```text
./CLAUDE.md
./CLAUDE.local.md
./.claude/CLAUDE.md
./.claude/rules/*.md
~/.claude/CLAUDE.md
```

路径规则（可选）：

```markdown
---
paths:
  - "src/api/**/*.ts"
---

- API 统一返回结构 ...
```

### 8.4 Hooks / Plugins（可选）

Hooks：用 `/hooks` 配置，写入 `settings.json` 的 `hooks` 字段；常用于格式化、阻止危险命令、在 compaction 后补充上下文。

Plugins：用于打包分发 skills/agents/hooks/MCP。
* 入口：插件目录下 `.claude-plugin/plugin.json`
* 本地调试：`claude --plugin-dir ./my-plugin`

---

## 9. 常用 CLI 形态（速查）

```bash
claude                 # 交互式 REPL
claude "query"        # 带初始 prompt 进入 REPL
claude -p "query"     # 只打印结果（适合脚本）
cat file | claude -p "query"
```

---

## 10. 常用环境变量（速查）

这些也可以写进 `settings.json` 的 `env` 字段。

| 变量 | 用途 |
| :--- | :--- |
| `ANTHROPIC_API_KEY` | API Key（`X-Api-Key`） |
| `ANTHROPIC_AUTH_TOKEN` | Bearer token（`Authorization`） |
| `ANTHROPIC_BASE_URL` | LLM gateway / 代理 base URL（Anthropic Messages 格式） |
| `ANTHROPIC_CUSTOM_HEADERS` | 给所有请求追加自定义 HTTP header |
| `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` | 代理配置 |
| `DISABLE_AUTOUPDATER=1` | 关闭自动更新 |
| `CLAUDE_CONFIG_DIR` | 自定义配置与数据目录 |
| `MCP_TIMEOUT` / `MCP_TOOL_TIMEOUT` | MCP 启动/执行超时（ms） |
| `MAX_MCP_OUTPUT_TOKENS` | MCP 输出 token 上限 |
| `ENABLE_TOOL_SEARCH` | MCP tool search（`auto`/`auto:N`/`true`/`false`） |
| `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` | 禁用后台任务 |
| `CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION=false` | 关闭输入框提示补全 |
| `BASH_DEFAULT_TIMEOUT_MS` / `BASH_MAX_TIMEOUT_MS` | Bash 默认/最大超时（ms） |

---

## 11. Windows 备注

* 原生 Windows 运行：官方建议使用 Git Bash 或 WSL。
* Git Bash 路径可用环境变量指定：

```powershell
$env:CLAUDE_CODE_GIT_BASH_PATH="C:\Program Files\Git\bin\bash.exe"
```

* 本地 MCP 若依赖 `npx`，可能需要 `cmd /c` 包一层（详见 MCP 文档 Windows Warning）。
