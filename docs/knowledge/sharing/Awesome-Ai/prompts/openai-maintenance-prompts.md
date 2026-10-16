---
title: OpenAI 工程维护 Prompts（改写版）
date: 2026-10-16
order: 4
---
# OpenAI 工程维护 Prompts（改写版）

---

## 来源与使用说明

原文：[Maintaining software with the GPT-6 family](https://developers.openai.com/blog/maintaining-software-with-the-gpt-6-family)，OpenAI Developers，Rodrigo Roim，2026 年 10 月 14 日。

本文按原文的六个工程维护场景整理英文可复制模板。**下面是改写与补充，不是逐字引文，也不是 OpenAI 为任意项目验证过的通用方案。** 第 3 组包含整理者补充的审计流程；原文省略的详细指令没有被“还原”。

使用前替换项目名、可访问的数据源及验证方式。无法读取生产配置、历史运行或内部讨论时，应明确保留证据缺口；没有 Statsig 的仓库不要直接使用第 2、3 组。`/goal` 只是原场景中的命令写法，不保证所有 Agent 支持。

> 这些模板中的修改代码、创建 PR、读取生产资料等动作仍需遵守实际授权与项目规范；复制 Prompt 不代表自动取得这些权限。先审计、再做小范围改动，不以删行数或减少测试数量作为优化目标。

## 1. Dead Code Cleanup — 清理无用代码

```text
Help identify and remove dead or obsolete code from this repository.

Investigate usage across source files, historical pull requests, internal documentation, Slack discussions, feature flag systems such as Statsig, and production profiling data wherever accessible.

Do not assume that missing static references mean code is unused. Consider dynamic dispatch, reflection, external consumers, generated references, and operational fallback paths.

For each cleanup candidate:
- Explain why the code is no longer needed.
- Provide supporting evidence.
- Identify potential behavioral or compatibility risks.
- Make the smallest safe change.
- Run relevant validation and tests.
- Prepare a focused draft PR for human review.

If usage cannot be ruled out confidently, leave the code unchanged and document the uncertainty.
```

## 2. Stale Experiments — 清理过期实验与功能开关

```text
Investigate projects [PROJECT_A] and [PROJECT_B] for obsolete experiments, constant feature gates, and Statsig configurations whose associated code can safely be removed.

Check the current production configuration in Statsig, relevant Git history, previous pull requests, and downstream dependencies.

Preserve observable production behavior and operational safeguards, especially emergency kill switches and intentionally retained controls.

Do not treat SDK fallback values or local development overrides as authoritative production state.

For every verified cleanup:
- Identify the obsolete experiment or gate.
- Explain why removal is safe.
- Reference its Statsig console URL.
- Describe any dependency or compatibility concerns.
- Make a minimal change and validate it.
- Open an independent draft PR for review.

Avoid combining unrelated cleanups into a single large PR.
```

## 3. Repository-Wide Statsig Audit — 全仓库实验配置审计

原文展示了以 `/goal` 开头的场景指令，但为简洁起见省略了部分详细指令。以下是本站整理的扩展模板，不是 OpenAI 公开的完整原始 Prompt。

```text
/goal
Perform a comprehensive, read-only audit of this repository to discover obsolete, constant, abandoned, or fully deployed Statsig gates, configurations, experiments, and layers that could be removed without changing production behavior.

Scope:
- Examine all relevant Statsig projects and configuration inventories.
- Do not limit the search to resources explicitly marked as stale.
- Trace direct and indirect references across the repository.
- Include enums, aliases, constants, wrappers, schemas, generated identifiers, dynamically constructed names, and cross-service consumers.
- Resolve dependencies between experiments and feature flags.
- Investigate all production-referenced constant configurations rather than stopping at an initial shortlist.

Verification:
- Cross-check live production values with source code and configuration history.
- Inspect past PRs and ownership records when available.
- Distinguish permanently enabled features from intentionally retained safety controls.
- Preserve kill switches, operational fallbacks, and legitimate runtime overrides.
- Identify uncertain or unverified cases separately.
- Do not recommend deletion solely because static references are absent.

Performance:
- Estimate the computational cost of obsolete evaluations.
- Investigate CPU overhead, repeated checks, dependency fan-out, and related cloud resource consumption.
- Use production measurements or profiling data where available.
- Distinguish measured savings from estimates.

Prioritization:
- Rank candidates by expected performance benefit, confidence, age, implementation complexity, and removal risk.
- Highlight old configurations with unexpectedly high evaluation costs.
- Identify dependencies between proposed cleanups.
- Group independent changes into workstreams that different teams can review in parallel.

Deliverable:
Produce a Markdown audit report containing:
1. A prioritized inventory of removal candidates.
2. Production configuration values and source links.
3. Supporting evidence and confidence assessments.
4. Relevant files and call sites.
5. Ownership and dependency information.
6. Measured or estimated evaluation/CPU costs.
7. Operational and compatibility risks.
8. Proposed parallelizable cleanup batches.
9. Unresolved questions requiring human verification.

Do not alter production configurations, deployed services, or repository files during this audit.
```

## 4. Flaky Test Fixing — 修复不稳定测试

```text
Review recent CI executions and identify tests that fail intermittently.

Focus on cases with clear, reproducible, and reasonably small fixes. Investigate their failure patterns, determine the likely causes, and implement targeted corrections.

Validate each fix using appropriate local tests or CI evidence. Open a focused PR for each successfully verified correction.

Do not attempt to solve every flaky test in the repository. Prioritize straightforward improvements with strong evidence and low regression risk.

Report unresolved cases separately, including their suspected causes and any missing evidence.
```

## 5. AGENTS.md Optimization — 用 A/B 测试验证 Agent 指令

```text
Review my recent Codex sessions and identify an AGENTS.md instruction that may have led an agent toward an incorrect approach, unnecessary tool usage, or avoidable work.

Select a representative historical task where that instruction appears to have influenced the outcome.

Design a controlled comparison:
- Trial A: Replay the original task with the current AGENTS.md.
- Trial B: Replay the identical task after changing or removing only the suspected instruction.

Keep the repository commit, starting environment, task prompt, model, and reasoning configuration identical between trials.

For both trials, capture:
- Correctness and completeness of the result.
- Agent decisions and execution path.
- Tool invocation counts.
- Token consumption.
- Elapsed runtime.
- Estimated execution cost.
- Any new errors or regressions.

Compare the trials and determine whether the revised instruction improves results.

Present the original instruction, the proposed revision, the experimental evidence, and a recommendation on whether to adopt the change.

Do not infer improvement from a single metric while ignoring quality or correctness.
```

## 6. CI Optimization — 降低持续集成成本与运行时间

```text
Analyze this repository's continuous integration workflows and historical CI executions.

Identify opportunities to reduce build time, redundant work, resource usage, and unnecessary CI load without weakening test coverage or release safeguards.

Consider:
- Redundant jobs and duplicated testing.
- Ineffective caching.
- Excessive dependency installation.
- Unnecessary rebuilds.
- Poorly scoped workflow triggers.
- Inefficient test partitioning.
- Expensive serial execution.
- Repeated setup and teardown costs.

For each proposal, estimate the total CI compute minutes saved per day using observed execution frequencies and job durations.

Return a ranked Markdown table containing:
- Optimization proposal.
- Supporting evidence from CI history.
- Estimated CI minutes saved per day.
- Expected effect on wall-clock completion time.
- Implementation effort.
- Risk to correctness and test coverage.
- Recommended validation method.

Rank the complete set primarily by estimated daily CI compute savings, while clearly identifying high-value, low-risk improvements.

Do not modify workflows in this initial analysis.
```


## 原始出处

- OpenAI Developers：[Maintaining software with the GPT-6 family](https://developers.openai.com/blog/maintaining-software-with-the-gpt-6-family)
- 原文发布日期：2026-10-14；本文整理日期：2026-10-16
- Prompt 性质：根据用户提供的英文改写稿整理，并对照原文核实六个场景；其中安全边界、交付清单和部分审计步骤属于扩展建议。
