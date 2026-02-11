---
title: everything-claude-code
date: 2026-2-11
order: 1
---

# everything-claude-code 使用指南

> 信息来源：该仓库的 `README.md` / `README.zh-CN.md`、`rules/README.md`、以及作者的 shortform/longform guide（已通过联网抓取核对）。

## 1. everything-claude-code 是什么

[GitHub Repo](https://github.com/affaan-m/everything-claude-code)

everything-claude-code（简称 ECC）是一套“可直接落地”的 Claude Code 配置集合，目标是把 Claude Code 变成可复用的工程工作流：

* Agents（子代理）
* Skills（技能/工作流）
* Commands（斜杠命令）
* Hooks（生命周期/工具钩子自动化）
* Rules（始终遵循的规则集，按语言分层）
* MCP 配置示例（可选）

适合人群：你已经在用 Claude Code，但希望把“提示词经验”沉淀为可复用资产，并引入更标准的计划、TDD、审查、验证闭环。

---

## 2. 前置要求

1. 已安装 Claude Code CLI。
2. 版本要求：仓库说明 ECC 插件需要 Claude Code `v2.1.0+`。

检查版本：

```bash
claude --version
```

---

## 3. 快速开始（推荐：安装插件 + 安装 Rules）

### 3.1 安装插件（Claude Code 内执行）

在 Claude Code 交互界面输入：

```text
/plugin marketplace add affaan-m/everything-claude-code
/plugin install everything-claude-code@everything-claude-code
```

如果你更偏好直接改配置，也可以在 `~/.claude/settings.json` 写入（示例以仓库 README 为准）：

```json
{
  "extraKnownMarketplaces": {
    "everything-claude-code": {
      "source": {
        "source": "github",
        "repo": "affaan-m/everything-claude-code"
      }
    }
  },
  "enabledPlugins": {
    "everything-claude-code@everything-claude-code": true
  }
}
```

验证已安装：

```text
/plugin list everything-claude-code@everything-claude-code
```

### 3.2 安装 Rules（必做）

重要限制：Claude Code 插件系统无法自动分发 `rules`，需要你手动安装（或用仓库脚本安装）。

先克隆仓库：

```bash
git clone https://github.com/affaan-m/everything-claude-code.git
cd everything-claude-code
```

方式 A：使用安装脚本（仓库推荐）

```bash
./install.sh typescript
./install.sh python
./install.sh golang
```

方式 B：手动复制（务必保留目录结构）

> 不要用 `cp -r rules/* ~/.claude/rules/` 这种“扁平化复制”。ECC 的 `rules/common/` 与 `rules/<lang>/` 里会有同名文件；扁平化会覆盖并破坏 `../common/` 相对引用。

macOS/Linux：

```bash
mkdir -p ~/.claude/rules
cp -r rules/common ~/.claude/rules/common
cp -r rules/typescript ~/.claude/rules/typescript
cp -r rules/python ~/.claude/rules/python
cp -r rules/golang ~/.claude/rules/golang
```

Windows PowerShell（示例）：

```powershell
New-Item -ItemType Directory -Force "$HOME\.claude\rules" | Out-Null
Copy-Item -Recurse -Force "rules\common" "$HOME\.claude\rules\common"
Copy-Item -Recurse -Force "rules\typescript" "$HOME\.claude\rules\typescript"
Copy-Item -Recurse -Force "rules\python" "$HOME\.claude\rules\python"
Copy-Item -Recurse -Force "rules\golang" "$HOME\.claude\rules\golang"
```

### 3.3 试跑一个命令

```text
/plan "添加用户认证"
```

---

## 4. 主要内容一览（你装进来的是什么）

ECC 仓库整体可以理解为“工程化 Claude Code 的工具箱”，核心组件与常见落地位置如下：

* `agents/`：子代理定义（用于委托 planner / architect / code-reviewer / security-reviewer / tdd-guide 等）
* `commands/`：斜杠命令（把复杂工作流封装成可重复执行的 prompt）
* `skills/`：技能/工作流知识库（更像“可复用 SOP + 参考实现”）
* `hooks/`：钩子自动化（PreToolUse/PostToolUse/Stop 等阶段触发脚本）
* `rules/`：规则集（永远遵守；按 `common/` + 语言目录分层）
* `mcp-configs/`：MCP server 配置样例（按需拷贝到你的 `~/.claude.json`）

安装方式不同，文件落点不同：

* 插件安装：Claude Code 会把插件内容装入其插件目录；你主要“启用/禁用插件”和“手动安装 rules”。
* 手动安装：你需要把 agents/commands/skills/rules/hooks 复制到 `~/.claude/`（或项目 `.claude/`）对应目录。

---

## 5. Rules（规则集，全量拆解）

ECC 的规则目录结构（必须按目录安装，而不是把文件拍平到一个目录）：

* `rules/common/`：语言无关的“强约束”
* `rules/typescript/`：TypeScript/JavaScript 扩展 common
* `rules/python/`：Python 扩展 common
* `rules/golang/`：Go 扩展 common

> 规则文件会互相引用（语言目录的规则会引用 `../common/...`），因此必须保留目录结构。

### 5.1 common（8 个）

`rules/common/agents.md`

* 定义“什么时候应该委托给哪个 agent”（planner / code-reviewer / tdd-guide / architect 等）
* 强调独立任务应并行执行、多视角审查

`rules/common/coding-style.md`

* 不可变（immutability）是关键原则：尽量返回新对象/数组，不做原地修改
* 文件组织偏好“小文件多模块”：典型 200-400 行，建议上限 800 行
* 错误处理与输入校验必须显式

`rules/common/git-workflow.md`

* Conventional Commits：`feat/fix/refactor/docs/test/chore/perf/ci`
* PR 工作流：要求看全量 diff、写清测试计划
* 推荐流程：Plan → TDD → Review → Commit

`rules/common/hooks.md`

* hooks 的类型说明：PreToolUse / PostToolUse / Stop
* 提醒“权限自动放行”要谨慎
*（作者原文里）强调 TodoWrite 的用途（你是否启用取决于你的工作流偏好）

`rules/common/patterns.md`

* Skeleton project 思路：优先找“可复用骨架”而不是现场造轮子
* Repository pattern / API response envelope 等通用模式

`rules/common/performance.md`

* 模型选择策略（Haiku / Sonnet / Opus）
* 上下文窗口管理：避免在窗口尾部做高风险重构
* Plan mode + 深度思考（thinking）的开关与建议

`rules/common/security.md`

* 任何提交前的强制安全检查清单：密钥、输入校验、SQLi、XSS、CSRF、鉴权、限流、错误信息泄露等
* 一旦发现安全问题：立即停、走 security-reviewer 流程

`rules/common/testing.md`

* 80% 覆盖率最低门槛（单元/集成/E2E 都要有）
* 强制 TDD：RED → GREEN → IMPROVE，并要求覆盖边界条件与错误路径

### 5.2 TypeScript/JavaScript（5 个）

`rules/typescript/coding-style.md`

* 强化不可变更新（spread operator）
* 建议 async/await + try/catch
* 建议用 Zod 做 schema 校验
* 禁止生产代码里 `console.log`

`rules/typescript/patterns.md`

* API Response 类型封装示例
* React 自定义 hooks 模式示例（如 `useDebounce`）
* Repository interface 模式示例

`rules/typescript/testing.md`

* E2E 默认建议 Playwright
* 提及 agent：`e2e-runner`

`rules/typescript/security.md`

* 强调环境变量读取密钥、缺失时 fail fast
* 提及 agent：`security-reviewer`

`rules/typescript/hooks.md`

* PostToolUse：Prettier 自动格式化、`tsc` 类型检查、`console.log` 告警
* Stop：会话结束时做 `console.log` 审计

### 5.3 Python（5 个）

`rules/python/coding-style.md`

* PEP 8 + 类型标注（function signature）
* 推荐不可变结构（`@dataclass(frozen=True)` / `NamedTuple`）
* 工具链建议：black / isort / ruff

`rules/python/patterns.md`

* Protocol（鸭子类型接口）
* dataclasses 作为 DTO
* context manager / generator 的使用建议

`rules/python/testing.md`

* pytest + 覆盖率命令示例
* 用 `pytest.mark` 分类（unit/integration）

`rules/python/security.md`

* 环境变量读密钥（示例用了 python-dotenv）
* 建议 bandit 做静态安全扫描

`rules/python/hooks.md`

* PostToolUse：black/ruff 格式化、mypy/pyright 类型检查
* 警告 `print()`（建议用 logging）

### 5.4 Go（5 个）

`rules/golang/coding-style.md`

* gofmt/goimports 强制
* 设计原则：accept interfaces, return structs；接口要小
* 错误必须 wrap 上下文（`fmt.Errorf("...: %w", err)`）

`rules/golang/patterns.md`

* Functional options
* 小接口 + 就地定义
* 构造函数依赖注入

`rules/golang/testing.md`

* 标准 `go test` + table-driven tests
* 强制 `-race`
* 覆盖率 `-cover`

`rules/golang/security.md`

* 环境变量密钥 + 缺失时 fail fast
* 静态扫描 gosec
* 强制 context + timeout

`rules/golang/hooks.md`

* PostToolUse：gofmt/goimports、go vet、staticcheck

---

## 6. Skills（技能/工作流，全量拆解）

技能在 ECC 里是“可复用的工作流与知识库”。它们通常：

* 给出“什么时候启用”
* 给出“步骤清单/检查点/示例代码”
* 部分技能会配套脚本（用于 hooks 触发或生成产物文件）

下面按主题把 `skills/` 目录下的技能逐一拆开说明（共 32 个目录，按 main 分支内容整理）。

### 6.1 工程通用（架构/代码规范/检索/上下文管理）

`skills/coding-standards`

* 目的：通用代码规范（命名、不可变、错误处理、类型安全、React 写法、API 返回结构、目录组织等）
* 关键点：强调不可变；建议并行 async；强调输入校验；给出文件结构模板

`skills/backend-patterns`

* 目的：后端模式（REST API、Repository/Service 层、middleware、DB 查询优化、缓存、错误处理、鉴权、限流、队列、结构化日志等）
* 关键点：避免 N+1；缓存旁路（cache-aside）；统一错误处理；RBAC 示例

`skills/frontend-patterns`

* 目的：前端模式（React/Next.js 组件组合、compound components、自定义 hooks、状态管理、性能优化、表单、Error Boundary、动画、无障碍）
* 关键点：useMemo/useCallback；lazy load；虚拟列表；键盘导航与 focus 管理

`skills/iterative-retrieval`

* 目的：解决“子代理不知道该拿哪些上下文”的问题
* 方法：DISPATCH → EVALUATE → REFINE → LOOP（最多 3 轮），逐步收敛到高相关文件

`skills/strategic-compact`

* 目的：把 `/compact` 从“被动自动触发”变成“在里程碑节点主动触发”
* 典型节点：探索结束→开始实现；完成阶段性里程碑；准备切换任务上下文
* hooks 方式：PreToolUse(Edit/Write) 统计调用次数，达到阈值提醒你 compact

`skills/eval-harness`

* 目的：Eval-Driven Development（把 eval 当作 AI 开发的“单元测试”）
* 关键概念：Capability eval / Regression eval；grader（代码/模型/人工）；pass@k vs pass^k
* 产物建议：把 eval 定义与报告存入 `.claude/evals/`

`skills/configure-ecc`

* 目的：交互式安装向导（帮你选择安装哪些 skills/rules，安装到 user-level 或 project-level，并做覆盖/合并提示）

### 6.2 质量与交付（TDD / 验证闭环 / 安全）

`skills/tdd-workflow`

* 目的：强制 TDD（覆盖率目标 80%+，覆盖 unit/integration/E2E）
* 关键点：先写用户旅程→生成用例→先跑失败→最小实现→再跑通过→重构→看覆盖率
* 给了 Jest/Vitest、API integration test、Playwright E2E 的示例结构

`skills/verification-loop`

* 目的：PR/交付前的质量闸口（build → typecheck → lint → tests → security → diff review）
* 输出建议：用固定格式写一份 VERIFICATION REPORT（PASS/FAIL + 待修复列表）

`skills/security-review`

* 目的：安全审查清单（Secrets、输入校验、SQLi、AuthZ、XSS、CSRF、Rate limit、日志脱敏、依赖安全等）
* 关键点：示例覆盖 TS/Next.js/Supabase/RLS、CSP、token 存储策略等

`skills/security-scan`

* 目的：用 AgentShield 扫描你的 Claude Code 配置（`.claude/`、MCP、hooks、agents 等）
* 常用命令：`npx ecc-agentshield scan` / `--fix` / `--format json|markdown|html` / `--opus`

### 6.3 持续学习（从会话沉淀可复用资产）

`skills/continuous-learning`

* 目的：会话结束时（Stop hook）总结“可复用模式”，自动沉淀为 learned skills
* 默认思路：会话足够长（如 10+ message）才抽取；落盘到 `~/.claude/skills/learned/`
* 配置项：最小会话长度、抽取阈值、忽略模式、是否自动批准等

`skills/continuous-learning-v2`

* 目的：升级为“instinct（直觉）”的原子化学习体系（带置信度评分，可导入/导出，可聚类进化为 skills/commands/agents）
* 关键差异：用 PreToolUse/PostToolUse hooks 做 100% 观测；后台 observer（Haiku）做模式提取
* 主要目录：`~/.claude/homunculus/observations.jsonl`、`instincts/personal|inherited`、`evolved/agents|skills|commands`

### 6.4 语言/框架专项（把“最佳实践”写成可调用知识库）

Python：

* `skills/python-patterns`：Pythonic idioms、PEP8、类型标注等
* `skills/python-testing`：pytest、fixtures、mock、参数化、覆盖率要求
* `skills/django-patterns`：Django/DRF 架构、ORM、缓存、middleware、生产实践
* `skills/django-security`：Django 安全（CSRF/XSS/SQLi/部署安全等）
* `skills/django-tdd`：pytest-django、factory_boy、DRF API 测试
* `skills/django-verification`：Django 项目验证闭环（migrations、lint、tests、security、diff review）

Go：

* `skills/golang-patterns`：Go 惯用法、并发、错误处理、项目组织等
* `skills/golang-testing`：table-driven tests、bench、fuzz、覆盖率

Java/Spring：

* `skills/java-coding-standards`：Java 代码规范（Optional/streams/异常/泛型/布局等）
* `skills/jpa-patterns`：JPA/Hibernate 实体/关系/查询优化/事务/索引/分页等
* `skills/springboot-patterns`：Spring Boot 架构/分层/缓存/异步/日志等
* `skills/springboot-security`：Spring Security + Web 安全建议
* `skills/springboot-tdd`：JUnit5/Mockito/MockMvc/Testcontainers/JaCoCo 的 TDD
* `skills/springboot-verification`：Spring Boot 项目验证闭环（build、静态分析、测试覆盖率、安全扫描）

C++：

* `skills/cpp-testing`：GoogleTest/CTest、覆盖率、sanitizers、排查 flaky tests

### 6.5 数据库与文档处理专项

* `skills/postgres-patterns`：PostgreSQL/Supabase 相关的 schema/index/query/security 模式
* `skills/clickhouse-io`：ClickHouse（MergeTree 家族、聚合表、物化视图、查询优化、监控、ETL/CDC 模式）
* `skills/nutrient-document-processing`：Nutrient DWS API 文档处理（转换/OCR/抽取/脱敏/签名/表单填充等）

### 6.6 模板示例

`skills/project-guidelines-example`

* 这是“项目级 skill”的示例模板：技术栈、目录结构、API 规范、测试与部署流程等
* 你可以照此结构为自己的项目写一个“项目内专用 skill”，让 Claude Code 对你项目的约束更稳定

---

## 7. Commands（斜杠命令，全量拆解）

ECC 在 `commands/` 下提供了一组可复用的斜杠命令（在 Claude Code 里以 `/xxx` 调用）。这些命令的核心价值是把“复杂提示词 + 固定流程”封装成稳定入口。

> 你看到的每个命令，其实就是一个可重复执行的工作流 prompt；其中一部分会显式调用某个 agent（例如 `/plan` 调 planner，`/tdd` 调 tdd-guide）。

### 7.1 命令清单（31 个）

`/plan`

* 作用：调用 `planner` 产出分阶段计划，并且“必须等待用户确认后才改代码”。
* 典型用法：`/plan <需求描述>`

`/tdd`

* 作用：调用 `tdd-guide` 强制 TDD（先写测试，再最小实现，再重构），目标覆盖率 80%+。
* 典型用法：`/tdd <要实现/修复的功能>`

`/code-review`

* 作用：对未提交变更做代码审查（按 CRITICAL/HIGH/MEDIUM/LOW 分级），包含安全项与质量项。

`/verify`

* 作用：执行验证闭环（build → typecheck → lint → tests → console.log 审计 → git status）。
* 参数：`/verify quick|full|pre-commit|pre-pr`（命令文件定义了这几种模式）。

`/build-fix`

* 作用：增量修复构建/类型错误；强调“一次只修一个错误→重跑验证”。

`/test-coverage`

* 作用：分析覆盖率并补齐缺失测试（通常与 `/tdd`、`/verify` 配合）。

`/e2e`

* 作用：调用 `e2e-runner` 生成/维护/执行 Playwright E2E 测试。

`/checkpoint`

* 作用：创建或验证一个“工作流检查点”（用于阶段性确认与回退/复盘）。

`/eval`

* 作用：管理 eval-driven development 工作流（定义/运行/报告 eval）。

`/learn`

* 作用：从当前会话抽取“值得沉淀为技能”的可复用模式。

`/sessions`

* 作用：管理 Claude Code session 历史（list/load/alias/info 等），会读写 `~/.claude/sessions/` 和 `~/.claude/session-aliases.json`。

`/setup-pm`

* 作用：设置/检测首选包管理器（npm/pnpm/yarn/bun），支持全局与项目级，规则与优先级在命令文档内写得很清楚。

`/skill-create`

* 作用：本地解析 git 历史，提取项目习惯并生成 `SKILL.md`（可选同时生成 instincts 供 continuous-learning-v2 使用）。

Instinct 系列（continuous-learning-v2 配套）：

* `/instinct-status`：查看已学习 instincts（带置信度、按 domain 分组）。
* `/instinct-import`：导入 instincts。
* `/instinct-export`：导出 instincts。
* `/evolve`：把 instincts 聚类进化为 skills/commands/agents（命令文件会调用 instinct CLI）。

Go 专用：

* `/go-review`：调用 `go-reviewer` 做 Go 代码审查。
* `/go-build`：调用 `go-build-resolver` 修 Go build/vet 问题。
* `/go-test`：Go 的 TDD 工作流（table-driven tests、race/coverage 等）。

Python 专用：

* `/python-review`：调用 `python-reviewer` 做 Python 代码审查。

多模型编排（高级工作流）：

* `/orchestrate`：顺序式多 agent 工作流（适合复杂任务分阶段推进）。
* `/multi-plan`：多模型协作产计划。
* `/multi-execute`：多模型协作执行与审计。
* `/multi-workflow`：Research→Ideation→Plan→Execute→Optimize→Review 的全流程多模型协作。
* `/multi-frontend`：偏前端的多模型流程。
* `/multi-backend`：偏后端的多模型流程。

运维/多服务：

* `/pm2`：扫描项目服务（Vite/Next/FastAPI/Go 等），生成 `ecosystem.config.cjs` 与一组 `.claude/commands/pm2-*.md` 便于启动/监控/查看日志（命令文件对 Windows 细节写得很具体）。

### 7.2 按场景的“推荐命令链”（可直接照抄）

新增功能（通用）：

```text
/plan "..."
/tdd
/test-coverage
/code-review
/verify pre-pr
```

构建/类型报错优先绿灯：

```text
/build-fix
/verify quick
```

准备提 PR：

```text
/code-review
/verify pre-pr
```

E2E 测试补齐关键用户旅程：

```text
/e2e
/verify full
```

把团队习惯沉淀为可复用资产：

```text
/skill-create --commits 200
/learn
```

### 7.3 命令速查表（命令 → 调用对象 → 输入/输出要点）

> 说明：部分命令会显式调用 agent（例如 planner/tdd-guide/e2e-runner），其余多为固定工作流 prompt 或 Node 脚本。

| 命令 | 主要作用 | 主要调用 | 参数/备注 |
| :--- | :--- | :--- | :--- |
| `/plan` | 产出分阶段实施计划并等待确认 | agent: `planner` | 命令文档强调“未确认不得改代码” |
| `/tdd` | 强制 TDD：先测试→最小实现→重构→覆盖率 | agent: `tdd-guide` | 覆盖率目标 80%+；E2E 另用 `/e2e` |
| `/code-review` | 未提交变更的安全与质量审查 | workflow（检查清单） | 输出按 CRITICAL/HIGH/MEDIUM/LOW；CRITICAL/HIGH 应阻断提交 |
| `/verify` | 验证闭环（build/types/lint/tests/日志审计/git 状态） | workflow | 支持 `quick/full/pre-commit/pre-pr` |
| `/build-fix` | 增量修 build/类型错误（一次只修一个） | workflow | 每次修复后重跑 build；同一错误多次失败应停下 |
| `/test-coverage` | 分析覆盖率并补齐缺失测试 | workflow | 常与 `/tdd`、`/verify` 配合 |
| `/e2e` | 生成/维护/执行 Playwright E2E | agent: `e2e-runner` | 覆盖关键用户旅程；隔离 flaky tests |
| `/checkpoint` | 创建/核对一个工作流检查点 | workflow | 用于阶段性确认/复盘 |
| `/eval` | EDD：定义/运行/报告 eval | workflow（配合 `skills/eval-harness`） | 适合把“成功标准”先写死 |
| `/learn` | 从当前会话提炼可复用模式 | workflow（配合 continuous-learning） | 更偏人工触发抽取 |
| `/sessions` | 会话历史管理（list/load/alias/info） | Node 脚本 | 读写 `~/.claude/sessions/`、`~/.claude/session-aliases.json` |
| `/setup-pm` | 设置/检测包管理器偏好 | Node 脚本 | 优先级：env→项目→package.json→lock→全局→fallback |
| `/skill-create` | 从 git 历史生成 SKILL.md（可选 instincts） | workflow | `--commits/--output/--instincts` |
| `/instinct-status` | 查看 instincts（置信度/分组） | instinct CLI | continuous-learning-v2 配套 |
| `/instinct-import` | 导入 instincts | instinct CLI | continuous-learning-v2 配套 |
| `/instinct-export` | 导出 instincts | instinct CLI | continuous-learning-v2 配套 |
| `/evolve` | instincts 聚类进化为技能/命令/代理 | instinct CLI | continuous-learning-v2 配套 |
| `/go-review` | Go 专用审查 | agent: `go-reviewer` | 并发/错误处理/性能/惯用法 |
| `/go-build` | Go build/vet 修复 | agent: `go-build-resolver` | 最小改动、快速绿灯 |
| `/go-test` | Go 的 TDD/测试套路 | workflow | table-driven tests、race、coverage |
| `/python-review` | Python 专用审查 | agent: `python-reviewer` | PEP8、类型标注、安全与性能 |
| `/refactor-clean` | 死代码识别与清理 | agent: `refactor-cleaner`（概念上） | 强调安全删除 + 验证 |
| `/update-docs` | 文档同步 | agent: `doc-updater`（概念上） | 从 source-of-truth 同步 |
| `/update-codemaps` | 生成/更新 codemaps | agent: `doc-updater`（概念上） | 适合大仓库导航 |
| `/orchestrate` | 顺序式多 agent 协作（复杂任务） | workflow | 把任务拆阶段推进 |
| `/multi-plan` | 多模型协作产计划 | workflow | 高级用法，依赖额外 wrapper/MCP |
| `/multi-execute` | 多模型协作执行与审计 | workflow | 高级用法，依赖额外 wrapper/MCP |
| `/multi-frontend` | 偏前端多模型流程 | workflow | 文档标注“Gemini-led” |
| `/multi-backend` | 偏后端多模型流程 | workflow | 文档标注“Codex-led” |
| `/multi-workflow` | 全流程多模型协作 | workflow | 该命令文档的 usage 写成 `/workflow ...`；以文件名映射的命令 `/multi-workflow` 为准 |
| `/pm2` | 多服务 PM2 初始化与命令生成 | workflow | 生成 `ecosystem.config.cjs` 与 `.claude/commands/pm2-*.md` |

---

## 8. Agents（子代理，全量拆解）

ECC 的 agents 放在 `agents/`，每个 agent 都带明确的 “when to use/工具权限/模型选择”。在 Claude Code 中，这些 agent 常被 commands 间接调用。

### 8.1 Agent 清单（13 个）

| Agent | 主要职责 | 默认模型 | Tools（声明） | 常见入口 |
| :--- | :--- | :--- | :--- | :--- |
| `planner` | 复杂需求拆解为可执行计划，并等待确认 | `opus` | `Read,Grep,Glob` | `/plan` |
| `architect` | 架构设计与技术决策（边界、扩展性、风险） | `opus` | `Read,Grep,Glob` |（手动委托/复杂方案评审） |
| `tdd-guide` | 强制 TDD（先测后码、覆盖率目标） | `opus` | `Read,Write,Edit,Bash,Grep` | `/tdd` |
| `code-reviewer` | 质量 + 安全 + 可维护性审查 | `opus` | `Read,Grep,Glob,Bash` | `/code-review` |
| `security-reviewer` | 安全漏洞检测与修复建议 | `opus` | `Read,Write,Edit,Bash,Grep,Glob` |（敏感改动后） |
| `build-error-resolver` | 修 build/TS 错误，最小 diff 快速变绿 | `opus` | `Read,Write,Edit,Bash,Grep,Glob` | `/build-fix` |
| `e2e-runner` | Playwright E2E（含 flaky 隔离与 artifacts） | `opus` | `Read,Write,Edit,Bash,Grep,Glob` | `/e2e` |
| `refactor-cleaner` | 死代码识别与清理（分析→验证→删除） | `opus` | `Read,Write,Edit,Bash,Grep,Glob` | `/refactor-clean` |
| `doc-updater` | 文档/codemap 同步与生成 | `opus` | `Read,Write,Edit,Bash,Grep,Glob` | `/update-docs`、`/update-codemaps` |
| `go-reviewer` | Go 代码审查（惯用法/并发/错误处理/性能） | `opus` | `Read,Grep,Glob,Bash` | `/go-review` |
| `go-build-resolver` | Go build/vet/lint 修复（最小改动） | `opus` | `Read,Write,Edit,Bash,Grep,Glob` | `/go-build` |
| `python-reviewer` | Python 审查（PEP8/类型标注/安全/性能） | `opus` | `Read,Grep,Glob,Bash` | `/python-review` |
| `database-reviewer` | PostgreSQL/Supabase（schema/index/query/security/perf） | `opus` | `Read,Write,Edit,Bash,Grep,Glob` |（SQL/migration/慢查询时） |

`planner`

* 职责：复杂功能/重构的计划拆解；输出阶段化计划并等待确认。
* 常见入口：`/plan`

`architect`

* 职责：系统设计与架构决策（可扩展性、边界划分、风险评估）。

`tdd-guide`

* 职责：强制 TDD（先测后码、覆盖率目标）。
* 常见入口：`/tdd`

`code-reviewer`

* 职责：质量 + 安全的代码审查；仓库强调“写完代码立即用”。
* 常见入口：`/code-review`

`security-reviewer`

* 职责：安全漏洞检测与修复建议（secrets、注入、SSRF、OWASP Top 10 等）。

`build-error-resolver`

* 职责：修 build/TS 错误；强调最小 diff、快速让 build 变绿。

`e2e-runner`

* 职责：Playwright E2E（生成/维护/执行）、隔离 flaky tests、收集 artifacts。
* 常见入口：`/e2e`

`refactor-cleaner`

* 职责：死代码清理与收敛（仓库说明会用 knip/depcheck/ts-prune 等分析）。
* 常见入口：`/refactor-clean`

`doc-updater`

* 职责：文档与 codemap 同步；生成/更新 `docs/CODEMAPS/*` 等结构化文档。
* 常见入口：`/update-docs`、`/update-codemaps`

语言/领域专项：

* `go-reviewer`：Go 代码审查（并发、错误处理、性能、惯用法）。
* `go-build-resolver`：Go build/vet/lint 问题修复。
* `python-reviewer`：Python 代码审查（PEP8、类型标注、安全、性能）。
* `database-reviewer`：PostgreSQL/Supabase（schema/index/query/security/perf）。

### 8.2 “什么时候用哪个 agent”（更可操作的规则）

* 需求不清/涉及多模块：先 `/plan`（planner）把边界与风险说清。
* 你准备“动架构”：先 `architect` 让它给出候选方案与 trade-off。
* 新功能/修 bug：直接 `/tdd`，用测试把需求钉死。
* 改完代码：立刻 `/code-review`，把 CRITICAL/HIGH 先压下去。
* build 红了：用 `build-error-resolver`（或 `/build-fix`）做最小修复闭环。
* E2E 缺口：用 `e2e-runner` 明确用户旅程与断言。
* DB/migration/慢查询：拉 `database-reviewer`，优先看索引/查询计划/事务边界。

---

## 9. Hooks（自动化钩子，逐条拆解 + 可复制模板）

ECC 的 hooks 文件是 `hooks/hooks.json`。核心特点：

* 全部用 Node.js 实现，跨平台（Windows/macOS/Linux）。
* 既包含“提醒类”hooks，也包含“阻断类”hooks（会 `exit(1)` 直接阻止危险操作）。
* 多个脚本通过 `${CLAUDE_PLUGIN_ROOT}` 定位插件根目录（插件安装场景下可用）。

### 9.1 ECC hooks.json 做了什么（按触发点逐条解释）

PreToolUse（工具执行前）：

* Dev server 必须在 tmux：当检测到 `npm run dev` / `pnpm dev` / `yarn dev` / `bun dev`，且不在 tmux 中时，会直接阻断并提示用 tmux 启动。
* 长命令 tmux 提醒：对 install/test/cargo/docker/pytest/vitest/playwright 等命令给 tmux 提醒。
* `git push` 提醒：push 前提醒你复查变更（默认不阻断）。
* 阻止随手创建零散文档：当 `Write` 创建 `.md/.txt` 且不是 README/CLAUDE/AGENTS/CONTRIBUTING 时，直接阻断。
* strategic compact 提醒：对任意 Edit/Write，调用 `scripts/hooks/suggest-compact.js` 做“到阈值建议 /compact”。

PreCompact（压缩前）：

* 保存压缩前状态：调用 `scripts/hooks/pre-compact.js`。

SessionStart（会话开始）：

* 会话启动加载上下文并检测包管理器：调用 `scripts/hooks/session-start.js`。

PostToolUse（工具执行后）：

* Bash 里检测 `gh pr create`：输出 PR URL，并给出 `gh pr review` 复查命令。
* build 后台分析示例：对 build 命令注册了一个 `async: true` 的示例 hook（不阻塞）。
* Edit 后自动 Prettier：编辑 `.ts/.tsx/.js/.jsx` 后自动 `npx prettier --write <file>`。
* Edit 后 TypeScript 检查：编辑 `.ts/.tsx` 后在最近的 `tsconfig.json` 所在目录执行 `npx tsc --noEmit`，并只打印涉及该文件的错误行。
* Edit 后 `console.log` 警告：编辑 `.ts/.tsx/.js/.jsx` 后扫描该文件，发现 `console.log` 就警告。

Stop（单次响应结束后）：

* 统一 `console.log` 审计：调用 `scripts/hooks/check-console-log.js`（针对 modified files 做审计）。

SessionEnd（会话结束）：

* 会话结束持久化：调用 `scripts/hooks/session-end.js`。
* 会话模式抽取：调用 `scripts/hooks/evaluate-session.js`（服务于 continuous-learning）。

### 9.2 最小可用 hooks 模板（插件安装场景，直接可用）

注意：如果你是“按 ECC 插件方式安装”，Claude Code 通常会按插件约定自动加载插件内的 `hooks/hooks.json`。下面片段主要用于“你想按自己的口味裁剪/重写 hooks”的场景；若你直接复制粘贴导致 hooks 重复执行，请删掉重复项，只保留一份来源。

把下面片段合并到 `~/.claude/settings.json` 的 `hooks` 字段即可（会用到 `${CLAUDE_PLUGIN_ROOT}`）：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "tool == \"Edit\" || tool == \"Write\"",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/suggest-compact.js\""
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/pre-compact.js\""
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/session-start.js\""
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/check-console-log.js\""
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/session-end.js\""
          }
        ]
      },
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/evaluate-session.js\""
          }
        ]
      }
    ]
  }
}
```

### 9.3 语言专项 hooks（可选）

TypeScript/JavaScript（格式化 + 类型检查 + console.log）：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "tool == \"Edit\" && tool_input.file_path matches \\\"\\\\.(ts|tsx|js|jsx)$\\\"",
        "hooks": [{
          "type": "command",
          "command": "node -e \"const{execFileSync}=require('child_process');const fs=require('fs');let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const i=JSON.parse(d);const p=i.tool_input?.file_path;if(p&&fs.existsSync(p)){try{execFileSync('npx',['prettier','--write',p],{stdio:['pipe','pipe','pipe']})}catch(e){}}console.log(d)})\""
        }]
      }
    ]
  }
}
```

Python/Go 的 hooks，ECC 的规则文件分别建议：

* Python：black/ruff + mypy/pyright，警告 print
* Go：gofmt/goimports + go vet + staticcheck

下面给出“示例模板”（具体命令与参数以你的项目工具链为准）：

Python（black + ruff + pyright，编辑 `.py` 后触发；示例参考 ECC 的 Prettier hook 写法，用 stdin JSON 取 `tool_input.file_path`）：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "tool == \"Edit\" && tool_input.file_path matches \\\"\\\\.py$\\\"",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"const{execFileSync}=require('child_process');const fs=require('fs');let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const i=JSON.parse(d);const p=i.tool_input?.file_path;if(p&&fs.existsSync(p)){try{execFileSync('python',['-m','black',p],{stdio:['pipe','pipe','pipe']})}catch(e){}try{execFileSync('python',['-m','ruff','check','--fix',p],{stdio:['pipe','pipe','pipe']})}catch(e){}}try{execFileSync('pyright',['.'],{stdio:['pipe','pipe','pipe']})}catch(e){}console.log(d)})\""
          }
        ]
      }
    ]
  }
}
```

Go（gofmt/goimports + go vet，编辑 `.go` 后触发；同样从 stdin JSON 获取文件路径）：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "tool == \"Edit\" && tool_input.file_path matches \\\"\\\\.go$\\\"",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"const{execFileSync}=require('child_process');const fs=require('fs');let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const i=JSON.parse(d);const p=i.tool_input?.file_path;if(p&&fs.existsSync(p)){try{execFileSync('gofmt',['-w',p],{stdio:['pipe','pipe','pipe']})}catch(e){}try{execFileSync('goimports',['-w',p],{stdio:['pipe','pipe','pipe']})}catch(e){}}try{execFileSync('go',['vet','./...'],{stdio:['pipe','pipe','pipe']})}catch(e){}console.log(d)})\""
          }
        ]
      }
    ]
  }
}
```

---

## 10. MCP（mcp-configs/mcp-servers.json，全量拆解）

ECC 给了一个 MCP server 配置样例文件：`mcp-configs/mcp-servers.json`。

它的定位是：你不要全盘照抄启用，而是把“你当前项目确实需要的那几个”拷贝到 `~/.claude.json` 的 `mcpServers` 里。

> 作者经验：MCP/插件开太多会显著压缩上下文窗口。建议“配置 20-30 个，但每项目启用 < 10 个、活跃 tools < 80 个”。

### 10.1 服务器清单（按 ECC 样例）

`github`

* 类型：stdio（npx）
* env：`GITHUB_PERSONAL_ACCESS_TOKEN`
* 用途：PR / issue / repo 操作

`firecrawl`

* 类型：stdio（npx）
* env：`FIRECRAWL_API_KEY`
* 用途：网页抓取/爬取

`supabase`

* 类型：stdio（npx）
* 参数：`--project-ref=YOUR_PROJECT_REF`
* 用途：Supabase DB 操作

`memory`

* 类型：stdio（npx）
* 用途：跨会话持久化记忆（注意也会占用上下文与工具额度）

`sequential-thinking`

* 类型：stdio（npx）
* 用途：链式推理辅助

`vercel`

* 类型：http（远程）
* url：`https://mcp.vercel.com`
* 用途：Vercel 部署/项目

`railway`

* 类型：stdio（npx）
* 用途：Railway 部署

Cloudflare（4 个 http MCP）：

* `cloudflare-docs`：`https://docs.mcp.cloudflare.com/mcp`（文档检索）
* `cloudflare-workers-builds`：`https://builds.mcp.cloudflare.com/mcp`（Workers builds）
* `cloudflare-workers-bindings`：`https://bindings.mcp.cloudflare.com/mcp`（Workers bindings）
* `cloudflare-observability`：`https://observability.mcp.cloudflare.com/mcp`（日志/可观测）

`clickhouse`

* 类型：http
* url：`https://mcp.clickhouse.cloud/mcp`
* 用途：ClickHouse 分析查询

`context7`

* 类型：stdio（npx）
* 用途：实时文档检索（Context7）

`magic`

* 类型：stdio（npx）
* 用途：Magic UI 组件（偏前端）

`filesystem`

* 类型：stdio（npx）
* 参数：`@modelcontextprotocol/server-filesystem` 后面要填你自己的路径（示例是 `/path/to/your/projects`）
* 用途：文件系统操作（风险较高；建议限制授权范围）

### 10.2 占位符与安全建议

* ECC 样例里有大量 `YOUR_*_HERE`：必须替换成你自己的值，并尽量用环境变量注入。
* 如果你把 MCP 配置提交到 Git：不要把 token/key 直接写进文件。
* 若你发现“上下文缩水很快/工具列表很长”：优先禁用不必要的 MCP。

---

## 11. 最小启用集（按技术栈给出可落地的“默认方案”）

这里的目标是：不要一上来全开 ECC 的所有功能（尤其是 MCP/插件/钩子），而是按项目栈选择一个“够用且可维护”的最小集合。

### 11.1 TypeScript / React / Next.js 项目（推荐起步）

Rules（必装）：

* `rules/common/`
* `rules/typescript/`

Skills（推荐）：

* `skills/coding-standards`
* `skills/tdd-workflow`
* `skills/verification-loop`
* `skills/security-review`
* `skills/backend-patterns`（有 API/DB）
* `skills/frontend-patterns`（有复杂 UI）
* `skills/strategic-compact`（会话长时非常实用）
* 可选：`skills/continuous-learning` 或 `skills/continuous-learning-v2`

Commands（推荐日常链路）：

* `/plan` → `/tdd` → `/code-review` → `/verify pre-pr`
* 有关键用户旅程：加 `/e2e`

MCP（建议先启用 3-6 个内）：

* `context7`：查文档（省掉大量复制粘贴）
* `github`：PR/issue 操作（如果你真的常用 MCP 而不是 gh CLI）
* `firecrawl`：需要抓网页时再启用
* `supabase`：确实用 Supabase 时才启用
* 不建议默认启用：`filesystem`（权限面大）、`memory`（工具增多会压缩上下文）

Hooks（建议先上“轻量且收益高”的部分）：

* strategic compact（提醒你在里程碑节点 `/compact`）
* console.log 审计（Edit 后提醒 + Stop 审计）
* Prettier 自动格式化（团队已统一 Prettier 时收益很高；否则先别开，避免与现有格式化策略冲突）

### 11.2 Python / Django 项目

Rules（必装）：

* `rules/common/`
* `rules/python/`

Skills（推荐）：

* `skills/python-patterns`
* `skills/python-testing`
* `skills/security-review`
* Django 项目额外：`skills/django-patterns`、`skills/django-security`、`skills/django-tdd`、`skills/django-verification`
* DB 重：`skills/postgres-patterns`

Commands（推荐）：

* `/plan` → `/tdd`（后端逻辑）→ `/python-review` → `/verify`

MCP（按需）：

* `context7`（通用）
* `github`（按需）
* `firecrawl`（按需）

Hooks（按需）：

* black/ruff（团队若统一格式化）
* mypy/pyright（项目若有类型标注约束）

### 11.3 Go 项目

Rules（必装）：

* `rules/common/`
* `rules/golang/`

Skills（推荐）：

* `skills/golang-patterns`
* `skills/golang-testing`
* `skills/verification-loop`
* `skills/security-review`

Commands（推荐）：

* `/go-test`（TDD/测试）
* `/go-build`（build/vet 修复）
* `/go-review`（审查）

Hooks（推荐）：

* gofmt/goimports（确保一致性）
* go vet/staticcheck（按项目习惯启用）

---

## 12. 常用工作流（把 rules+skills 组合起来用）

### 12.1 规划 → 实现（TDD）→ 审查 → 验证

```text
/plan "把登录从 session 改成 JWT，并补齐测试"
/tdd
/code-review
/verify
```

### 12.2 交付前安全审查

```text
/security
/security-scan
```

---

## 13. OpenCode 支持（可选）

ECC 也提供 OpenCode 的插件形态（仓库文档名为 “OpenCode ECC Plugin”）：

```bash
npm install opencode-ecc
```

然后在你的 `opencode.json` 中启用：

```json
{
  "plugin": ["opencode-ecc"]
}
```

参考：`https://raw.githubusercontent.com/affaan-m/everything-claude-code/main/.opencode/README.md`

---

## 14. 参考链接

* 仓库主页：`https://github.com/affaan-m/everything-claude-code`
* 简体中文 README：`https://github.com/affaan-m/everything-claude-code/blob/main/README.zh-CN.md`
* Rules 安装与结构：`https://github.com/affaan-m/everything-claude-code/blob/main/rules/README.md`
* Shorthand guide：`https://github.com/affaan-m/everything-claude-code/blob/main/the-shortform-guide.md`
* Longform guide：`https://github.com/affaan-m/everything-claude-code/blob/main/the-longform-guide.md`
