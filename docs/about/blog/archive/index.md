---
layout: page
title: 2025 年
---

<script setup>
import { data as posts } from '../posts.data.mts'

// 筛选 2025 年的文章
const yearPosts = posts.filter(post => {
  return new Date(post.date.time).getFullYear() === 2025
})
</script>

# 2025

<div v-if="yearPosts.length > 0" class="blog-grid">
  <div v-for="post in yearPosts" :key="post.url" class="blog-card">
    <a :href="post.url" class="card-link">
      <div class="card-date">{{ post.date.string }}</div>
      <h2 class="card-title">{{ post.title }}</h2>
      <p class="card-description">{{ post.excerpt || post.description || '暂无描述' }}</p>
    </a>
  </div>
</div>

<div v-else class="empty-tip">
  2025 年暂时没有文章，努力写作中... ✍️
</div>

<style scoped>
.blog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 30px;
  /* 保持和你之前调整的一致，防止离侧边栏太近 */
  padding-left: 24px; 
}

.blog-card {
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease-in-out;
  display: flex;
  flex-direction: column;
}

.blog-card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-3px);
  box-shadow: var(--vp-shadow-3);
}

.card-link {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  text-decoration: none;
  color: inherit;
}

.card-date {
  font-size: 0.85em;
  color: var(--vp-c-text-2);
  margin-bottom: 8px;
}

.card-title {
  font-size: 1.3em;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 10px 0;
  line-height: 1.3;
}

.card-description {
  font-size: 0.95em;
  color: var(--vp-c-text-2);
  line-height: 1.5;
  flex-grow: 1;
}

.empty-tip {
  padding: 40px;
  text-align: center;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .blog-grid {
    grid-template-columns: 1fr;
    padding-left: 0;
  }
}
</style>