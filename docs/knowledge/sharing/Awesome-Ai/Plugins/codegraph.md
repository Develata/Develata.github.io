---
title: CodeGraph
date: 2026-07-14
order: 7
---

# CodeGraph 使用指南

> 信息来源：`colbymchenry/codegraph` 仓库 README、官方文档站、以及参考分析页：`https://develata.me/Repo-AI-Analysis/analysis/ai-programs/agent-infrastructure/codegraph`。

## 1. CodeGraph 是什么

[Github Repo](https://github.com/colbymchenry/codegraph)

CodeGraph 是一个面向 AI 编码代理的本地代码知识图谱工具。它用 tree-sitter 解析代码，把符号、调用关系、导入关系、继承关系、路由关系与文件结构写入项目本地的 SQLite 数据库，再通过 MCP、CLI 和 TypeScript API 暴露给 Claude Code、Cursor、Codex CLI、OpenCode、Hermes Agent 等工具。

核心目标不是替代 `rg`、`grep` 或 IDE 跳转，而是减少 AI agent 在大型仓库里反复 `Glob -> Grep -> Read` 的探索成本：

* 结构化检索：按符号、调用边、依赖边、文件结构查询，而不是只做文本匹配。
* 上下文构建：一次查询返回相关入口、调用方、被调用方和代码片段。
* 影响分析：修改某个符号前，先看调用半径和潜在影响面。
* 调用链追踪：回答“X 如何到达 Y”这类跨文件流程问题。
* 本地优先：索引在 `.codegraph/` 下，本身不需要 API key 或外部服务。

> 简单说：CodeGraph 把“代码库探索”从临时搜索变成预索引查询。对小仓库收益有限；对中大型、多语言、跨模块仓库，收益会明显变大。

---

## 2. 适合什么场景

适合：

* 让 Claude Code / Codex / Cursor 快速回答架构问题。
* 在大仓库中定位符号定义、调用方、被调用方。
* 重构前做影响面分析。
* 排查跨层调用链，例如 request -> route -> handler -> service -> repository。
* 让 agent 少开探索子代理、少读无关文件。
* CI 或 pre-commit 中用 `codegraph affected` 粗筛受影响测试。

不适合：

* 只查一段固定字符串：直接用 `rg` 更简单。
* 代码库很小：原生搜索成本已经很低。
* 需要类型检查器级别的完整语义证明：CodeGraph 基于 AST 与启发式解析，不等价于 Rust analyzer、TypeScript compiler 或 JVM 静态分析器。
* 频繁处理生成文件、vendor、大型 bundle：应先用 `.gitignore` 排除，否则索引噪声会变大。

---

## 3. 安装、连接 Agent 与初始化

### 3.1 安装 CLI

macOS / Linux：

```bash
curl -fsSL https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.sh | sh
```

Windows PowerShell：

```powershell
irm https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.ps1 | iex
```

如果已有 Node.js，也可以安装全局 npm 包：

```bash
npm i -g @colbymchenry/codegraph
```

这一步只把 `codegraph` CLI 放到 `PATH`，**不会连接 Agent，也不会为项目建立索引**。独立安装脚本不会刷新当前 shell；完成后请打开一个新终端，再进行下一步。

### 3.2 连接常用 Agent（不可省略）

在新终端运行：

```bash
codegraph install
```

安装器会检测并配置 Claude Code、Cursor、Codex CLI、OpenCode、Hermes Agent、Gemini CLI、Antigravity IDE 与 Kiro，把 CodeGraph MCP server 接入所选 Agent。**安装 CLI 本身不等于接入 MCP；真正完成连接的是 `codegraph install`。**

这个命令只负责 Agent wiring，不会索引任何代码。完成后重启对应 Agent，使新的 MCP 配置生效。

如果已有 Node.js，也可以用下面的快捷方式下载并直接运行安装器：

```bash
npx @colbymchenry/codegraph
```

### 3.3 初始化项目索引

在项目根目录执行：

```bash
cd /path/to/your/project
codegraph init
```

`codegraph init` 会创建项目本地的 `.codegraph/`，并在同一步构建完整代码图。全局的 `codegraph install` 通常只需执行一次；每个项目分别执行一次 `codegraph init`。

### 3.4 检查与同步

检查状态：

```bash
codegraph status
```

初始化后默认启用自动同步，文件变更会被持续写入图中。若刚修改的符号暂时查不到，先等待文件监听完成；必要时再手动触发增量同步：

```bash
codegraph sync
```

### 3.5 卸载

只移除 Agent wiring、保留 CLI：

```bash
codegraph uninstall --keep-cli
```

若连 CLI 也要卸载，运行 `codegraph uninstall`。只移除当前项目的 `.codegraph/` 初始化信息：

```bash
codegraph uninit
```

> 注意：卸载 Agent wiring 或 CLI 不会自动删除项目索引；项目内索引需另行执行 `codegraph uninit`。

---

## 4. 手动配置 MCP（可选）

如果你不想使用交互式安装器，可以手动把 CodeGraph 挂到 Claude Code。

安装：

```bash
npm install -g @colbymchenry/codegraph
```

在 `~/.claude.json` 中加入：

```json
{
  "mcpServers": {
    "codegraph": {
      "type": "stdio",
      "command": "codegraph",
      "args": ["serve", "--mcp"]
    }
  }
}
```

可选：在 `~/.claude/settings.json` 中放行常用工具：

```json
{
  "permissions": {
    "allow": [
      "mcp__codegraph__codegraph_search",
      "mcp__codegraph__codegraph_context",
      "mcp__codegraph__codegraph_callers",
      "mcp__codegraph__codegraph_callees",
      "mcp__codegraph__codegraph_impact",
      "mcp__codegraph__codegraph_node",
      "mcp__codegraph__codegraph_explore",
      "mcp__codegraph__codegraph_files",
      "mcp__codegraph__codegraph_status"
    ]
  }
}
```

---

## 5. 工作原理

CodeGraph 的核心流水线可以拆成四步：

1. 解析：用 tree-sitter 对源文件建 AST。
2. 抽取：从 AST 中抽取函数、类、方法、类型、组件、路由等节点，以及调用、导入、继承、引用等边。
3. 存储：写入 `.codegraph/codegraph.db`，底层是 SQLite，并带 FTS5 全文检索。
4. 同步：MCP server 监听文件变化，对源文件做增量更新。

这套设计的关键点是“确定性结构索引”，不是 LLM 总结。它不会把你的代码上传到远端，也不会依赖模型 embedding；因此隐私边界比较清楚，失败模式也更接近传统静态分析工具。

---

## 6. MCP 工具速查

| 工具 | 适用问题 | 建议用法 |
| --- | --- | --- |
| `codegraph_context` | “这个功能/模块大概怎么工作？” | 适合交给 Explore agent 做大范围探索；会返回较多上下文 |
| `codegraph_explore` | “展示这几个相关符号的源码” | 适合交给 Explore agent 批量拿源码片段，避免主会话上下文膨胀 |
| `codegraph_search` | “名为 X 的符号在哪里？” | 按符号名检索定义 |
| `codegraph_callers` | “谁调用了 X？” | 单跳向上追踪 |
| `codegraph_callees` | “X 调用了谁？” | 单跳向下追踪 |
| `codegraph_impact` | “改 X 会影响什么？” | 重构前先看影响半径 |
| `codegraph_node` | “给我 X 的签名/源码” | 精确查看单个符号 |
| `codegraph_files` | “索引里有哪些文件？” | 比文件系统扫描更贴近索引状态 |
| `codegraph_status` | “索引健康吗？” | 查节点数、边数、语言、数据库状态 |

### 6.1 推荐使用方式

Claude Code 的官方安装器会写入一条重要规则：主会话不要直接调用 `codegraph_context` / `codegraph_explore` 做大范围探索，因为它们可能返回大量源码并挤占主上下文。更稳妥的分工是：

* 主会话：使用 `codegraph_search`、`codegraph_callers`、`codegraph_callees`、`codegraph_impact`、`codegraph_node` 做轻量定位与改动前检查。
* Explore agent：使用 `codegraph_context` / `codegraph_explore` 做模块理解、源码展开和跨文件探索。

理解模块（交给 Explore agent）：

```text
codegraph_context -> codegraph_explore
```

查符号定义：

```text
codegraph_search -> codegraph_node
```

查调用流：

```text
codegraph_callers / codegraph_callees / codegraph_impact
```

评估重构风险：

```text
codegraph_impact -> 必要时 codegraph_callers / codegraph_callees
```

排查索引问题：

```text
codegraph_status -> codegraph_files -> CLI: codegraph sync
```

> 关键习惯：如果 `.codegraph/` 已存在，结构性问题优先使用 CodeGraph。主会话先用轻量工具定位；需要读大量源码时，再让 Explore agent 以 CodeGraph 为主工具展开。

---

## 7. CLI 速查

| 命令 | 用途 |
| --- | --- |
| `codegraph` | 运行交互式安装器 |
| `codegraph install` | 显式运行安装器 |
| `codegraph uninstall [--keep-cli]` | 移除 Agent wiring；默认连 CLI 一并移除，`--keep-cli` 保留 CLI |
| `codegraph init [path]` | 初始化项目并在同一步构建完整代码图 |
| `codegraph uninit [path]` | 移除项目初始化 |
| `codegraph index [path]` | 全量索引；可配 `--force` |
| `codegraph sync [path]` | 增量同步 |
| `codegraph status [path]` | 查看统计与健康状态 |
| `codegraph query <search>` | 搜索符号；支持 `--kind`、`--limit`、`--json` |
| `codegraph files [path]` | 查看索引文件结构 |
| `codegraph context <task>` | 为任务构建上下文 |
| `codegraph callers <symbol>` | 查调用方 |
| `codegraph callees <symbol>` | 查被调用方 |
| `codegraph impact <symbol>` | 查影响半径 |
| `codegraph affected [files...]` | 根据改动文件推导受影响测试 |
| `codegraph serve --mcp` | 启动 MCP server |

### 7.1 CLI 示例

按名称查符号：

```bash
codegraph query UserService --kind class --limit 10
```

为任务构建上下文：

```bash
codegraph context "fix login redirect bug" --max-nodes 20
```

查影响面：

```bash
codegraph impact UserService --depth 2
```

查受影响测试：

```bash
git diff --name-only | codegraph affected --stdin --quiet
```

---

## 8. `codegraph affected`：用于测试选择

`codegraph affected` 会沿导入依赖做传递追踪，尝试找出受某些源文件影响的测试文件。

直接传文件：

```bash
codegraph affected src/utils.ts src/api.ts
```

从 git diff 读取：

```bash
git diff --name-only | codegraph affected --stdin
```

指定测试文件匹配：

```bash
codegraph affected src/auth.ts --filter "e2e/*"
```

一个最小 CI/hook 思路：

```bash
AFFECTED=$(git diff --name-only HEAD | codegraph affected --stdin --quiet)
if [ -n "$AFFECTED" ]; then
  npx vitest run $AFFECTED
fi
```

> 这类测试选择只能作为加速手段，不应替代关键分支上的全量测试。依赖注入、反射、运行时注册、字符串路由等动态机制可能降低静态追踪的完备性。

---

## 9. 支持语言与框架路由

官方文档说明：语言支持按扩展名自动识别，无需逐语言配置。

当前主要支持：

* TypeScript / JavaScript
* Python
* Go
* Rust
* Java
* C# / PHP / Ruby
* C / C++
* Swift / Kotlin / Scala / Dart
* Vue / Svelte
* Liquid
* Pascal / Delphi
* Lua / Luau

框架路由方面，CodeGraph 会把路由文件识别成 `route` 节点，并把路由与处理函数或控制器建立引用边。典型覆盖包括：

* Django / Flask / FastAPI
* Express / NestJS
* Laravel / Drupal / Rails
* Spring
* Gin / chi / gorilla / mux
* Axum / actix / Rocket
* ASP.NET / Vapor
* React Router / SvelteKit

这对 Web 项目很实用：你问“哪个 URL 会打到这个 handler”，或者“这个 controller 被哪些 route 绑定”，CodeGraph 比纯文本搜索更稳定。

---

## 10. 配置与索引边界

CodeGraph 主打零配置。实际规则可以理解为：

* 支持语言由文件扩展名决定。
* Git 仓库中会尊重 `.gitignore`。
* 非 Git 项目也会读取 `.gitignore`。
* `node_modules`、构建输出、`.env` 等只要被 git ignore，通常不会进入索引。
* 大于 1 MB 的文件会跳过，避免 bundle、minified 文件和 vendored blob 浪费解析成本。

建议：

* 把不希望进入索引的目录写入 `.gitignore`。
* 如果项目提交了 `vendor/`、`dist/`、生成代码或大型快照文件，要主动排除。
* 不要把 `.codegraph/` 提交到 Git；它是本地索引产物。

---

## 11. 在 Agent 中怎么提问

CodeGraph 的收益很大程度取决于 prompt 是否让 agent 直接使用结构化工具。

### 11.1 好的问法

架构理解：

```text
派一个 Explore agent：这个项目已经初始化 CodeGraph，请优先使用 codegraph_context / codegraph_explore 定位 RSS 生成流程，说明数据从配置到输出文件的路径。
```

调用链追踪：

```text
用 codegraph_callers / codegraph_callees / codegraph_impact 分析 saveArticle 到 db.insert 附近的调用流，不要先用 grep 重建调用链。
```

重构前评估：

```text
修改 buildSidebar 前，先用 codegraph_impact 看影响面，再给出最小改动方案。
```

符号定位：

```text
用 codegraph_search 找 createGameComponent 的定义和调用点。
```

### 11.2 不好的问法

```text
全仓库搜一下这个功能怎么实现的。
```

问题在于它会诱导 agent 回到 `rg + Read` 的文件探索路径。更好的写法是明确“先用 CodeGraph 的结构工具定位”。

---

## 12. 常见问题

### 12.1 Agent 仍然在反复 grep/read

检查两点：

1. 项目根目录是否存在 `.codegraph/`。
2. agent 的全局/项目指令里是否明确写了“结构性问题优先用 CodeGraph”。

如果只是装了 MCP，但没有写入行为指令，模型可能仍按旧习惯调用文件搜索。

### 12.2 提示 `CodeGraph not initialized`

在项目根执行：

```bash
codegraph init
```

### 12.3 新增符号查不到

先等几秒。文件监听有 debounce；如果仍不更新：

```bash
codegraph sync
codegraph status
```

### 12.4 索引慢

优先检查 `.gitignore`。如果 `node_modules`、`dist`、`vendor`、生成文件没有被排除，索引会变慢且噪声增多。

### 12.5 MCP server 连不上

逐步确认：

```bash
codegraph status
codegraph serve --mcp
```

再检查对应 agent 的 MCP 配置里 `command` 是否能在 PATH 中找到。

### 12.6 SQLite `database is locked`

官方 README 提到，新版本使用 WAL 模式以降低并发读写阻塞。如果仍遇到：

* 先升级到最新版。
* 用 `codegraph status` 检查 journal 模式。
* 避免把项目和 `.codegraph/` 放在网络盘或 WSL2 `/mnt` 这类文件系统上。

---

## 13. 我的建议配置

### 13.1 个人机器

推荐：

```bash
npx @colbymchenry/codegraph
```

安装时选择全局配置常用 agent，然后每个项目单独执行：

```bash
codegraph init
```

这样 MCP 配置只做一次，索引仍保持项目本地。

### 13.2 团队项目

不建议把 `.codegraph/` 入库。更稳妥的方式是：

* 在项目 `AGENTS.md` / `CLAUDE.md` 中写明：若存在 `.codegraph/`，结构性问题优先使用 CodeGraph。
* 在 onboarding 文档里加一条：`codegraph init`。
* 对大型仓库，统一 `.gitignore`，避免每个人索引无关目录。

### 13.3 本仓库这类 VitePress + Vue 项目

适合使用 CodeGraph 的问题：

* “某个 VitePress 配置项如何影响主题组件？”
* “某个游戏组件的核心状态从哪里更新？”
* “RSS 生成逻辑从 config 到输出文件怎么走？”
* “改 sidebar 工具函数会影响哪些模块？”

不必使用 CodeGraph 的问题：

* 查某个 Markdown 标题。
* 查固定文本、链接、frontmatter 字段。
* 单文件小改动。

---

## 14. 参考链接

```text
https://github.com/colbymchenry/codegraph
https://colbymchenry.github.io/codegraph/
https://colbymchenry.github.io/codegraph/getting-started/introduction/
https://colbymchenry.github.io/codegraph/reference/languages/
https://develata.me/Repo-AI-Analysis/analysis/ai-programs/agent-infrastructure/codegraph
```
