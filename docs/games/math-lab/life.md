---
layout: page
title: Conway's Game of Life
sidebar: false
---

# 🧬 Conway's Game of Life

> 零玩家游戏，其演化由初始状态决定。

**规则：**
1. **人口过少**：活细胞周围少于 2 个活邻居 -> 死。
2. **正常生存**：活细胞周围有 2 或 3 个活邻居 -> 活。
3. **人口过多**：活细胞周围多于 3 个活邻居 -> 死。
4. **繁殖**：死细胞周围正好有 3 个活邻居 -> 活。

<div class="game-wrapper">
  <GameOfLife />
</div>