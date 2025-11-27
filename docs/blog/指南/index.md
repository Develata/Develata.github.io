<script setup>
// 数据源：博客文章元数据
import { data as posts } from '../../posts.data.mts'
import { useRoute } from 'vitepress'

// 当前页面路径信息
const route = useRoute()
const currentFolder = '/blog/tags/guide/'

// 需要排除的自身 URL 形态（含 index 形式）
const selfUrls = new Set([
  route.path,
  route.path.endsWith('/') ? `${route.path}index` : `${route.path}/index`
])

// 目标：同目录内文章，排除当前页面
const guidePosts = posts.filter(post => {
  return post.url.startsWith(currentFolder) && !selfUrls.has(post.url)
})
</script>

<div v-if="guidePosts.length > 0" class="blog-grid">
  <div v-for="post in guidePosts" :key="post.url" class="blog-card">
    <a :href="post.url" class="card-link">
      <div class="card-date">{{ post.date.string }}</div>
      <h2 class="card-title">{{ post.title }}</h2>
      <p class="card-description">{{ post.excerpt || post.description }}</p>
    </a>
  </div>
</div>

<div v-else class="empty-tip">
  暂无文章，欢迎稍后再来 👀
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

/* 提示：无文章时居中显示 */
.empty-tip {
  margin-top: 40px;
  text-align: center;
  color: var(--vp-c-text-2);
}

/* 自适应：移动端单列显示 */
@media (max-width: 768px) {
  .blog-grid {
    grid-template-columns: 1fr;
    padding-left: 0;
  }
}
</style>