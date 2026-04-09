---
title: Convergence Refactor
hideInSidebar: true
---

# Convergence 重构设计

## 背景

`convergence` 不是普通的页面组件，而是一个嵌入 VitePress 的小型战术游戏引擎。当前 `SceneManager.ts` 同时承担渲染初始化、输入命中、交互状态机、回合执行、HUD 查询、缓存和资源释放，职责边界过宽，导致 Vue 层与引擎层难以独立演进。

## 目标

1. 将 `SceneManager` 从 God Object 拆成可验证的协作模块。
2. 明确 Vue UI 与引擎之间只通过只读查询和显式命令交互。
3. 降低回合逻辑与 Three.js 渲染逻辑之间的耦合。
4. 后续为事件驱动 HUD 更新铺路，逐步淘汰每帧全量同步。

## 分层

### Domain

- `core/` 下的 `GameState`、实体、地形、拓扑、武器策略。
- 负责数学规则和战斗规则，不依赖 Vue，也不直接依赖 HUD。

### Application

- 负责输入解释、动作规划、寻路、回合推进、只读查询适配。
- 面向“玩家正在做什么”与“UI 需要看什么”，不直接关心具体 DOM。

### Renderer

- 负责 Three.js 场景、相机、地形、实体表现、VFX 与资源释放。
- 不直接决定回合规则，只消费来自 domain/application 的状态。

### UI Adapter

- 为 Vue 组件提供 `InteractionState`、热力图、实体快照、玩家/敌人摘要等只读视图模型。
- 后续应演进为事件驱动或脉冲式更新，而不是每帧全量拷贝。

## 第一阶段拆分

1. 抽离 `application/types.ts`
2. 抽离 `application/pathfinding.ts`
3. 抽离 `application/SceneQueries.ts`
4. 修正动作规划接口：再次点击同一动作应取消，而不是偷偷切到另一种动作

## 后续阶段

1. 抽离 `TurnController`
2. 抽离 `InteractionController`
3. 收缩 `GameEntry.vue`，把 HUD 刷新改成事件驱动

## 不变量

- `InteractionState` 中至多存在一种待执行动作。
- `plannedAction = null` 时，轨迹预览必须隐藏。
- 回合执行后，应用层负责把选择状态和路径状态收敛到一致状态。
- UI 只能通过查询接口读取引擎状态，不直接探查渲染对象。
