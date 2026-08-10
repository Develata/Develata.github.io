---
title: Memorix
date: 2026-08-08
order: 6
---

# Memorix 使用指南

## 1. Memorix 是什么

[GitHub Repo](https://github.com/AVIDS2/memorix)

Memorix 是一个面向 Coding Agent 的 **cross-agent persistent memory layer**。它通过 MCP 向 OpenCode、Claude Code、Codex、Cursor、Gemini CLI 等 Agent 暴露统一的项目记忆，并以 Git 项目作为默认的 memory scope。

和常见的“向量数据库 + 自动召回”方案相比，Memorix 更值得关注的地方不是 embedding，而是它对 **memory 本身的建模**：

- **Observation Memory**：事实、踩坑、修复、实现笔记
- **Reasoning Memory**：决策理由、备选方案、约束、风险
- **Git Memory**：从 Git commit 中提取的工程事实
- **Code Memory**：文件、symbol、依赖关系以及 memory 与当前代码之间的 freshness
- **Curated Long-term Memory**：经过 review 的 episodic / semantic / procedural memory
- **Compact Continuity**：保存 host compaction 后真正值得延续的上下文

它的一个核心设计可以概括成：

```text
write != trust != inject
```

普通 observation 被写入，并不代表它自动成为未来上下文中的“永久真理”。

Long-term memory 需要经过显式的生命周期：

```text
candidate
    ↓
qualify
    ↓
approve
    ↓
archive / supersede
```

这比“所有聊天都 embedding 后丢进 vector DB”更适合长期开发项目，因为后者非常容易出现过期设计、旧分支实现、临时猜测与新事实互相污染的问题。

官方资料：

- https://github.com/AVIDS2/memorix
- https://github.com/AVIDS2/memorix/blob/main/docs/SETUP.md
- https://opencode.ai/docs/mcp-servers/
- https://opencode.ai/docs/rules/

---

## 2. 为什么在 OpenCode + Oh My OpenCode 中选择 Memorix

我目前使用的是：

```text
OpenCode
+
Oh My OpenCode / OMO
+
Memorix
```

在选择 Memory 系统时，我主要比较过 Memorix 与 GrayMatter。

GrayMatter 的优势是极简、Go 单体、本地优先，并且作为纯 MCP memory 与 OMO 的职责边界非常干净；Memorix 的优势则是 **memory ontology 更成熟**，从一开始就考虑了 provenance、scope、reasoning、retention、long-term lifecycle 与跨 Agent 使用。

最终选择 Memorix 的主要原因是：

> 一个长期运行的 Memory 系统，如果一开始的领域模型过弱，以后积累几千、几万条记忆后再修改底层 ontology，迁移成本会非常高。

因此这里更愿意提前支付一些架构复杂度，换取更完整的 memory semantics。

不过 Memorix 自身现在也已经包含 orchestration、memcode、dashboard、team 等更大的功能面，所以在 OMO 环境中不建议全部启用。

本文采用的边界是：

```text
                    OpenCode
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
     Oh My OpenCode             Memorix MCP
     orchestration                memory
          │                         │
          └──────── Agent ──────────┘
```

即：

- **OMO：唯一的 orchestration authority**
- **Memorix：persistent-memory authority**
- **Git / Repository：代码事实的最终 source of truth**

暂时不使用 `memorix orchestrate`，也暂时不打开 Memorix 的自动 session hooks。

这种配置的目标不是追求“功能全部打开”，而是保证系统的职责边界长期保持清楚。

---

## 3. 安装

### 3.1 环境要求

当前 Memorix 要求：

```text
Node.js >= 22.18.0
Git
```

项目 identity 会从真实 Git root / remote metadata 派生，因此最好在正常的 Git repository 中使用。

检查环境：

```bash
node --version
git --version
opencode --version
```

### 3.2 安装 Memorix

```bash
npm install -g memorix

memorix --version
```

本文实测版本：

```text
1.4.2
```

安装过程中可能看到类似：

```text
npm warn deprecated ...
npm warn allow-scripts ...
better-sqlite3 ...
```

只要最终安装成功，并且：

```bash
memorix --version
```

能够正常输出版本号，可以继续初始化。

---

## 4. 初始化全局配置

执行：

```bash
memorix init --global
```

全局配置主要位于：

```text
~/.memorix/config.toml
~/.memorix/.env
```

项目也可以通过 Git root 下的：

```text
memorix.toml
```

覆盖全局默认值。

初始化过程会询问几个关键选项。

### 4.1 Memory LLM

```text
LLM provider (for smart dedup and fact extraction):

● None
○ OpenAI
○ Anthropic
○ OpenRouter
○ Custom
```

第一阶段选择：

```text
None
```

Memorix 的 Memory LLM 主要增强：

- fact extraction
- memory formation
- deduplication
- summary
- rerank

它不是 Memorix 存储和 BM25 检索的硬依赖。

这里先不配置模型，可以减少部署初期的变量，先验证最基础的：

```text
OpenCode
    ↓
MCP
    ↓
Memorix
    ↓
SQLite / Search
```

之后再独立配置 `[memory.llm]`。

> 不要把 Memorix 的 memory model 与 OMO 的 coding model 混在一起。两者是不同职责。

### 4.2 Embedding

```text
Embedding provider (for semantic search):

● Off (BM25 fulltext only)
○ API
○ FastEmbed
```

第一阶段选择：

```text
Off (BM25 fulltext only)
```

Memorix 本身是 **keyword/BM25 first** 的检索设计。

配置 embedding 后，它主要作为语义 fallback，用于：

- paraphrase
- 中英文表达差异
- 关键词没有直接重合的语义召回

因此没有必要在数据库还完全为空的时候先优化 embedding。

当前策略：

```text
阶段 1:
BM25 only

阶段 2:
BM25
  ↓ no good match
Semantic fallback
```

以后如果需要多语言 semantic retrieval，可以再考虑 API embedding，例如 Qwen3 Embedding 一类模型。

### 4.3 Git post-commit capture

```text
Enable Git post-commit memory capture by default?

○ Yes
● No
```

选择：

```text
No
```

原因是第一阶段不希望任何自动写入机制决定 memory policy。

真实项目中经常存在：

```text
fix typo
wip
format
update lockfile
debug
try again
merge ...
```

如果第一天就把每个 commit 自动转成 memory，数据库很容易先积累噪音。

因此先保持：

```text
Git History
    │
    └── 手动 ingest（需要时）
```

等熟悉 Git Memory 的粒度后，再决定是否开启 Git hook。

### 4.4 Session start injection

```text
Session start injection mode:

● Minimal
○ Full
○ Silent
```

选择：

```text
Minimal
```

这是一个比较合适的平衡：

- `Full`：主动注入更多 memory/context，与 OMO context management 的重叠更大
- `Silent`：最干净，但 Agent 可能忘记自己拥有 Memorix
- `Minimal`：只保留轻量提示，让 Agent 知道需要时应该查询 memory

最终初始配置可以概括成：

```text
Memory LLM:
None

Embedding:
Off / BM25 only

Git post-commit auto capture:
No

Session start injection:
Minimal
```

---

## 5. 接入 OpenCode / Oh My OpenCode

### 5.1 设计原则

不要把 Memorix 写进 OMO 自己的 orchestration 配置。

Memorix 应该注册在 **OpenCode 的 MCP 层**：

```text
~/.config/opencode/opencode.json
```

而不是让它与 OMO 一起争夺 agent orchestration。

OpenCode 官方支持在 `mcp` 中注册 MCP Server，Memorix 的 stdio MCP 入口是：

```bash
memorix serve
```

### 5.2 先备份 OpenCode 配置

```bash
cp -a ~/.config/opencode \
  ~/.config/opencode.pre-memorix.$(date +%Y%m%d-%H%M%S)
```

### 5.3 使用 noHooks 模式接入

本文推荐：

```bash
memorix setup --agent opencode --global --noHooks
```

而不是第一天直接：

```bash
memorix setup --agent opencode --global
```

`--noHooks` 会保留 MCP 与 guidance，但跳过 Memorix 的自动 hook capture。

这是因为 OMO 本身已经深度使用 OpenCode hooks，包括 session、tool execution、context transform 与 compaction 等生命周期能力。

因此先使用：

```text
OMO
│
├── orchestration
├── context management
└── compaction

Memorix
│
├── MCP
├── project memory
├── reasoning
└── retrieval
```

而不是：

```text
OMO hooks ─────┐
               ├── 同时管理 session lifecycle
Memorix hooks ─┘
```

实测 setup 输出：

```text
Memorix Setup

opencode: MCP config -> ~/.config/opencode/opencode.json
opencode: guidance -> ~/.config/opencode/AGENTS.md
opencode: MCP server command is `memorix serve`

Setup finished.
```

---

## 6. 验证 MCP 与 Memorix 状态

重启 OpenCode 后：

```bash
opencode mcp list
```

应该能看到：

```text
✓ memorix connected
    memorix serve
```

OpenCode 官方也提供：

```bash
opencode mcp ls
```

作为短命令。

然后检查 Memorix：

```bash
memorix doctor agents --agent opencode
memorix status
```

正常状态中比较重要的字段：

```text
Search: BM25 fulltext
Embedding: None

Memory LLM lane:
unset

Embedding lane:
off

Memory behavior:
inject=minimal

Git behavior:
autoHook=false

Git hook:
not installed

Server:
transport=stdio
```

项目 identity 也应该正确，例如：

```text
Name: deve-sub
ID: Develata/deve-sub
Root: /home/pwh/deve-sub
Git remote: https://github.com/Develata/deve-sub.git
```

这说明 Memorix 没有简单地把某个绝对目录路径当成项目唯一 identity，而是已经识别 Git repository。

---

## 7. 关于 AGENTS.md 的一个实测注意事项

OpenCode 支持两层 AGENTS guidance：

```text
~/.config/opencode/AGENTS.md
    全局规则

<project>/AGENTS.md
    项目规则
```

`memorix setup --agent opencode --global --noHooks` 正常会写入全局：

```text
~/.config/opencode/AGENTS.md
```

这比较符合本文想要的结构：

```text
Global AGENTS
    ↓
“如何使用 Memorix”

Project AGENTS
    ↓
“这个项目自己的工程规则”
```

### 7.1 guidance-outdated

本次实测中运行：

```bash
memorix doctor agents --agent opencode
```

曾出现：

```text
opencode: repairable
  Guidance: guidance-outdated
```

随后运行：

```bash
memorix repair agents --agent opencode
```

虽然 doctor 变成：

```text
opencode: ok
```

但 repair 同时给当前 repository 的：

```text
./AGENTS.md
```

追加了一整份：

```text
# Memorix — Project Memory Tools
```

于是形成：

```text
~/.config/opencode/AGENTS.md
    Memorix guidance

./AGENTS.md
    Memorix guidance（再次出现）
```

两份规则高度重复。

### 7.2 推荐处理

如果希望项目的 `AGENTS.md` 只保存项目自身规则，可以恢复：

```bash
git restore -- AGENTS.md
```

然后保留：

```text
~/.config/opencode/AGENTS.md
```

中的 Memorix guidance。

检查：

```bash
grep -Rni "memorix" \
  ./AGENTS.md \
  ~/.config/opencode/AGENTS.md \
  2>/dev/null
```

> 如果 `doctor` 以后再次因为 project guidance 不存在而显示 repairable，不要立刻无脑运行 repair。先确认它准备修改的是 global 还是 project guidance。

这个行为不是 Memorix MCP 本身的问题，而是 integration guidance scope 需要自己保持清楚。

---

## 8. Memorix 默认 guidance 的行为

Memorix 给 OpenCode 写入的默认 guidance 质量总体不错。

### 8.1 Memory Autopilot

非 trivial coding task 默认先调用：

```text
memorix_project_context
```

其目标不是疯狂搜索历史记录，而是构造一个 bounded、task-lensed brief。

大致流程：

```text
User Task
   ↓
memorix_project_context
   ↓
Compact Workset
   ↓
Start-here files
   ↓
Read current code
```

这比：

```text
memorix_search
memorix_search
memorix_search
memorix_search
```

更能限制 memory 对 context window 的污染。

### 8.2 Progressive Disclosure

成功获取完整 project context 后，默认不继续重复 retrieval。

只有缺少某个具体事实时，才继续调用：

```text
memorix_context_pack
memorix_search
memorix_detail
```

这属于典型的 progressive disclosure：

```text
先看索引
  ↓
只在需要时展开
```

### 8.3 Read-only 不自动写 Memory

默认 guidance 还规定：

> 如果用户要求 read-only work，不要仅仅为了保存 assessment 而调用 `memorix_store`。

这是很重要的污染控制。

Code review、临时猜测、探索性意见，不应该默认被升级为未来项目事实。

### 8.4 Long-term Candidate

如果在 `memorix_store` 中使用 `longTerm`，创建的只是：

```text
candidate
```

并不会立刻进入未来 task context。

Long-term memory 需要 operator 后续：

```bash
memorix memory long-term qualify ...
memorix memory long-term approve ...
```

这也是 Memorix 最值得保留的设计之一。

---

## 9. 第一次端到端测试

完成安装后，不要只看 Agent 是否告诉你“保存成功”。

应该测试：

```text
MCP write
    ↓
persistent storage
    ↓
CLI independent retrieval
```

### 9.1 让 OMO / OpenCode 写一条测试决策

在 OpenCode 中输入：

```text
使用 Memorix 保存一个项目级工程决策：
MEMORIX_DEPLOY_TEST_20260808。

内容是：
deve-sub 项目执行数据库 schema migration 前必须先 dry-run。

将它作为项目 decision 保存，
并告诉我你实际调用的 Memorix 工具。
```

实测 Agent 调用了：

```text
memorix_memorix_store
```

参数包括：

```text
type=decision
visibility=project
topicKey=decision/db-schema-migration-dry-run
```

并生成：

```text
Observation ID: #1
Project: Develata/deve-sub
```

### 9.2 在 Shell 独立验证

退出 Agent 的自我报告，直接运行：

```bash
memorix memory search \
  --query "MEMORIX_DEPLOY_TEST_20260808"
```

实测：

```text
Found 1 observation(s)

obs:1@Develata/deve-sub
[DECISION]
deve-sub DB schema migration dry-run required
```

这一步比 Agent 说“已保存”更重要，因为它证明：

```text
OpenCode / OMO
     ↓
MCP
     ↓
Memorix Store
     ↓
Persistent Project Memory
     ↓
CLI Search
```

链路是真正成立的。

---

## 10. 跨 Session Recall 测试

写入成功只是第一半。

真正需要验证的是：

> 新 Session 是否能在没有旧聊天上下文的情况下主动找到这个 decision。

完全退出当前 OpenCode，然后重新启动：

```bash
cd ~/deve-sub
opencode
```

新建 session，不恢复旧对话。

然后输入：

```text
我需要修改数据库 migration 流程。

这个项目过去有没有关于 migration 执行安全性的工程决策？

请先查询 Memorix，再回答。
```

这里故意 **不要** 提供：

```text
MEMORIX_DEPLOY_TEST_20260808
```

因为目标是测试实际 recall，而不是精确关键词命中。

理想行为：

```text
memorix_project_context
        ↓
或 memorix_search
        ↓
找到 [DECISION]
        ↓
回答 migration 前必须 dry-run
```

如果这个测试成功，Memorix 的基础部署才算真正闭环。

---

## 11. 当前推荐的最终状态

第一阶段不追求全部功能打开。

推荐：

```text
Memory LLM:
OFF

Embedding:
OFF / BM25 only

Git Auto Capture:
OFF

Memorix OpenCode Hooks:
OFF

Session Injection:
Minimal

MCP:
ON

Project Memory:
ON
```

整体架构：

```text
                         Git Repository
                         source of truth
                              ▲
                              │ verify
                              │
                    ┌─────────┴─────────┐
                    │      OpenCode     │
                    └─────────┬─────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
                 ▼                         ▼
          Oh My OpenCode               Memorix
           orchestration              persistent
              context                  memory
             subagents                 reasoning
                 │                     retrieval
                 └──────────┬──────────────┘
                            ▼
                        Main Agent
```

这里有一个重要原则：

> Memory 应该帮助 Agent 找到 truth，而不是替代 truth。

存储的 memory 即使曾经正确，也可能因为代码演进而过期。最终工程事实仍然应该回到当前 repository / tests / Git 中确认。

---

## 12. 暂时不建议开启的功能

### 12.1 Memorix Orchestration

不要运行：

```bash
memorix orchestrate ...
```

因为 OMO 已经负责 agent orchestration。

如果同时让两个系统承担 delegation / worker coordination，长期只会增加职责重叠。

### 12.2 Background HTTP Server

普通 OpenCode 单客户端使用 stdio：

```bash
memorix serve
```

已经足够。

暂时不需要：

```bash
memorix background start
```

HTTP 模式更适合：

- 多客户端共享
- dashboard
- Docker
- 独立服务端

### 12.3 Full MCP Tool Profile

`memorix serve` 默认使用 compact 的 `micro` profile。

不要为了“功能多”立即切：

```text
full
```

MCP tool schema 本身也会消耗 Agent context。

对于 Coding Agent 来说：

> 工具数量不是越多越好，暴露给模型的决策面越小，行为通常越稳定。

---

## 13. 后续升级路线

等真实项目中积累了一批 memory，再逐项打开能力。

推荐顺序：

### 13.1 Memory LLM

先增加：

```toml
[memory.llm]
provider = "..."
model = "..."
```

用于：

- fact extraction
- formation
- dedup
- summary

而 OMO / OpenCode 的 coding model 保持独立。

### 13.2 Embedding

如果发现以下场景 BM25 明显召回不足：

- 中文需求 + 英文 memory
- 同义改写
- 没有共同关键词的语义查询

再配置 embedding。

例如 OpenRouter / OpenAI-compatible endpoint：

```toml
[embedding]
provider = "api"
base_url = "https://openrouter.ai/api/v1"
model = "qwen/qwen3-embedding-8b"
```

Memorix 仍然保持 keyword first，semantic retrieval 作为 fallback。

### 13.3 Git Memory

等明确知道哪些 commit 值得进入 memory 后，再考虑：

```bash
memorix git-hook
```

或者继续手动：

```bash
memorix ingest commit
memorix ingest log --count 20
```

### 13.4 OpenCode Hooks

最后才考虑重新运行完整 integration：

```bash
memorix setup --agent opencode --global
```

开启自动 capture 前应该先确认：

- memory 类型划分是否符合预期
- 自动 capture 会不会制造大量 observation
- OMO 与 Memorix compaction / session hooks 是否存在重复行为
- context injection 是否明显膨胀

原则：

> 先证明 Memory 值得信任，再给它自动化权力。

---

## 14. 常用命令

### 14.1 状态检查

```bash
memorix status

memorix doctor agents --agent opencode

opencode mcp list
```

### 14.2 Memory 检索

```bash
memorix memory search \
  --query "database migration"
```

### 14.3 查看具体记录

```bash
memorix memory detail <ref>
```

例如：

```text
obs:1@Develata/deve-sub
```

### 14.4 查看 Timeline

```bash
memorix memory timeline
```

### 14.5 Long-term Memory

```bash
memorix memory long-term list
```

典型生命周期：

```bash
memorix memory long-term add ...
memorix memory long-term qualify --id <id> --reason "..."
memorix memory long-term approve --id <id> --reason "..."
```

### 14.6 MCP Server

```bash
memorix serve
```

通常由 OpenCode 自动启动，不需要手动常驻。

---

## 15. 配置文件位置

最终主要涉及以下位置：

```text
~/.memorix/
├── config.toml
├── .env
└── data/
    └── persistent memory data

~/.config/opencode/
├── opencode.json
│   └── Memorix MCP
└── AGENTS.md
    └── Memorix global usage guidance

<project>/
├── AGENTS.md
│   └── 项目自己的规则
├── memorix.toml
│   └── 可选的项目级 Memorix override
├── .omo/
│   └── OMO 项目配置（如有）
└── .git/
```

推荐保持：

```text
OpenCode Config
    管工具与 MCP

OMO Config
    管 Agent orchestration

Global AGENTS
    管个人统一的 Memorix 使用 policy

Project AGENTS
    管项目工程规则

Memorix Database
    管不断演化的项目知识
```

这样不会把 memory runtime 的安装细节与 repository 自身规范混在一起。

---

## 16. 总结

Memorix 最值得使用的地方，不是“让 Agent 记得更多”，而是尝试解决：

```text
什么值得记？
谁说的？
属于哪个项目？
为什么这么决定？
现在还有效吗？
是否值得成为长期知识？
旧知识如何被新知识取代？
```

如果只是想要一个简单的跨 Session KV / vector store，Memorix 可能显得偏重。

但对于长期维护的大型工程，我更愿意使用一个一开始就承认 **memory 是有生命周期、有来源、有作用域的知识系统** 的方案。

目前在 OpenCode + Oh My OpenCode 中，我选择的部署策略是：

```text
OMO = orchestration
Memorix = memory
Git = truth
```

并从最小配置开始：

```text
stdio MCP
micro tools
BM25 only
minimal injection
no hooks
no auto Git capture
```

等真实 memory 数据出现以后，再根据实际召回失败与噪音来源增加：

```text
Memory LLM
Embedding
Git Memory
Auto Capture
```

这种演进方式比第一天打开全部自动化更慢一点，但系统的行为更容易观察，也更容易保持长期干净。
