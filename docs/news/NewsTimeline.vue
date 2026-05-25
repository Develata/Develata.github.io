<script setup lang="ts">
import type { NewsCardItem } from '../.vitepress/utils/news-types';

defineProps<{
  items: NewsCardItem[];
}>();
</script>

<template>
  <div class="news-shell">
    <header class="news-header">
      <span class="kicker">DAILY DIGEST</span>
      <h1>News</h1>
      <p>捕捉世界的每一次脉动</p>
    </header>

    <section class="timeline-container">
      <div v-if="items.length === 0" class="empty-tip">资讯正在路上...</div>

      <div v-else class="timeline">
        <article
          v-for="(item, index) in items"
          :key="item.url"
          class="timeline-item"
          :class="{ 'is-animated': index < 4 }"
        >
          <div class="timeline-date">
            <span class="date-day">{{ item.day }}</span>
            <span class="date-month">{{ item.monthLabel }}</span>
          </div>

          <div class="timeline-divider" aria-hidden="true">
            <div class="dot"></div>
            <div class="line"></div>
          </div>

          <div class="timeline-content">
            <a :href="item.url" class="news-card">
              <div class="card-header">
                <h2 class="title">{{ item.displayTitle }}</h2>
                <span v-if="index === 0" class="new-tag">LATEST</span>
              </div>
              <p class="meta">{{ item.dateLabel }}</p>
              <p class="excerpt">{{ item.excerpt || '探索今日的详细报道...' }}</p>
              <div class="read-more">
                <span>Read Article</span>
                <span class="arrow">-></span>
              </div>
            </a>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped src="./news-timeline.css"></style>
