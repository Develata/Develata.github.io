---
title: OpenClaw Skills 推荐
date: 2026-03-09
order: 2
---

# OpenClaw Skills 推荐

本文主要参考：[ClawHub](https://clawhub.ai/) 与 [OpenClaw Skills 官方文档](https://docs.openclaw.ai/skills/overview)

## 0. 最短安装建议

如果你不想一上来装太多，可以先按下面这个顺序来：

1. 先装 `skill-vetter`：先审查，再决定装不装其他 skill。
2. 开发场景优先装 `github`。
3. 查资料场景优先装 `tavily-search`。
4. 想让 agent 更稳一点，再装 `using-superpowers`。
5. 真的需要网页自动化时，再装 `agent-browser`。

一个够用的起步组合：

```bash
clawhub install skill-vetter
clawhub install github
clawhub install tavily-search
clawhub install using-superpowers
```

如果你明确需要浏览器自动化，再补：

```bash
clawhub install agent-browser
```
---

## 1. skills 装到哪里了

很多人装完以后第一反应都是：`为什么我明明装了，但当前 session 里没看到？`

`clawhub` 默认会优先装到当前工作目录的 `./skills`；如果你已经配置了 OpenClaw workspace，也可能落到对应 workspace。

常见位置：

* 当前 agent / 当前项目专用：`<workspace>/skills`
* 全局共享：`~/.openclaw/skills`

所以如果一个 agent 能看到 skill，另一个 agent 看不到，通常不是没装上，而是 **skill 装到了某个 workspace，而不是全局位置**。

---

## 2. 先看安全，再看功能

ClawHub 是公开技能市场，不是所有 skill 都由 OpenClaw 官方维护。

官方文档明确提到：

* 安装前会显示将写入的文件与依赖变更。
* 社区举报达到阈值的 skill 会被自动隐藏。
* 对会联网、会执行命令、会控制浏览器的 skill，应该先审查再安装。

另外，ClawHub 在 **2026 年 2 月** 出现过恶意 skill 事件，所以现在选 skill 不能只看“功能强不强”，还要看 **权限边界是不是清楚、用途是不是单纯**。

所以我自己的习惯是：

```bash
clawhub install skill-vetter
```

先装它，再去看别的。

---

## 3. 常用命令

```bash
clawhub search "github"
clawhub install skill-vetter
clawhub update --all
clawhub whoami
clawhub login
```
---

## 4. 我最推荐先看的 6 个 skill

### 1）`skill-vetter`

页面：[spclaudehome/skill-vetter](https://clawhub.ai/spclaudehome/skill-vetter)

最适合先装。它的价值不在“帮你做业务”，而在“帮你判断别的 skill 能不能装”。如果你准备长期用 OpenClaw，或者准备在 VPS / 常驻环境里装第三方 skill，这个几乎应该算基础设施。

### 2）`github`

页面：[steipete/github](https://clawhub.ai/steipete/github)

如果你主要用 OpenClaw 做开发，这个基本就是第一优先级，最适合 **仓库浏览、Issue、PR、工程协作流** 这类真实开发任务。

### 3）`tavily-search`

页面：[arun-8687/tavily-search](https://clawhub.ai/arun-8687/tavily-search)

定位很直接：补强网页搜索。涉及“最近更新”“最新资料”“官网怎么写”这类任务时，它的价值很高。

### 4）`using-superpowers`

页面：[zlc000190/using-superpowers](https://clawhub.ai/zlc000190/using-superpowers)

它更像一套 **行为纪律框架**。适合“agent 不是不会做，而是步骤不稳、顺序不对、容易乱试”的场景。

### 5）`prompt-engineering-expert`

页面：[TomsTools11/prompt-engineering-expert](https://clawhub.ai/TomsTools11/prompt-engineering-expert)

适合经常自己写 prompt、系统提示、工作流提示的人。它更适合“把任务描述整理得更可执行”。

### 6）`ontology`

页面：[oswalpalash/ontology](https://clawhub.ai/oswalpalash/ontology)

适合研究、知识组织、结构化笔记和概念建模。如果你希望 OpenClaw 不只是“回一句话”，而是帮你整理概念、搭知识框架，这类 skill 很有价值。

---

## 5. 哪些有用，但不是所有人都先装

### `humanizer`

页面：[biostartechnology/humanizer](https://clawhub.ai/biostartechnology/humanizer)

适合写邮件、润色说明文、降低明显的 AI 味；如果你主要做工程任务，它就不是第一优先级。

### `marketing-skills`

页面：[jchopard69/marketing-skills](https://clawhub.ai/jchopard69/marketing-skills)

更偏市场、运营、活动文案、业务内容场景；如果你的 OpenClaw 更偏内容生产而不是工程协作，它会更有价值。

---

## 6. 哪些我建议谨慎安装

### `agent-browser`

页面：[TheSethRose/agent-browser](https://clawhub.ai/TheSethRose/agent-browser)

这个 skill 很强，但权限也更高。它适合 **网页浏览、页面导航、登录后台、表单操作**；但也因为能接触更多网页状态和浏览器交互，所以不建议新手一上来就把它当常驻基础 skill。

比较稳的做法：

* 先确认你确实需要浏览器自动化
* 先用 `skill-vetter` 审查
* 尽量放在受控环境里使用

### `self-improving-agent`

页面：[pskoett/self-improving-agent](https://clawhub.ai/pskoett/self-improving-agent)

它的优点很明显：能让 agent 通过反思和规则沉淀逐步改进；但问题也很明显：它影响的是 **长期行为方式**，一旦效果不好，排查通常比普通 skill 更麻烦。

所以我的建议是：

* 它不是不能装
* 但不建议一开始就常驻启用
* 更适合你已经有稳定工作流之后再上

---

## 7. 按场景怎么选

### 开发协作

优先：`github`

补充：`using-superpowers`、`prompt-engineering-expert`

### 查资料 / 跟踪最新信息

优先：`tavily-search`

补充：`agent-browser`（仅在确实需要网页自动化时）

### 知识整理 / 研究 / 结构化笔记

优先：`ontology`

补充：`prompt-engineering-expert`

### 文案润色 / 对外表达

优先：`humanizer`

### 市场 / 运营 / 活动内容

优先：`marketing-skills`

---

## 8. 新手最容易踩的几个坑

### 1）装完 skill，不一定当前会话立刻生效

很多时候需要重新开一个 OpenClaw session，或者至少重新进入对应 workspace，skill 才会被重新扫描到。

### 2）你以为装的是“全局”，其实装的是“当前 workspace”

如果你在某个项目目录里执行 `clawhub install ...`，它很可能是装到当前项目 / 当前 agent 的 workspace 里，而不是全局位置。

### 3）第三方 skill 的敏感配置不是“小事”

有些 skill 需要 `env`、`apiKey`、浏览器登录态或者外部服务 token。这类配置直接决定了 skill 能访问什么资源，所以要特别注意放置位置和最小权限。

---

## 9. 推荐节奏

推荐安装顺序：

1. `skill-vetter`
2. `github` 或 `tavily-search`
3. `using-superpowers`
4. `prompt-engineering-expert` 或 `ontology`
5. `agent-browser`
6. `self-improving-agent`

原因很简单：

* 前 3 个最容易立即产生收益
* 中间 2 个更偏“增强工作质量”
* 最后 2 个更强，但也更容易把系统复杂度拉高

## 10. 什么时候该用共享 skill，什么时候该用单 agent skill

如果这个 skill 是你几乎所有 agent 都会反复用到的，比如 `skill-vetter`、`tavily-search` 这种通用型能力，放到全局共享位置会更省事。

如果这个 skill 只服务某一个工作区，比如某个特定项目、某个特定业务流程，放到该 agent 自己的 workspace 里会更干净，也更容易隔离风险。

一个很实用的经验是：

* 通用能力，尽量共享
* 高权限能力，尽量按 agent 隔离
* 和具体项目强绑定的 skill，不要一股脑全局化

## 参考

* [ClawHub](https://clawhub.ai/)
* [OpenClaw Skills Overview](https://docs.openclaw.ai/skills/overview)
* [OpenClaw Skills Safety](https://docs.openclaw.ai/skills/safety)
* [Tom's Hardware: 恶意 ClawHub skill 事件](https://www.tomshardware.com/tech-industry/cyber-security/malicious-moltbot-skill-targets-crypto-users-on-clawhub)
* [The Verge: OpenClaw 技能市场安全问题报道](https://www.theverge.com/news/874011/openclaw-ai-skill-clawhub-extensions-security-nightmare)
