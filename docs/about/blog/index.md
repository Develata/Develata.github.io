---
layout: page
title: 博客文章
---

<!-- 数据加载：引入生成的文章元数据 -->
<script setup>
import { data as posts } from './posts.data.mts'
</script>

<!-- 文章列表：渲染博客卡片网格 -->
<div class="blog-grid">
  <div v-for="post in posts" :key="post.url" class="blog-card">
    <a :href="post.url" class="card-link">
      <div class="card-date">{{ post.date.string }}</div>
      <h2 class="card-title">{{ post.title }}</h2>
      <p class="card-description">{{ post.excerpt || post.description }}</p>
    </a>
  </div>
</div>

<style scoped>
/* 布局：响应式网格容器 */
.blog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 30px;
  padding-left: 24px;
}

/* 卡片：基础外观与布局 */
.blog-card {
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease-in-out;
  display: flex;
  flex-direction: column;
}

/* 卡片：悬停状态 */
.blog-card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-3px);
  box-shadow: var(--vp-shadow-3);
}

/* 链接：点击区域与排版 */
.card-link {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  text-decoration: none;
  color: inherit;
}

/* 元数据：发布日期 */
.card-date {
  font-size: 0.85em;
  color: var(--vp-c-text-2);
  margin-bottom: 8px;
}

/* 主标题：文章标题 */
.card-title {
  font-size: 1.3em;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 10px 0;
  line-height: 1.3;
}

/* 摘要：文章简介 */
.card-description {
  font-size: 0.95em;
  color: var(--vp-c-text-2);
  line-height: 1.5;
  flex-grow: 1;
}

/* 自适应：移动端单列显示 */
@media (max-width: 768px) {
  .blog-grid {
    grid-template-columns: 1fr;
  }
}
</style>