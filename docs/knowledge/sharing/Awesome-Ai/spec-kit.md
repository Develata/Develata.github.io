---
title: Spec Kit（spec-kit）
date: 2026-03-02
order: 6
---

# Spec Kit（spec-kit）使用指南

## 1. Spec Kit 是什么
[Github Repo](https://github.com/github/spec-kit)

Spec Kit 是 GitHub 出品的“Spec Driven Development”工具包：用 `specify` CLI + 一套 `speckit.*` 命令模板，把“想法 -> 规格 -> 计划 -> 任务 -> 实现”固化成可重复的工程流程。

核心能力：
* 一条命令初始化项目内的 `.specify/` 工作区与 AI 工具命令集（Claude/Codex/Cursor/Gemini/OpenCode 等）。
* 用 `speckit.*` 命令生成 `specs/<feature>/` 下的规格、计划与任务拆解。
* 支持两种脚本模板：`--script sh`（Bash）与 `--script ps`（PowerShell）。
* 提供扩展系统（extensions）：在 `.specify/extensions.yml` 声明并按需启用额外命令/规则。

---

## 2. 安装与部署

> Spec Kit 本质是一个 Python CLI（命令为 `specify`），仓库内文档使用 `uv`(python `pip install uv`) 安装/运行。

### 2.1 macOS / Windows / Linux

> README 主要以 `uv`（跨平台）安装为例。

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
specify --help
```

一次性运行（免安装）：

```bash
uvx --from git+https://github.com/github/spec-kit.git specify --help
```

### 2.2 Docker（可选）

如需容器化，通常做法是在镜像中安装 `uv` 与 `specify-cli`，并挂载项目目录运行 `specify`。

---

## 3. 快速上手（Happy Path）

### 3.1 初始化（项目根目录）

```bash
cd /path/to/your/project
specify init
```

常用参数：

```bash
specify init --ai claude
specify init --ai codex
specify init --script sh   # Bash 模板
specify init --script ps   # PowerShell 模板（无需 WSL）
```

> 注意：`--ai generic` 必须同时指定 `--ai-commands-dir`（命令输出目录），否则会报错并退出。

### 3.2 生成一个 feature 的规格/计划/任务（以 Claude Code 为例）

1. `/speckit.constitution` -> `.specify/memory/constitution.md`
2. `/speckit.specify` -> `specs/<feature>/spec.md`
3. `/speckit.plan` -> `specs/<feature>/plan.md` + `research.md` + `data-model.md` + `quickstart.md` + `contracts/`
4. `/speckit.tasks` -> `specs/<feature>/tasks.md`（注意：`tasks.md` 不由 `/speckit.plan` 生成）

> 注意：`<feature>` 默认来自当前 git 分支（如 `001-photo-albums`）；非 git 工作流可设置 `SPECIFY_FEATURE`。

---

## 4. 深度功能（你会真正用到的亮点）

### 4.1 `specify check`：环境自检

```bash
specify check
```

它会检查依赖与部分常用工具是否可用，并对 Claude 做额外路径提示（例如 `~/.claude/local/claude`）。

### 4.2 Extensions：把新能力“挂载”到 Spec Kit

```bash
specify extension --help
```

扩展相关目录：`.specify/extensions.yml`、`.specify/extensions/.registry`、`.specify/extensions/.cache/`。

---

## 5. Spec 生成文件怎么用（重点）

Spec Kit 的输出以 `specs/<feature>/` 为中心。常见顺序：先写规格（spec）再写计划（plan）再拆任务（tasks），最后实现与验收。

> 注意：`<feature>` 默认来自当前 git 分支名；不走 git 分支流时，先设置 `SPECIFY_FEATURE`。

### 5.1 输出清单（每个文件怎么用）

| 路径 | 生成来源 | 你用它做什么（建议亲自审一遍） | 下一步 |
| --- | --- | --- | --- |
| `spec.md` | `/speckit.specify` | 写清用户故事（含优先级 P1/P2/P3）、验收场景（Given/When/Then）、边界条件（Edge Cases）、需求（FR-xxx）、成功标准（SC-xxx） | 把 “NEEDS CLARIFICATION” 清零后再做 plan |
| `plan.md` | `/speckit.plan` | 实现路线图：技术上下文、门禁（Constitution Check）、项目结构选择、复杂度偏离说明、分阶段交付与验证点 | 以它为准做任务拆解 |
| `research.md` | `/speckit.plan` | Phase 0：把 `spec.md` 里的不确定项逐条补齐（尤其是 “NEEDS CLARIFICATION”） | 结论要回写到 plan/contracts/data-model |
| `data-model.md` | `/speckit.plan` | Phase 1：把关键实体/字段/关系/约束写成可实现的数据模型 | 先对齐模型，再写代码与测试 |
| `quickstart.md` | `/speckit.plan` | Phase 1：最短验证路径（命令块 + 成功判据），用于 smoke test/交付演示 | 实现完成后用它做最后验收 |
| `contracts/` | `/speckit.plan` | Phase 1：接口契约（例如 OpenAPI/JSON schema/事件定义），用于契约测试与 mock | 契约优先更新，再改实现与测试 |
| `tasks.md` | `/speckit.tasks` | 可执行清单：按 User Story 分组；任务带 ID（`T001`…）；`[P]` 可并行；可选 tests（仅 spec 要求时才写） | 按任务逐条落地并回填验证结果 |

典型写法（示意，按你项目改字段即可）：

```md
## Acceptance Scenarios
### SC-001: Anonymous user can sign up
Given ...
When ...
Then ...

- [ ] T001 [P] Implement signup endpoint
Done when: ...
```

### 5.2 迭代建议（不容易跑偏的最小闭环）

1. 先把 `spec.md` 的验收场景写到位（Happy path + 失败路径）。
2. 发现不确定性就让 `/speckit.plan` 补齐 `research.md`，把结论转成约束条目。
3. 数据/接口变化先落到 `data-model.md` 与 `contracts/`，再改实现。
4. 每次大改 spec 后，重新生成/修订 `plan.md` 和 `tasks.md`（避免任务与规格脱节）。

---

## 6. 进阶/架构信息（精准速查）

Spec Kit 的数据都落在项目目录中（不使用数据库），路径在 macOS/Windows/Linux 下保持一致（均为项目相对路径）。

### 6.1 关键目录

| 位置 | 用途 |
| --- | --- |
| `.specify/` | 工作区根目录（memory/templates/scripts/extensions 等） |
| `.specify/memory/constitution.md` | 项目“宪法”；若已存在，初始化不会覆盖 |
| `.specify/templates/` | 命令模板（例如 `constitution-template.md`） |
| `.specify/scripts/` | 内置脚本（按 `--script sh|ps` 生成 Bash/PowerShell 版本） |
| `.specify/extensions.yml` | 扩展启用清单（YAML） |
| `.specify/extensions/.registry` | 扩展注册表（已安装/启用状态） |
| `.specify/extensions/.cache/` | 扩展与 catalog 缓存目录 |
| `.specify/extensions/<ext_id>/` | 单个扩展的本地文件与配置 |
| `.specify/extensions/<ext_id>/<ext_id>-config.yml` | 扩展项目级配置（可选） |
| `.specify/extensions/<ext_id>/local-config.yml` | 扩展本地配置（可选，通常不入库） |

---

### 6.2  `specify init` 参数（以源码为准）

| 参数 | 是否必填 | 说明 |
| --- | --- | --- |
| `--ai <name>` | 否 | 选择 AI 工具模板；不传则交互式选择 |
| `--script sh|ps` | 否 | 选择脚本模板类型；仅接受 `sh` 或 `ps` |
| `--here` | 否 | 将模板写入当前目录（而非创建新目录） |
| `--force` | 否 | 跳过覆盖/危险操作确认 |
| `--no-git` | 否 | 不要求/不依赖 git 分支名推导 feature |
| `--github-token <token>` | 否 | GitHub API Token（用于拉取最新模板 release） |
| `--skip-tls` | 否 | 跳过 TLS 校验（仅排障） |
| `--debug` | 否 | 打印调试日志 |
| `--ai-commands-dir <dir>` | 条件必填 | 仅 `--ai generic` 需要：把命令文件输出到指定目录 |
| `--ai-skills` | 否 | 将 `speckit.*` 安装为 Agent Skills（Prompt.MD）；需要同时指定 `--ai` |

---

### 6.3 环境变量（含 extensions 规则）

| 变量 | 是否必填 | 用途 |
| --- | --- | --- |
| `GH_TOKEN` | 否 | GitHub API Token（等价替代 `--github-token`） |
| `GITHUB_TOKEN` | 否 | GitHub API Token（等价替代 `--github-token`） |
| `SPECIFY_FEATURE` | 否 | 覆盖 feature 名推导（脚本/命令会优先用它） |
| `CODEX_HOME` | 否 | 使用 Codex CLI 时需指向项目内 `.codex/`（示例：`export CODEX_HOME="$PWD/.codex"`） |
| `SPECKIT_<EXT>_<SECTION>_<KEY>` | 否 | 扩展配置覆盖：会覆盖扩展 YAML 中对应键（`<EXT>` 会先转为全大写并把 `-` 替换为 `_`） |

### 6.4 各 AI 工具命令落盘位置（常用）

| `--ai` 值 | 命令目录（项目内） |
| --- | --- |
| `claude` | `.claude/commands/` |
| `codex` | `.codex/prompts/` |
| `cursor-agent` | `.cursor/commands/` |
| `gemini` | `.gemini/commands/` |
| `opencode` | `.opencode/command/` |
| `copilot` | `.github/agents/` |
| `windsurf` | `.windsurf/workflows/` |
| `generic` | 由 `--ai-commands-dir` 指定 |

AI Skills 安装目录（`specify init --ai <name> --ai-skills`）：默认在对应 agent 目录下创建 `skills/`；Codex 使用 `.agents/skills/`；若 agent 目录不存在则回退到 `.agents/skills/`。

> 注意：仓库源码里支持的 `--ai` 远不止上表（例如 `qwen`、`kilocode`、`roo`、`amp`、`amazonq` 等）；需要全量列表时，读 `src/specify_cli/__init__.py` 的 `AGENT_CONFIG`。

### 6.5 自定义生成模板（按项目改写输出结构）

初始化后，模板在 `.specify/templates/`；常见包括 `spec-template.md`、`plan-template.md`、`tasks-template.md`、`constitution-template.md`。你想改“生成的文档长什么样”，就改这些模板，再重新运行对应的 `/speckit.*` 命令生成新版本。

---

## 7. FAQ（常见坑）

### 7.1 我没用 git 分支，`specs/<feature>/` 生成到哪？

设置 feature 名再运行命令即可：

```bash
export SPECIFY_FEATURE="001-my-feature"
```

### 7.2 `specify init --script bash` 为什么报错？

当前源码只接受 `--script sh` 或 `--script ps`。
