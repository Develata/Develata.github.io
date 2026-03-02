---
title: Oh My OpenCode
date: 2026-03-02
order: 5
---

# Oh My OpenCode (OMO) 使用指南

## 1. 什么是 Oh My OpenCode
[Github Repo](https://github.com/code-yeongyu/oh-my-opencode)

Oh My OpenCode（简称 OMO）不是独立 IDE，也不是新命令行工具。它是 OpenCode 的增强层：你仍然使用 `opencode`，但获得一套多代理、多模型、可编排的开发系统。

官方叙事里，它常被称为“给 Claude Code 打类固醇”，真正含义不是单模型变强，而是模型联盟化：

* 编排与任务控制交给擅长长指令遵循的模型。
* 深度代码执行交给擅长原则推理的模型。
* 视觉与前端任务交给擅长多模态的模型。

它主要解决 3 类工程痛点：

* **上下文污染**：长任务越跑越偏。
* **编辑错位**：大文件重构时行号漂移导致误改。
* **执行中断**：任务半途停工，缺乏闭环。

---

## 2. 安装与初始化

> 下面按角色选择一种安装方式即可。

### 2.1 For Humans（推荐）

把下面提示词直接贴给你的 Agent（Claude Code/Cursor/AmpCode 等）：

```text
Install and configure oh-my-opencode by following the instructions here:
https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/refs/heads/dev/docs/guide/installation.md
```

### 2.2 For LLM Agents

如果你在引导另一个 Agent 安装，请先拉取安装文档再执行：

```bash
curl -fsSL https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/refs/heads/dev/docs/guide/installation.md
```

### 2.3 手动安装（回退）

```bash
bunx oh-my-opencode install
# 或
npx oh-my-opencode install
```

> 说明：安装后仍然使用 `opencode` 启动，不存在 `omo` 命令。

### 2.4 初始化项目上下文

在项目根目录执行：

```text
/init-deep
```

该命令会按目录层级生成 `AGENTS.md`，用于在大仓库中提供就近上下文约束。

### 2.5 安装后验证

```bash
opencode --version
```

并检查 `~/.config/opencode/opencode.json` 的 `plugin` 数组是否包含 `oh-my-opencode`。

---

## 3. 核心工作模式

### 3.1 懒人模式（`ultrawork` / `ulw`）

在需求末尾追加 `ulw`，系统会自动进入高强度执行模式。

```text
帮我把这个页面的深色模式适配一下，顺便补齐测试，ulw
```

适用：目标明确，但你不想手工拆步骤。

### 3.2 严谨模式（Prometheus + Atlas）

复杂任务建议走“先规划后执行”：

1. 按 `Tab` 进入 Prometheus 访谈式规划。
2. 规划确认后执行 `/start-work`。
3. Atlas 根据计划分解并推动执行闭环。

适用：跨模块改造、上线前高风险变更、需要可审计过程的任务。

### 3.3 模式选择建议

* 快速修复：直接 prompt 或 `ulw`。
* 需求边界模糊：先 Prometheus。
* 需要确定性执行：Prometheus + `/start-work`。

### 3.4 一次完整的标准流程（推荐）

```text
1) 在项目目录启动 opencode
2) 先描述目标（必要时末尾加 ulw）
3) 复杂任务按 Tab 进入 Prometheus 访谈规划
4) 计划生成后执行 /start-work
5) Atlas 按计划调度 Sisyphus-Junior / Explore / Librarian 等执行
6) 用 background_output 回收后台任务结果
7) 最后做诊断与构建验证
```

---

## 4. 代理矩阵与模型匹配

OMO 的关键价值在“任务语义路由”，而不是“手动切模型”。

| 代理/类别 | 典型模型 | 核心职责 |
| :--- | :--- | :--- |
| Sisyphus | Claude 系 | 主编排、拆解任务、推动闭环 |
| Hephaestus | GPT-5.3-codex | 深度实现、复杂调试、架构落地 |
| Prometheus | Claude/GPT | 访谈式规划、定义可执行计划 |
| Atlas | 编排执行链 | 按计划推进与校验结果 |
| Librarian | 检索型模型 | 文档与开源实现检索 |
| Explore | 快速模型 | 代码库定位、模式发现 |
| visual-engineering 类别 | Gemini 3 Pro | UI/UX 与视觉任务 |

补充：

* `Category` 决定“这是什么类型的任务”。
* `Skill` 决定“做这类任务要带什么专业能力”。
* 二者组合后，`task` 的稳定性通常高于单模型硬跑。

### 4.1 基础设计（你真正需要理解的 6 个点）

1. **Intent Gate**：先判断意图类型（研究/实现/修复），再决定执行路径。
2. **规划与执行分离**：Prometheus 负责计划，Atlas 负责按计划执行。
3. **专长路由**：Sisyphus 负责总编排，Hephaestus 负责深度执行。
4. **Category + Skill**：用“任务语义 + 领域技能”替代手工选模型。
5. **后台并行**：检索、实现、验证可并行推进，减少主线程等待。
6. **可验证编辑**：`LINE#ID` 防止 stale-line 编辑污染。

---

## 5. 常用命令（OMO 工作流侧）

```text
/init-deep
/start-work
/ralph-loop
/ulw-loop
/cancel-ralph
/refactor
/stop-continuation
/handoff
```

速查：

* `/init-deep`：生成分层 AGENTS.md。
* `/start-work`：把规划任务交给 Atlas 执行。
* `/ralph-loop`、`/ulw-loop`：循环执行直到任务完成。
* `/refactor`：结构化重构流程入口。

### 5.1 新增命令全表（建议收藏）

| 命令/触发 | 类型 | 触发时机 | 典型输入 | 常见误用 |
| :--- | :--- | :--- | :--- | :--- |
| `ulw` / `ultrawork` | 关键词触发 | 你想“少指挥、多自动”时 | `修复支付回调幂等问题并补测，ulw` | 把它当 slash 命令使用 |
| `@plan` | prompt 触发 | 复杂任务前先规划 | `@plan 重构鉴权模块并保持行为不变` | 跳过需求边界导致计划发散 |
| `/init-deep` | slash 命令 | 新项目接入 OMO | `/init-deep` | 在仓库根外执行 |
| `/start-work` | slash 命令 | 已有计划后执行 | `/start-work` | 没有计划就直接执行 |
| `/ralph-loop` | slash 命令 | 长任务持续推进 | `/ralph-loop "迁移旧接口到新 SDK"` | 没设置清晰目标就开循环 |
| `/ulw-loop` | slash 命令 | 需要 ultrawork + 循环 | `/ulw-loop "批量修复 lint + type 错误"` | 与短小任务混用造成过度开销 |
| `/cancel-ralph` | slash 命令 | 停止 ralph 循环 | `/cancel-ralph` | 以为它会停止所有机制 |
| `/refactor` | slash 命令 | 结构化重构 | `/refactor src/auth --strategy=safe` | 把功能新增当重构任务 |
| `/stop-continuation` | slash 命令 | 停止 continuation 机制 | `/stop-continuation` | 误以为会撤销已完成修改 |
| `/handoff` | slash 命令 | 跨会话交接 | `/handoff` | 只写一句话，未附上下文 |

### 5.2 命令记忆法（新用户）

* 开局：`/init-deep`
* 复杂任务：`@plan` → `/start-work`
* 自动化冲刺：`ulw` 或 `/ulw-loop`
* 需要中断：`/stop-continuation`（或 `/cancel-ralph`）
* 交接：`/handoff`

---

## 6. 独有工具与核心技术

### 6.1 Hash-Anchored Edit（`LINE#ID`）

传统“按行号编辑”在文件发生变化后容易失效。OMO 采用哈希锚点：

* 读取时返回 `LINE#ID` 形式的行标识。
* 编辑时必须匹配内容哈希。
* 若内容已变化，编辑会被拒绝，避免静默污染。

这是官方强调的 Harness Problem 改进点。

### 6.2 后台并行代理

你可以把检索/调研工作丢到后台，主线程继续开发：

```typescript
task(subagent_type="librarian", load_skills=[], prompt="查询 React 19 异步流的最佳实践", run_in_background=true)
```

完成后通过 `background_output(task_id="...")` 回收结果。

### 6.3 LSP + AST-Grep

常用能力：

* `lsp_diagnostics`、`lsp_rename`、`lsp_goto_definition`、`lsp_find_references`
* `ast_grep_search`、`ast_grep_replace`

适合做大规模重命名、结构化替换和重构前诊断。

### 6.4 内置 MCP 生态

官方内置：

* `websearch`（Exa）- 实时网页检索。
* `context7` - 官方文档检索。
* `grep_app` - GitHub 代码搜索。

---

## 7. 配置体系（oh-my-opencode.json/jsonc）

常见配置位置：

* 项目级：`.opencode/oh-my-opencode.jsonc`
* 用户级：`~/.config/opencode/oh-my-opencode.jsonc`

最小示例：

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

建议先使用安装器默认配置，再做小步覆盖，避免一次性重配导致路由异常。

---

## 8. 常见问题（FAQ）

### 8.1 为什么看不到 OMO 效果？

先确认你是用 `opencode` 启动，并且插件已加载；再确认是否触发了 `ulw` 或 `/start-work` 路径。

### 8.2 任务经常中途停？

复杂任务先规划再执行，尽量给出明确验收条件，不要只给一句模糊需求。

### 8.3 我应该先学哪三个？

1. `/init-deep`
2. `ulw`
3. `/start-work`

### 8.4 安全下载来源？

以官方 GitHub 仓库与 release 为准，避免第三方仿冒站。

---

## 9. 进阶指南与最佳实践

### 9.1 高命中提示词模板

```text
在不改接口返回结构的前提下，修复登录接口 500，并补齐单测，ulw
```

建议包含：目标、边界、验收标准。

### 9.2 模式选择原则

* 清晰任务：`ulw`
* 高风险变更：Prometheus + `/start-work`
* 大规模重构：先 LSP/AST 诊断，再逐步落地

### 9.3 成本与质量平衡

* 核心编排任务用高质量模型。
* 检索任务用快模型。
* 前端视觉任务走 `visual-engineering`。

---

## 10. 参考链接

* README：`https://github.com/code-yeongyu/oh-my-opencode`
* 安装指南：`https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/refs/heads/dev/docs/guide/installation.md`
* Overview：`https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/refs/heads/dev/docs/guide/overview.md`
* Orchestration：`https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/refs/heads/dev/docs/guide/orchestration.md`
* Features：`https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/refs/heads/dev/docs/reference/features.md`
* Configuration：`https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/refs/heads/dev/docs/reference/configuration.md`
