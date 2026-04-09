---
title: Non-Convergence Game Refactor
hideInSidebar: true
---

# 非 Convergence 游戏组件重构设计

## 背景

`Sudoku.vue` 与 `Minesweeper.vue` 已超过项目建议的单文件体量，且把规则、状态、存档、键盘事件、模板与样式混在一个文件中。继续在原文件上叠加功能，会放大耦合并削弱可验证性。

## 目标

1. 将数独与扫雷的规则逻辑从页面组件中抽离。
2. 让主组件只负责组装状态与子视图，不再承载全部算法。
3. 修正数独“唯解题面”的语义，让实现与文档一致。
4. 保持现有交互外观与页面入口不变。

## 设计原则

### Sudoku

- `core.ts` 负责题面生成、合法性检查、求解与唯一解判定。
- `useSudokuGame.ts` 负责响应式状态、存档、计时器、撤销与求解动画。
- `SudokuBoard.vue` 只负责棋盘渲染与选格事件。
- `SudokuPanel.vue` 只负责难度、统计和数字面板。

不变量：

- `solution` 始终是一组完整可行解。
- `grid[i].fixed = true` 的格子在一局游戏内不可被用户修改。
- 题面删除数字时，若解数大于 1，则必须回滚该删除操作。

### Minesweeper

- `core.ts` 负责棋盘创建、布雷、邻雷计数、空白扩展、智能和弦与胜负判定。
- `useMinesweeperGame.ts` 负责局面状态、设置面板、计时器与模式切换。
- `MinesweeperHeader.vue` 只负责设置和顶部状态条。
- `MinesweeperBoard.vue` 只负责棋盘绘制与点击事件转发。

不变量：

- 首次翻开时，点击格及其 8 邻域内禁止布雷。
- `flagsPlaced` 始终等于所有 `isFlagged = true` 的格子数。
- 游戏结束后，棋盘不再接受状态改变。

## 性能考虑

- 数独唯一解判定采用“计数到 2 即提前停止”的回溯，避免完整枚举全部解。
- 扫雷保留原地修改棋盘对象的方式，减少大棋盘下的整板复制。
- 页面组件只接收必要 props，避免把规则函数重新创建到模板层。

## 非目标

- 本次不处理 `convergence/` 子系统。
- 本次不修改游戏页面 markdown 入口。
- 本次不引入新的状态管理库。
