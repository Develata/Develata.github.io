<script setup lang="ts">
/*
```
# 使用说明```

### 链接跳转

现在，你只需要将 `index.md` 中对应的 `link` 修改为 `#randomjump` 即可。

```markdown
---
layout: home
hero:
  title: "Develata's Space"
  tagline: "Welcome to Develata's Space"
  actions:
    - theme: brand
      text: "Enter somewhere"
      link: "#randomjump"    <-- 这里改成了暗号
    - theme: alt
      text: "About Me"
      link: "/about/me"
# ... 其他配置 ...
---
*/
import { useRouter, withBase } from 'vitepress'
import { onMounted, onUnmounted } from 'vue'

const router = useRouter()

// 1. 扫描 docs 目录下所有的 .md 文件
const modules = import.meta.glob('../../../**/*.md')

// 2. 生成 URL 列表
const urls: string[] = []

for (const path in modules) {
  // 排除 .vitepress 配置目录和 node_modules 依赖目录
  if (path.includes('.vitepress') || path.includes('node_modules')) continue
  
  let url = path
    .replace(/^(\.\.\/)+/, '/')  // 移除相对路径前缀 (../../)
    .replace(/\.md$/, '')        // 移除 .md 后缀 (让路由自动处理 .html 或无后缀)
    .replace(/\/index$/, '/')    // 将 /index 替换为 /

  urls.push(url)
}

// 核心跳转逻辑
function jumpRandom() {
  const currentPath = router.route.path.replace(/\.html$/, '').replace(/\/$/, '')
  
  const availableUrls = urls.filter(url => {
    // 统一格式化进行比较：移除 .html 后缀和末尾斜杠
    const target = decodeURI(url).replace(/\.html$/, '').replace(/\/$/, '')
    const current = decodeURI(currentPath)
    
    // 只要不是当前页面，都可以跳转（包括首页）
    return target !== current
  })

  if (availableUrls.length === 0) {
    alert('没有其他页面了！')
    return
  }

  const randomIndex = Math.floor(Math.random() * availableUrls.length)
  const targetUrl = availableUrls[randomIndex]

  // 如果目标是首页 '/'，withBase 会处理；如果是普通路径，确保格式正确
  router.go(withBase(targetUrl))
}

// --- 全局点击拦截逻辑 ---
function handleGlobalClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  const link = target.closest('a')

  if (link) {
    const href = link.getAttribute('href')
    // 只要链接包含 #randomjump 就算命中 (兼容 /#randomjump 和 #randomjump)
    if (href && href.includes('#randomjump')) {
      e.preventDefault()
      jumpRandom()
    }
  }
}

onMounted(() => {
  window.addEventListener('click', handleGlobalClick)
})

onUnmounted(() => {
  window.removeEventListener('click', handleGlobalClick)
})
</script>

<template>
  <div class="nav-item">
    <!-- 这里的按钮依然保留，你可以同时拥有导航栏按钮和Hero按钮 -->
    <button @click="jumpRandom" class="random-btn" title="随机访问一篇文章">
      <span class="icon">🎲</span>
      <span class="text">Roll</span>
    </button>
  </div>
</template>

<style scoped>
.nav-item {
  display: flex;
  align-items: center;
  margin-left: 10px;
}

.random-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  height: 36px;
  border-radius: 8px;
  background-color: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.random-btn:hover {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
  background-color: var(--vp-c-bg-soft);
  transform: translateY(-1px);
}

.icon {
  font-size: 16px;
}

@media (max-width: 768px) {
  .text {
    display: none;
  }
  .random-btn {
    padding: 0 8px;
  }
}
</style>
