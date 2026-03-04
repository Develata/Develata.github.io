---
title: Oh My OpenCode
date: 2026-03-02
order: 5
---

# Oh My OpenCode (OMO) 使用指南

## 1. OMO 是什么
[Github Repo](https://github.com/code-yeongyu/oh-my-opencode)

Oh My OpenCode（OMO）不是独立 IDE，也不是新命令行工具。它是 OpenCode 的增强层：你仍然使用 `opencode`，但获得一套多代理、多模型、可编排的工程工作流。

核心能力：

* 用“规划 -> 执行”拆分复杂任务，提升可控性与闭环率。
* 支持 `ulw`（ultrawork）冲刺模式，少指挥、多自动。
* 提供可验证编辑（`LINE#ID`），降低 stale-line 误改风险。
* 支持后台并行（检索/调研/实现可并行推进）。
* 内置 MCP 生态`websearch`（Exa）- 实时网页检索、`context7` - 官方文档检索、`grep_app` - GitHub 代码搜索。

---

## 2. 安装与初始化

> 注意：安装后仍然使用 `opencode` 启动，不存在 `omo` 命令。

### 2.1 一键安装（推荐）

把下面提示词直接贴给你的 Agent（Claude Code/Cursor/AmpCode 等）：

```text
Install and configure oh-my-opencode by following the instructions here:
https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/refs/heads/dev/docs/guide/installation.md
```

### 2.2 手动安装或更新（回退）

```bash
bunx oh-my-opencode@latest install
# 或
npx oh-my-opencode@latest install
```

### 2.3 初始化项目上下文（项目根目录）

```text
/init-deep
```

它会按目录层级生成 `AGENTS.md`，用于在大仓库中提供就近上下文约束。

### 2.4 安装后验证

```bash
opencode --version
```

并检查 `~/.config/opencode/opencode.json` 的 `plugin` 数组是否包含 `oh-my-opencode`。

### 2.5 配置模型

编辑文件`xxx/.config/opencode/oh-my-opencode.json`

---

## 3. 5 分钟快速上手（Happy Path）

### 3.1 启动与初始化

```bash
cd /path/to/your/project
opencode
```

进入 TUI 后执行：

```text
/init-deep
```

### 3.2 选一种执行模式

模式 A：冲刺（`ulw`）

```text
帮我把这个页面的深色模式适配一下，顺便补齐测试，ulw
```

模式 B：先规划后执行（Prometheus + Atlas）

1. 按 `Tab` 进入 Prometheus 访谈式规划
2. 规划确认后执行：

```text
/start-work
```

> 注意：复杂任务请写清楚边界与验收条件，否则规划容易发散、执行容易中断。

---

## 4. 工作流与指令（速查）

### 4.1 触发类型

* 关键词触发：`ulw` / `ultrawork`
* prompt 触发：`@plan`
* slash 命令：`/init-deep`、`/start-work` 等

### 4.2 常用指令表

| 命令/触发 | 类型 | 用途 | 最小用法 | 常见误用 |
| --- | --- | --- | --- | --- |
| `ulw` / `ultrawork` | 关键词 | 自动化冲刺执行 | `修复 X 并补测，ulw` | 把它当 slash 命令 |
| `@plan` | prompt | 复杂任务先规划 | `@plan 重构鉴权模块并保持行为不变` | 不给边界与验收 |
| `/init-deep` | slash | 新项目接入 OMO | `/init-deep` | 不在仓库根（或子目录）执行 |
| `/start-work` | slash | 按计划执行闭环 | `/start-work` | 没有计划就直接执行 |
| `/ulw-loop` | slash | ultrawork + 循环推进 | `/ulw-loop "批量修复 lint + type 错误"` | 用在小任务上导致过度开销 |
| `/ralph-loop` | slash | 长任务持续推进 | `/ralph-loop "迁移旧接口到新 SDK"` | 目标不清晰就开循环 |
| `/cancel-ralph` | slash | 停止 ralph 循环 | `/cancel-ralph` | 以为会停止所有机制 |
| `/stop-continuation` | slash | 停止 continuation 机制 | `/stop-continuation` | 以为会撤销已完成修改 |
| `/refactor` | slash | 结构化重构入口 | `/refactor src/auth --strategy=safe` | 把功能新增当重构任务 |
| `/handoff` | slash | 跨会话交接 | `/handoff` | 只写一句话，没带上下文 |

### 自定义命令
自定义 Slash 命令可从以下位置加载：

`.opencode/command/*.md`（项目）
`~/.config/opencode/command/*.md`（用户）
`.claude/commands/*.md`（Claude Code 兼容）
`~/.claude/commands/*.md`（Claude Code 用户）

---

## 5. 配置与文件（你要改哪里）

### 5.1 常见配置位置

* 项目级：`.opencode/oh-my-opencode.jsonc`
* 用户级：`~/.config/opencode/oh-my-opencode.jsonc`

另外，OpenCode 自身插件列表在：`~/.config/opencode/opencode.json`（用于确认 `oh-my-opencode` 是否被加载）。

### 5.2 最小配置示例

```jsonc
{
  "agents": {
    "sisyphus": { "model": "anthropic/claude-opus-4-6" },
    "hephaestus": { "model": "openai/gpt-5.3-codex" }
  },
  "categories": {
    "visual-engineering": { "model": "google/gemini-3-pro" },
    "quick": { "model": "anthropic/claude-haiku-4-5" }
  }
}
```

字段含义（只记两点即可）：

* `agents`：为具体 Agent 指定模型（编排/执行/检索等角色）。
* `categories`：为任务类别指定默认模型（例如 `visual-engineering`）。

### 5.3 关键文件怎么用

| 路径 | 谁生成/谁维护 | 用途 | 常见误用 |
| --- | --- | --- | --- |
| `AGENTS.md`（分层） | `/init-deep` 生成 | 给 agent 提供“就近上下文约束”，减少上下文污染 | 以为它会自动更新业务规则 |
| `.opencode/oh-my-opencode.jsonc` | 你维护（项目级） | 团队共享的 OMO 路由/模型覆盖 | 提交了本地密钥或私密模型名 |
| `~/.config/opencode/oh-my-opencode.jsonc` | 你维护（用户级） | 个人偏好覆盖（不影响仓库） | 用用户级配置覆盖掉团队约束 |
| `~/.config/opencode/opencode.json` | OpenCode 维护 | OpenCode 全局配置；用于确认插件已加载 | 把 OMO 配置写进这里导致难以迁移 |

---

## 6. 模型路由

OMO 的重点是“任务语义路由”，而不是“手动切模型”。常见角色如下：

| 代理/类别                 | 核心职责                                                           |
| --------------------- | -------------------------------------------------------------- |
| **Sisyphus（总控）**          | 默认总编排器：规划、拆解、并行委派子任务并执行闭环（todo 驱动，强并发）。                        |
| **Hephaestus（执行）**        | 深度自主实现：复杂调试、架构落地、端到端完成任务（“深度模式/工匠”）。                           |
| **Oracle（分析推理）**            | 架构决策/代码审查/疑难 Debug 咨询：只读分析，给高质量推理建议。                           |
| **Librarian（资料库）**         | 多仓库/文档/开源实现检索与对比：证据驱动的解释与定位。                                   |
| **Explore（代码库）**           | 快速扫代码库、grep/上下文定位：为主 Agent 提供“快而准”的线索。                         |
| **Multimodal-Looker（眼睛）** | 视觉内容专家：分析 PDF / 图片 / 图表 / 截图提取信息（只读）。                          |
| **Prometheus（需求访谈）**        | 访谈式规划：通过迭代提问产出可执行的详细计划。                                        |
| **Metis（规划）**             | 计划顾问（pre-planning）：挖掘隐藏意图、歧义、潜在失败点。                            |
| **Momus（挑刺）**             | 计划审稿人：按清晰度/可验证性/完整性标准“挑刺”与校验。                                  |
| **Atlas（团队管理）**             | todo-list 执行编排：按计划逐项推进、管理 todo 并协调执行（自身不再委派）。                  |
| **Sisyphus-Junior（临时工）**   | 被 `task(category=...)` 生成的执行体：模型随 category 自动选择；禁止再次委派，防止无限递归。 |


默认模型映射（来自 OMO `features`[文档](https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/dev/docs/reference/features.md) ，建议先按默认跑通）：

| Agent                 | 推荐模型（默认/备选）                                                                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sisyphus**          | `claude-opus-4-6`（Fallback：`gpt-5.3-codex` → deep quality chain）                                                                                                                    |
| **Hephaestus**        | `gpt-5.3-codex`（Fallback：deep quality chain：`claude-opus-4-6-thinking` → `step-3.5-flash` → `glm-5` → …）                                                                            |
| **Oracle**            | `gpt-5.3-codex`（Fallback：`claude-opus-4-6-thinking` → `claude-sonnet-4-5-thinking` → deep quality chain）                                                                            |
| **Librarian**         | `claude-sonnet-4-5`（Fallback：speed chain：`claude-haiku-4-5` → `gpt-5-mini` → … → quality chain）                                                                                     |
| **Explore**           | `claude-haiku-4-5`（Fallback：`oswe-vscode-prime` → `gpt-5-mini` → `gpt-4.1` → extended speed chain）                                                                                  |
| **Multimodal-Looker** | `gemini-3-pro-image`（Fallback：`gemini-3-pro-high` → `gemini-3-flash` → `kimi-k2.5` → `claude-opus-4-6-thinking` → `claude-sonnet-4-5-thinking` → `claude-haiku-4-5` → `gpt-5-nano`） |
| **Prometheus**        | `claude-opus-4-6-thinking`（Fallback：`gpt-5.3-codex` → `claude-sonnet-4-5-thinking` → deep quality chain）                                                                            |
| **Metis**             | `claude-opus-4-6-thinking`（Fallback：`gpt-5.3-codex` → `claude-sonnet-4-5-thinking` → deep quality chain）                                                                            |
| **Momus**             | `gpt-5.3-codex`（Fallback：`claude-opus-4-6-thinking` → deep quality chain）                                                                                                           |
| **Atlas**             | `claude-sonnet-4-5-thinking`（Fallback：`claude-opus-4-6-thinking` → `gpt-5.3-codex` → deep quality chain）                                                                            |
| **Sisyphus-Junior**   | *(category-dependent)*（随 category 自动选模型）                                                                                                                                            |


| Category             | 默认模型                             | 典型用途                   |
| -------------------- | -------------------------------- | ---------------------- |
| `visual-engineering` | `google/gemini-3-pro`            | 前端 / UI/UX / 动效 / 视觉实现 |
| `ultrabrain`         | `openai/gpt-5.3-codex`（xhigh）    | 极深推理、复杂架构决策            |
| `deep`               | `openai/gpt-5.3-codex`（medium）   | “深度模式”自主问题解决           |
| `artistry`           | `google/gemini-3-pro`（max）       | 创意/审美/新颖方案             |
| `quick`              | `anthropic/claude-haiku-4-5`     | 小修小补、低成本快速改动           |
| `unspecified-low`    | `anthropic/claude-sonnet-4-6`    | 通用低难任务                 |
| `unspecified-high`   | `anthropic/claude-opus-4-6`（max） | 通用高难任务                 |
| `writing`            | `kimi-for-coding/k2p5`           | 文档、说明、技术写作             |


---

## 7. FAQ（常见坑）

### 7.1 为什么看不到 OMO 效果？

先确认你是用 `opencode` 启动，并且插件已加载；再确认是否触发了 `ulw` 或 `/start-work` 路径。

### 7.2 任务经常中途停？

复杂任务先规划再执行，尽量给出明确验收条件，不要只给一句模糊需求。

### 7.3 我应该先学哪三个？

1. `/init-deep`
2. `ulw`
3. `/start-work`

---

## 8. 参考链接

```text
https://github.com/code-yeongyu/oh-my-opencode
https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/refs/heads/dev/docs/guide/installation.md
https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/refs/heads/dev/docs/guide/overview.md
https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/refs/heads/dev/docs/guide/orchestration.md
https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/refs/heads/dev/docs/reference/features.md
https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/refs/heads/dev/docs/reference/configuration.md
```
