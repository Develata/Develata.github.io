---
layout: page
title: 位置更新 · Spatial N-back
description: 1-back、2-back 与 3-back 空间位置更新任务，同时报告准确率、反应时与 d-prime。
sidebar: false
injectTitle: false
---

<NBackTraining />

<BrainTrainingNotes>

## 为什么同时报告准确率与 d′？

只看准确率可能奖励偏向某一按键的策略。这里同时记录命中与误报，并用 log-linear correction 计算有限的信号检测指标：`d′ = Z(命中率) − Z(误报率)`。

超时不会被当作“正确拒绝”，并会降低总准确率。为避免选择性漏答夸大信号检测结果，只要本轮存在超时，页面就不显示 d′。即使完整作答，d′ 仍然只是当前 n-back 任务的描述量，不等于工作记忆容量或 IQ。

33 项随机对照试验的 meta-analysis 发现，中等迁移主要出现在**未训练的 n-back 变式**；对其他工作记忆任务、流体智力和认知控制的效应很小：

- Soveri et al., 2017：[DOI 10.3758/s13423-016-1217-0](https://doi.org/10.3758/s13423-016-1217-0)

</BrainTrainingNotes>
