---
title: 程序优化 Prompt
date: 2026-11-19
order: 5
---
# 程序优化 Prompt

## 性能诊断与回归

### 1. 内存剖析：找占用、峰值或持续增长

```text
Investigate excessive memory use in the current project. Start with the symptom and user flow described in this conversation. If none is given, use the project's existing memory benchmark or a representative flow you can run locally. Record the commit, OS, build configuration, input, warm-up, and iteration count. Choose one primary metric: cold-start footprint, steady-state footprint, peak memory, or growth per iteration. Record how it is measured, the baseline, and the number of runs. Match initialization state between baseline and candidate runs so that first-use initialization and reclaimable caches do not look like persistent growth.

Use allocation or retained-object profiles and their call stacks to locate the relevant source code. Distinguish frequent short-lived allocations, expected caches, long-lived references, and suspected leaks. Do not equate resident memory with managed heap size, or allocation hotspots with leaks. Report the baseline, source locations, evidence, and one minimal change. If this task already authorizes edits, apply it and rerun the same workload multiple times, checking correctness, latency, and user-visible behavior. If the evidence is inconclusive, specify the next measurement instead.
```

### 2. CPU 热点：先解释时间花在哪里

```text
Profile the CPU cost of the workload discussed in this conversation. If none is specified, use an existing benchmark or the project's main local workload and state why it is representative. Measure wall-clock time, CPU time, and run-to-run variation using the same release build configuration. Use a sampling profiler to identify the dominant call paths and distinguish self time from time spent in callees. If wall-clock time is high but CPU time is low, investigate waiting before changing computation. Report the hotspot, source location, why it matters, and one minimal change. If edits are in scope, make the change and rerun the same workload. Report absolute timings and relative changes, and check correctness and memory overhead.
```

### 3. I/O 与交互延迟：拆开等待，看尾部

```text
Investigate the slow request or interaction described in this conversation. If none is specified, use an existing latency benchmark or a representative core flow you can run locally. Hold the request mix, concurrency, and data size constant. Measure cold- and warm-cache runs separately. Instrument the relevant stages to separate queueing, lock waits, disk and network I/O, computation, and rendering. Report sample size, p50 and p95 latency, error rate, and throughput. Do not draw tail-latency conclusions from too few samples. Propose one change for the bottleneck with the strongest evidence. Do not trade away timeout guarantees, retry behavior, validation, or consistency to improve the numbers. If edits are in scope, make the change and validate under the same conditions.
```

### 4. 性能回归：先区分波动和真的退化

```text
Investigate the suspected performance regression. Identify a last known-good revision and a first suspect revision from the benchmark history, CI, and Git history available to you. If you cannot establish a known-good revision, measure the current baseline and report the missing evidence rather than assuming a regression. Check that the machine, build configuration, data, initialization path, and thresholds are comparable. Alternate repeated runs of the same benchmark and report the raw samples, their distribution, and how consistently the difference reproduces. Narrow the commit range only after the signal is stable. If a regression check is warranted, propose one that detects this failure without being overly sensitive to noise. Do not relax existing gates or let an average hide a tail regression.
```

## 工程维护与 CI

### 5. 清理无用代码

```text
Review the current repository for dead code. Start in the module discussed in this conversation, or in the repository's own source if no module was specified. Identify the highest-confidence dead code candidates. Check direct references as well as dynamic dispatch, registration, configuration, build features, and compatibility paths. Use external evidence only if authorized. Separate confirmed unused code from suspected and unresolved candidates. Cite relevant source locations, explain how to verify each candidate, and note rollback implications. Recommend removing only well-supported candidates. Avoid unrelated refactoring.
```

### 6. 清理已经失效的实验或功能开关

```text
Inspect the current project and identify experiments and feature flags that are fixed, completed, or retired. Compare authorized configuration evidence with commit history and in-flight changes to confirm that obsolete branches are no longer used. Preserve kill switches, safety fallbacks, and local overrides. If production usage cannot be verified from authorized evidence, mark the candidate unresolved. Propose small, reversible changes and a verification plan for each confirmed candidate. Do not change production configuration.
```

### 7. 全仓审计遗留开关和实验

```text
Inventory experiments, feature flags, and configuration in the current repository without making changes. Include configuration systems only if they are already in scope and you are authorized to read them. Cross-check declared keys, aliases, wrappers, dynamically constructed keys, and consumers in other services. Classify each as safe to remove, must keep, or insufficient evidence. Report observed values, usage locations, ownership, and known costs. Group confirmed removals into independently reviewable changes. State what evidence is missing and do not present speculative costs as precise estimates.
```

### 8. 修复偶发失败的测试

```text
Review the recent CI runs available for this repository, starting with the test or workflow discussed in this conversation. If run history is unavailable, inspect the local test and workflow definitions and state what you could not verify. Separate tests that both pass and fail on the same commit from consistent failures and infrastructure incidents. Pick one case with the clearest evidence and try to reproduce it. Investigate shared state, timing, environmental assumptions, and resource contention. Propose a minimal fix and repeated-run validation. Do not hide failures by skipping the test, inserting arbitrary sleeps, or adding retries without a diagnosis. If you cannot reproduce the failure, preserve the relevant logs and label the hypothesis unverified.
```

### 9. 评估一条 AGENTS.md 指令是否帮倒忙

```text
Review the current repository's AGENTS.md and any sessions or logs already supplied or authorized for this task. If there are no traces, identify a candidate from the instructions and label it a hypothesis. Focus on one rule that may be making the agent take unnecessary steps. Design a clean A/B comparison: use the same repository snapshot, task, model, and tool permissions, varying only that instruction. Define acceptance criteria for task quality and compare the resulting changes, tool calls, token usage, elapsed time, and visible cost. Treat one comparison as a lead, not a conclusion. Run the experiment only with approval and a defined budget. Do not recommend removing safety requirements or project gates based on one result.
```

### 10. 降低 CI 耗时与成本

```text
Review the current repository's recent CI history and workflow definitions. If you cannot access run history, report configuration-based candidates separately and do not estimate savings without a defensible basis. Separate queue time, elapsed time on the critical path, and total runner-minutes across jobs. Look for duplicate runs, cache misses, triggers on unrelated changes, and avoidable serialization. Rank proposals by estimated runner-minutes saved per day. State the frequency, estimation method, expected effect on feedback time, and risk of missing checks. Prefer improvements that preserve existing coverage and gates. Do not modify CI or report estimated savings as measured results.
```
