<!--
  @file MathHub.vue
  @description 数学实验中心首页。
-->
<script setup lang="ts">
import { withBase } from 'vitepress';
import { games } from './mathHubItems';
</script>

<template>
  <div class="game-hub">
    <div class="hub-header">
      <h1 class="glitch-title">Math Lab</h1>
      <p class="subtitle">数学理念的动态演绎</p>
    </div>

    <div class="game-grid">
      <a
        v-for="game in games"
        :key="game.id"
        :href="game.disabled ? 'javascript:void(0)' : withBase(game.link)"
        class="game-card"
        :class="{ 'is-disabled': game.disabled }"
      >
        <div class="card-content">
          <div class="card-top">
            <span class="icon-box">{{ game.icon }}</span>
            <span
              class="tag"
              :style="{ color: game.color, borderColor: game.color + '40', backgroundColor: game.color + '10' }"
            >
              {{ game.tag }}
            </span>
          </div>

          <h3 class="game-title">
            {{ game.title }}
            <span class="game-en-title">{{ game.enTitle }}</span>
          </h3>

          <p class="game-desc">{{ game.desc }}</p>

          <div class="card-footer">
            <span v-if="game.disabled" class="status-text">开发中...</span>
            <span v-else class="play-btn">Start Experiment -></span>
          </div>
        </div>

        <div class="card-bg-decoration" :style="{ background: game.color }"></div>
      </a>
    </div>
  </div>
</template>

<style scoped src="./MathHub.css"></style>
