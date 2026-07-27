---
title: Goose CLI
date: 2026-07-27
order: 2
---

# Goose CLI 使用指南

## 1. Goose 是什么

[GitHub Repo](https://github.com/aaif-goose/goose)

Goose（命令 `goose`）是一个运行在本机的开源 AI Agent。它以 Rust agent core 为主，同时提供 CLI、Desktop、API、MCP/ACP、sessions、recipes 和 headless automation，既能面向代码库读写文件、执行命令和运行测试，也可以扩展为通用工程自动化 Agent。

官方文档：

* https://goose-docs.ai/docs/quickstart
* https://goose-docs.ai/docs/getting-started/installation
* https://goose-docs.ai/docs/getting-started/providers
* https://goose-docs.ai/docs/guides/goose-cli-commands
* https://goose-docs.ai/docs/guides/config-files

> 截至 **2026-07-27**，GitHub 最新稳定 release 为 **v1.44.0（2026-07-23）**。当前 canonical repository 已从 `block/goose` 迁移到 `aaif-goose/goose`，项目采用 Apache-2.0，并由 Agentic AI Foundation（AAIF）托管。本文聚焦适合 Linux 服务器、SSH 和代码仓库工作的 Goose CLI，不展开 Electron Desktop。

### 1.1 Goose 适合什么场景

* 在终端内理解、修改和验证代码
* 通过自定义 API Key / Base URL 使用 OpenAI-compatible 或 Anthropic-compatible 模型
* 使用 GLM-5.2、Claude、OpenAI、Gemini、OpenRouter、Ollama 等不同 provider
* 用 MCP extensions 接入 GitHub、数据库、搜索和内部工具
* 把重复工作固化为 recipe，并通过 `goose run` 或 scheduler 自动执行
* 通过 ACP 接入 Zed 等客户端，或在受控网络内运行远程 Goose server

Goose 不是单纯的代码补全工具。启用 Developer extension 后，它可以直接执行 shell、编辑文件和删除文件，因此应把它视为一个高权限工程执行 Agent，而不是普通聊天客户端。

---

## 2. 安装与更新

### 2.1 Linux / macOS / WSL：官方 CLI 安装脚本

```bash
curl -fsSL https://github.com/aaif-goose/goose/releases/download/stable/download_cli.sh | bash
```

默认安装位置：

```text
~/.local/bin/goose
```

如果 `~/.local/bin` 不在 `PATH` 中：

```bash
printf '\nexport PATH="$HOME/.local/bin:$PATH"\n' >> ~/.bashrc
source ~/.bashrc
```

然后验证：

```bash
goose --version
goose --help
```

### 2.2 固定版本安装（服务器推荐）

生产服务器或长期 devbox 不建议每次自动跟随 `stable`。可以先下载并检查安装脚本，再固定版本执行：

```bash
curl -fsSLo /tmp/download_goose.sh \
  https://github.com/aaif-goose/goose/releases/download/v1.44.0/download_cli.sh

less /tmp/download_goose.sh
GOOSE_VERSION=v1.44.0 CONFIGURE=false bash /tmp/download_goose.sh
rm -f /tmp/download_goose.sh

goose --version
```

可选变量：

```text
GOOSE_BIN_DIR          自定义安装目录，默认 ~/.local/bin
GOOSE_VERSION          固定版本，例如 v1.44.0
CONFIGURE=false        安装后不自动进入交互配置
GOOSE_LINUX_VARIANT    standard / vulkan / musl
```

远程模型不需要本地 GPU，普通 Debian/Ubuntu 服务器使用默认 `standard` 即可。

### 2.3 Windows

Goose CLI 支持 Windows x86_64，也可以在 WSL2 中安装 Linux 版本。对于 shell、权限、Git 和开发工具链工作，优先使用 WSL2：

```bash
curl -fsSL https://github.com/aaif-goose/goose/releases/download/stable/download_cli.sh | bash
```

### 2.4 更新与检查

```bash
goose update
goose --version
goose doctor
goose info -v
```

`goose update` 会更新到新的稳定版本；需要严格 pin 版本时，重新执行带 `GOOSE_VERSION` 的安装流程，不要直接无条件更新。

---

## 3. 快速开始

### 3.1 配置模型

首次安装后运行：

```bash
goose configure
```

常见流程：

1. 选择 `Configure Providers`
2. 选择 provider，或添加 Custom Provider
3. 填写 API Key 和 Base URL
4. 选择模型
5. 配置 extensions

配置完成后检查：

```bash
goose info -v
goose doctor
```

### 3.2 在项目目录启动交互式会话

```bash
cd /path/to/your/project
goose session -n my-project
```

Developer extension 默认启用；也可以显式指定：

```bash
goose session -n my-project --with-builtin developer
```

建议进入会话后先切到审批模式：

```text
/mode approve
```

复杂任务先规划：

```text
/plan 阅读 AGENTS.md 和相关代码，定位认证失败的根因，先给出实施计划，不要修改文件。
```

确认计划后再要求实现，并明确验证命令：

```text
按计划实现。修改后运行项目现有的 lint、test 和 build；如果失败，读取真实输出并继续修复。
```

### 3.3 一次性任务

```bash
goose run -t "解释当前仓库的入口、核心模块和测试命令"
```

指定 provider、模型和最大轮数：

```bash
goose run \
  --provider zhipu \
  --model glm-5.2 \
  --max-turns 12 \
  -t "检查当前 git diff，只报告 correctness 和 security 问题"
```

不保存 session，并输出 JSON：

```bash
goose run \
  --no-session \
  --output-format json \
  --max-turns 8 \
  -t "总结当前项目的构建与测试入口"
```

### 3.4 Review 当前 Git diff

```bash
goose review --dry-run
goose review
goose review main...HEAD
```

`--dry-run` 只展示组装后的 review prompt 和 checks，不实际调用模型，适合先确认范围。

---

## 4. GLM-5.2 与自定义 Base URL

Goose v1.44.0 已在 release 内置 `zai` 与 `zhipu` provider，并显式登记 `glm-5.2`。其中：

* `zai`：Anthropic Messages-compatible
* `zhipu`：OpenAI Chat Completions-compatible
* `glm-5.2`：内置模型元数据登记 1,000,000 context，支持 streaming；`zhipu` 条目还标记 reasoning

Z.AI Coding Plan 官方端点：

| 协议 | Base URL |
| :--- | :--- |
| Anthropic Messages | `https://api.z.ai/api/anthropic` |
| OpenAI Chat Completions | `https://api.z.ai/api/coding/paas/v4` |

> 自建中转或聚合网关应填写其 API 根路径，不要把完整的 `/chat/completions` 再写入 Base URL；Goose 的 OpenAI-compatible provider 会追加对应请求路径。

### 4.1 方案 A：Anthropic-compatible（优先）

创建一个只允许当前用户读取的环境文件：

```bash
install -d -m 700 ~/.config/goose
umask 077
nano ~/.config/goose/provider.env
```

内容：

```bash
export GOOSE_PROVIDER="zai"
export GOOSE_MODEL="glm-5.2"
export ZHIPU_API_KEY="<YOUR_API_KEY>"
export ZAI_BASE_URL="https://api.z.ai/api/anthropic"
export GOOSE_MODE="approve"
export GOOSE_CLI_SHOW_THINKING=1
```

注意：`zai` provider 的 API Key 环境变量名当前仍是 `ZHIPU_API_KEY`。

加载并启动：

```bash
chmod 600 ~/.config/goose/provider.env
set -a
. ~/.config/goose/provider.env
set +a

cd /path/to/your/project
goose session -n glm-project
```

### 4.2 方案 B：OpenAI-compatible

```bash
install -d -m 700 ~/.config/goose
umask 077
nano ~/.config/goose/provider.env
```

内容：

```bash
export GOOSE_PROVIDER="zhipu"
export GOOSE_MODEL="glm-5.2"
export ZHIPU_API_KEY="<YOUR_API_KEY>"
export ZHIPU_BASE_URL="https://api.z.ai/api/coding/paas/v4"
export GOOSE_MODE="approve"
export GOOSE_CLI_SHOW_THINKING=1
```

如果使用自己的中转：

```bash
export ZHIPU_BASE_URL="https://your-gateway.example/v1"
```

加载配置并测试：

```bash
set -a
. ~/.config/goose/provider.env
set +a

goose run \
  --provider zhipu \
  --model glm-5.2 \
  --max-turns 4 \
  -t "只读检查当前目录，并说明它是不是 Git 仓库"
```

### 4.3 Custom Provider

如果网关使用非标准 provider 名称、额外 Header、独立模型表，运行：

```bash
goose configure
```

选择添加 Custom Provider，并填写：

* Provider Type：`OpenAI Compatible` 或 `Anthropic Compatible`
* Display Name：自定义名称
* API URL：API 根路径
* API Key：凭据
* Available Models：`glm-5.2`
* Streaming Support：按网关实际能力选择

Custom Provider 适合同时维护多个中转端点。不要把真实 key 写进可提交的项目配置或 recipe。

### 4.4 Context limit

Goose 内置的 GLM-5.2 已登记 1M context；如果使用自定义 provider 或网关导致模型元数据缺失，可以显式覆盖：

```bash
export GOOSE_CONTEXT_LIMIT=1000000
```

该值只是客户端声明，不能突破上游模型或网关的真实限制。若网关实际只允许更小窗口，应按真实限制填写。

---

## 5. CLI 常用命令与会话

### 5.1 常用命令

```bash
goose --help
goose --version
goose configure
goose info -v
goose doctor
goose session
goose run -t "..."
goose review
goose skills list
goose recipe list
goose schedule list
goose update
```

### 5.2 Session 管理

```bash
# 新会话
goose session -n my-project

# 列出会话
goose session list
goose session list --format json
goose session list --limit 10

# 恢复指定会话
goose session --resume -n my-project

# 恢复最近会话并显示历史
goose session --resume --history

# 从已有会话分叉
goose session --resume --fork --name my-project

# 导出为 Markdown
goose session export -n my-project -o my-project-session.md

# 导出完整 JSON 备份
goose session export -n my-project --format json -o my-project-session.json

# 生成诊断包
goose session diagnostics -n my-project
```

诊断包可能包含会话消息、系统信息、配置和日志。公开分享前必须检查并清理 API Key、私有代码和个人信息。

### 5.3 交互式 slash commands

进入 `goose session` 后常用：

```text
/help
/mode approve
/plan <任务>
/endplan
/compact
/builtin developer
/skills
/recipe ./recipe.yaml
/clear
/exit
```

权限模式：

| 模式 | 行为 | 建议 |
| :--- | :--- | :--- |
| `auto` | 自动执行工具和修改 | 仅用于已隔离环境 |
| `approve` | 写入和高风险工具先询问 | 首次使用推荐 |
| `smart_approve` | 低风险自动放行，其余询问 | 熟悉后可用 |
| `chat` | 只聊天，不调用工具 | 纯分析场景 |

> 官方当前默认是 `auto`。服务器上的代码仓库建议显式设置 `GOOSE_MODE=approve`，不要依赖默认值。

---

## 6. 配置、数据与项目规则

### 6.1 Linux 默认路径

```text
~/.config/goose/config.yaml       provider、model、extensions 和全局设置
~/.config/goose/permission.yaml   工具权限
~/.config/goose/secrets.yaml      无 keyring 时的明文凭据
~/.local/share/goose/             sessions.db、recipes 等数据
~/.local/state/goose/             日志与运行状态
```

检查真实路径：

```bash
goose info -v
```

### 6.2 Secret 保存

Goose 默认优先使用系统 keyring。无桌面 keyring 的 headless Linux、容器或 SSH 服务器可能自动 fallback 到：

```text
~/.config/goose/secrets.yaml
```

若需要强制 file-based storage：

```bash
GOOSE_DISABLE_KEYRING=1 goose configure
chmod 600 ~/.config/goose/secrets.yaml
```

更适合服务器的方式是用权限为 `0600` 的环境文件，在启动 Goose 前显式加载；不要把 API Key 放进：

* Git 仓库
* `AGENTS.md` / `.goosehints`
* recipe YAML
* shell command 参数
* issue、诊断包或公开日志

### 6.3 `config.yaml`

主配置路径：

```text
~/.config/goose/config.yaml
```

常见全局设置：

```yaml
GOOSE_MODE: "approve"
GOOSE_MAX_TURNS: 25
GOOSE_AUTO_COMPACT_THRESHOLD: 0.8
GOOSE_TELEMETRY_ENABLED: false
SECURITY_PROMPT_ENABLED: true
```

环境变量优先级高于 `config.yaml`。Provider API Key 不应写入 `config.yaml`；应使用 keyring、`secrets.yaml` 或环境变量。

### 6.4 `AGENTS.md` 与 `.goosehints`

Goose 默认读取：

```text
AGENTS.md
.goosehints
```

全局 hints：

```text
~/.config/goose/.goosehints
```

项目级 hints：

```text
/path/to/project/.goosehints
```

最小示例：

```markdown
先读取 AGENTS.md、README.md 和项目 manifest。

修改前检查 git status，不覆盖用户已有改动。

使用项目现有的 formatter、lint、test 和 build 命令完成验证。

不要 commit 或 push，除非用户明确要求。
```

默认 `CONTEXT_FILE_NAMES` 为：

```text
["AGENTS.md", ".goosehints"]
```

如果项目使用其他规则文件：

```bash
export CONTEXT_FILE_NAMES='["AGENTS.md","CLAUDE.md",".goosehints"]'
```

Goose 会从当前工作目录向 Git root 加载规则，并在访问子目录时发现嵌套规则。规则文件会占用 context，应保持简洁。

---

## 7. Extensions、MCP、Skills 与 Recipes

### 7.1 Built-in Extensions

常见内置 extension：

* `developer`：代码、文件和 shell 工具，默认启用
* `analyze`：代码结构、symbol 和 call graph 分析
* `skills`：发现与加载 skills
* `todo`：任务列表
* `summon`：知识源和 subagent delegation
* `memory`：记忆
* `computercontroller`：浏览器和桌面控制

启动时显式限制 extension：

```bash
goose session \
  --no-profile \
  --with-builtin developer \
  -n isolated-project
```

`--no-profile` 不加载默认 extensions，只使用 CLI 明确指定的 extension，适合最小权限任务。

### 7.2 临时加入 MCP Server

stdio MCP：

```bash
goose session \
  --with-extension "npx -y @modelcontextprotocol/server-memory"
```

Streamable HTTP MCP：

```bash
goose session \
  --with-streamable-http-extension "https://example.com/mcp"
```

不要把 token 直接写进命令行历史。需要凭据时，优先预先设置环境变量或通过 `goose configure` 管理。

### 7.3 Skills 与 Plugins

```bash
goose skills list

goose plugin install https://github.com/example/my-goose-plugin.git
goose plugin update my-goose-plugin
```

Git-backed plugins 默认存放在：

```text
~/.agents/plugins/<plugin-name>/
```

Plugin、skill 和 MCP 都可能影响 Agent 行为并执行本机代码。仅安装可信来源，更新前检查仓库、版本和权限变化。

### 7.4 Recipes

Recipe 把 instructions、prompt、provider/model、extensions、参数、重试和结构化输出固化为 YAML 工作流。

```bash
goose recipe list
goose recipe validate review.yaml
goose run --recipe review.yaml
goose run --recipe deploy-check.yaml --params environment=staging
goose run --recipe review.yaml --render-recipe
```

在交互会话中可将当前流程保存为 recipe：

```text
/recipe ./recipe.yaml
```

执行未知 recipe 前，先查看文件内容和渲染结果；recipe 可以携带 shell checks、extensions 和自动重试，不应把它当成纯提示词。

### 7.5 Scheduler

```bash
goose schedule add \
  --schedule-id daily-review \
  --cron "0 0 9 * * *" \
  --recipe-source ./recipes/daily-review.yaml

goose schedule list
goose schedule run-now --schedule-id daily-review
goose schedule sessions --schedule-id daily-review --limit 10
goose schedule remove --schedule-id daily-review
```

官方 scheduler 使用包含秒字段的 cron expression。无人值守任务必须限制 provider key、工作目录、extensions、turn limit 和外部副作用。

---

## 8. Headless、ACP 与远程访问

### 8.1 Headless automation

```bash
goose run \
  --no-session \
  --max-turns 10 \
  --max-tool-repetitions 3 \
  --output-format json \
  -t "运行测试并以 JSON 总结失败原因；不要修改文件"
```

长任务可使用 `stream-json`：

```bash
goose run \
  --output-format stream-json \
  --max-turns 20 \
  -i instructions.md
```

### 8.2 ACP stdio

```bash
goose acp
```

通常由 Zed 等 ACP client 自动启动，不需要用户手工常驻运行。

### 8.3 ACP server

默认绑定 `127.0.0.1:3284`，并要求 shared secret：

```bash
export GOOSE_SERVER__SECRET_KEY="$(openssl rand -hex 32)"
goose serve --host 127.0.0.1 --port 3284
```

远程使用优先通过 SSH tunnel：

```bash
ssh -L 3284:127.0.0.1:3284 user@server
```

不要直接公网暴露 Goose server，也不要使用：

```text
--dangerously-unauthenticated
```

除非它只服务于同机、可信且已隔离的客户端。

---

## 9. 安全与工程最佳实践

### 9.1 最小权限基线

```bash
export GOOSE_MODE=approve
export GOOSE_MAX_TURNS=25
export SECURITY_PROMPT_ENABLED=true
export GOOSE_TELEMETRY_ENABLED=false
```

建议：

* 使用普通用户，不以 root / sudo 运行 Goose
* 只在明确的 Git workspace 中启动
* 开始前运行 `git status --short`
* 个人修改先 stage/commit，Goose 修改保持 unstaged 便于 review
* 默认 `approve`，熟悉后再考虑 `smart_approve`
* 无需的 MCP、plugins、browser、memory extensions 不启用
* 不把主目录、SSH key、云凭据和生产配置整体暴露给 Agent
* push、deploy、数据库写入、包发布等外部副作用保留人工确认

### 9.2 推荐的代码任务提示词结构

```text
目标：修复 <具体问题>。

范围：只修改 <目录/文件>。

约束：先读取 AGENTS.md；不覆盖已有用户改动；不新增重量依赖。

验收：运行 <test/lint/build>，基于真实输出修复，最后展示 git diff 和验证结果。

禁止：不 commit、不 push、不部署、不访问 secrets，除非我另行授权。
```

### 9.3 自动化门禁

无人值守时至少设置：

```bash
--max-turns 10
--max-tool-repetitions 3
--no-profile
--with-builtin developer
```

同时：

* 使用 disposable branch/worktree
* 使用只读或最小权限 token
* 限制网络出口
* 对 recipe 做 `validate` 和 `--render-recipe`
* 对 JSON 输出做 schema/脚本级校验
* 不把“Agent 声称测试通过”当成真实测试证据

---

## 10. 排错

### 10.1 基础检查

```bash
goose --version
goose doctor
goose info -v
```

需要查看完整工具参数：

```bash
goose session --debug
goose run --debug -t "复现并解释当前错误"
```

### 10.2 Keyring / DBus 错误

Headless Linux 常见错误是没有 Secret Service / DBus keyring。可以改用环境变量，或强制 file-based secret storage：

```bash
GOOSE_DISABLE_KEYRING=1 goose configure
chmod 600 ~/.config/goose/secrets.yaml
```

### 10.3 401 / 403

检查：

* API Key 是否属于当前 endpoint
* Coding Plan key 与普通 API key 是否混用
* 环境文件是否已加载
* provider 使用的 key 变量名是否正确
* 中转是否要求额外 Header

不要用 `echo $API_KEY` 排查；使用只确认变量是否存在的方式：

```bash
test -n "${ZHIPU_API_KEY:-}" && echo "key is set" || echo "key is missing"
```

### 10.4 404 / Base URL 错误

OpenAI-compatible 通常填写 API 根路径，例如：

```text
https://api.z.ai/api/coding/paas/v4
https://gateway.example.com/v1
```

不要误写为：

```text
https://gateway.example.com/v1/chat/completions/chat/completions
```

先确认网关暴露的协议是 OpenAI Chat Completions、Anthropic Messages 还是 Responses API，再选择对应 provider。

### 10.5 模型能聊天但不能改代码

Goose 大量依赖 tool calling。检查：

* 模型是否支持 tool calls
* 网关是否完整透传 `tools` / `tool_choice`
* streaming tool-call arguments 是否被网关截断
* Developer extension 是否启用
* 当前是否处于 `chat` mode

用审批模式做最小测试：

```bash
GOOSE_MODE=approve goose run \
  --max-turns 4 \
  -t "读取当前目录的 README，只总结，不修改文件"
```

### 10.6 卡住或循环

按住 `Ctrl+C` 中断，拆小任务并限制轮数：

```bash
goose session --max-turns 20 --max-tool-repetitions 3
```

长上下文可在会话中：

```text
/compact
```

### 10.7 会话诊断

```bash
goose session list --limit 10
goose session diagnostics -n <session-name>
```

诊断文件可能包含私有对话和代码，公开提交 issue 前必须人工审查。

---

## 11. Linux 服务器推荐配置

最小目录：

```bash
install -d -m 700 ~/.config/goose
umask 077
nano ~/.config/goose/provider.env
chmod 600 ~/.config/goose/provider.env
```

推荐环境：

```bash
export GOOSE_PROVIDER="zai"
export GOOSE_MODEL="glm-5.2"
export ZHIPU_API_KEY="<YOUR_API_KEY>"
export ZAI_BASE_URL="https://api.z.ai/api/anthropic"
export GOOSE_MODE="approve"
export GOOSE_MAX_TURNS=25
export GOOSE_AUTO_COMPACT_THRESHOLD=0.8
export GOOSE_CLI_SHOW_THINKING=1
export GOOSE_TELEMETRY_ENABLED=false
export SECURITY_PROMPT_ENABLED=true
```

每次进入项目：

```bash
set -a
. ~/.config/goose/provider.env
set +a

cd /path/to/project
git status --short
goose doctor
goose session -n project-name --with-builtin developer
```

推荐推进顺序：

1. `chat` 或 `approve` 模式做只读问答
2. `approve` 模式做小范围修改和测试
3. 确认 provider/tool calling 稳定后再试 `smart_approve`
4. 最后才考虑 recipes、scheduler、remote ACP server 和无人值守执行

Goose 的优势是 provider-neutral、Rust-native、MCP/ACP 与自动化能力完整；安全边界则取决于权限模式、工作目录、extensions、凭据和人工 review。先立其制，再用其能。
