layout: page title: AI Daily News sidebar: false

<script setup>
import { data as newsList } from './news.data.mts'
</script>

<!-- 头部区域：简约标题 -->

<div class="news-header">
  <span class="kicker">DAILY DIGEST</span>
  <h1>AI Chronicle</h1>
  <p>捕捉人工智能的每一次脉动</p>
</div>

<!-- 时间轴容器 -->

<div class="timeline-container">

<!-- 空状态提示 -->

<div v-if="newsList.length === 0" class="empty-tip">
  <span class="icon">⚡️</span> 资讯正在路上...
</div>

<!-- 时间轴列表 -->

<div v-else class="timeline">
<div v-for="(item, index) in newsList" :key="item.url" class="timeline-item" :class="{ 'latest': index === 0 }">

<!-- 左侧：日期模块 -->

<div class="timeline-date">
<span class="date-day">{{ new Date(item.date.time).getDate() }}</span>
<span class="date-month">{{ new Date(item.date.time).toLocaleString('en-US', { month: 'short' }) }}</span>
</div>

<!-- 中间：轴线与节点 -->

<div class="timeline-divider">
<div class="dot"></div>
<div class="line"></div>
</div>

<!-- 右侧：内容卡片 -->

<div class="timeline-content">
<a :href="item.url" class="news-card">
<div class="card-header">
<h2 class="title">{{ item.title }}</h2>
<!-- 最新消息显示 NEW 标签 -->
<span v-if="index === 0" class="new-tag">LATEST</span>
</div>
<p class="excerpt">{{ item.excerpt || '探索今日的详细报道...' }}</p>
<div class="read-more">
<span>Read Article</span>
<span class="arrow">→</span>
</div>
</a>
</div>
</div>

</div>
</div>

<style scoped>
/* --- 头部样式 --- */
.news-header {
  text-align: center;
  margin-bottom: 100px;
  margin-top: 60px;
}

.kicker {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--vp-c-brand);
  margin-bottom: 12px;
  text-transform: uppercase;
}

.news-header h1 {
  font-size: 3.5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--vp-c-text-1);
  margin-bottom: 20px;
  line-height: 1.1;
}

.news-header p {
  color: var(--vp-c-text-2);
  font-size: 1.1rem;
  max-width: 500px;
  margin: 0 auto;
  line-height: 1.6;
  font-weight: 400;
  opacity: 0.8;
}

/* --- 容器布局 --- */
.timeline-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 24px;
}

.timeline {
  display: flex;
  flex-direction: column;
}

.timeline-item {
  display: flex;
  gap: 32px;
  position: relative;
  padding-bottom: 48px;
  opacity: 0;
  animation: slideIn 0.6s ease forwards;
}

/* Stagger animation for first few items */
.timeline-item:nth-child(1) { animation-delay: 0.1s; }
.timeline-item:nth-child(2) { animation-delay: 0.2s; }
.timeline-item:nth-child(3) { animation-delay: 0.3s; }

/* --- 左侧日期 --- */
.timeline-date {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 60px;
  padding-top: 2px;
}

.date-day {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.date-month {
  font-size: 0.85rem;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-top: 4px;
}

/* --- 中间轴线 --- */
.timeline-divider {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 24px;
}

.line {
  position: absolute;
  top: 24px;
  bottom: -24px;
  width: 1px;
  background: var(--vp-c-divider);
  z-index: 0;
}

/* 最后一个元素不显示向下的连接线 */
.timeline-item:last-child .line {
  display: none;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--vp-c-text-3);
  z-index: 1;
  margin-top: 10px;
  box-shadow: 0 0 0 4px var(--vp-c-bg);
  opacity: 0.4;
}

/* --- 右侧卡片 --- */
.timeline-content {
  flex: 1;
  padding-top: 0;
}

.news-card {
  display: block;
  background: transparent;
  border-radius: 8px;
  padding: 0 0 16px 0;
  text-decoration: none !important;
  transition: all 0.3s ease;
}

/* Hover Effect */
.news-card:hover {
  transform: translateX(4px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
}

.title {
  margin: 0 !important;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  line-height: 1.4;
  transition: color 0.2s;
}

.news-card:hover .title {
  color: var(--vp-c-brand);
}

.new-tag {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--vp-c-brand);
  background: transparent;
  padding: 2px 8px;
  border-radius: 100px;
  line-height: 1.4;
  flex-shrink: 0;
  border: 1px solid var(--vp-c-brand);
  letter-spacing: 0.5px;
}

.excerpt {
  margin: 0 !important;
  font-size: 1rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.read-more {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--vp-c-text-3);
  transition: color 0.2s;
}

.news-card:hover .read-more {
  color: var(--vp-c-brand);
}

.arrow {
  transition: transform 0.2s ease;
}

.news-card:hover .arrow {
  transform: translateX(4px);
}

/* 空状态 */
.empty-tip {
text-align: center;
padding: 80px 0;
color: var(--vp-c-text-3);
font-size: 1.1rem;
background: var(--vp-c-bg-soft);
border-radius: 12px;
border: 2px dashed var(--vp-c-divider);
}

/* 呼吸灯动画 */
@keyframes pulse {
0% { box-shadow: 0 0 0 0 rgba(var(--vp-c-brand-rgb), 0.4); }
70% { box-shadow: 0 0 0 10px rgba(var(--vp-c-brand-rgb), 0); }
100% { box-shadow: 0 0 0 0 rgba(var(--vp-c-brand-rgb), 0); }
}

/* 移动端适配 */
@media (max-width: 640px) {
.timeline-item { gap: 15px; }
.timeline-date { min-width: auto; padding-right: 5px; text-align: center; }
.date-day { font-size: 1.1rem; }
.date-month { font-size: 0.7rem; }
/* 移动端稍微调整竖线位置 */
.timeline::before { left: 19px; }
.news-card { padding: 16px; }
.title { font-size: 1.1rem; }
.excerpt { font-size: 0.9rem; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>