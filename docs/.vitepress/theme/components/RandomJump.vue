<script setup lang="ts">
import { useRouter, withBase } from 'vitepress'
import { onMounted, onUnmounted } from 'vue'

const router = useRouter()

// 1. 扫描 docs 目录下所有的 .md 文件
const modules = import.meta.glob('../../../**/*.md')

// 2. 生成 URL 列表
const urls: string[] = []

for (const path in modules) {
  if (path.includes('.vitepress')) continue
  
  let url = path
    .replace(/^(\.\.\/)+/, '/') 
    .replace(/\.md$/, '.html')
    .replace(/\/index\.html$/, '/')

  urls.push(url)
}

// 核心跳转逻辑
function jumpRandom() {
  const currentPath = router.route.path
  
  const availableUrls = urls.filter(url => {
    const u1 = decodeURI(url).replace(/\/$/, '')
    const u2 = decodeURI(currentPath).replace(/\/$/, '')
    return u1 !== u2 && u1 !== ''
  })

  if (availableUrls.length === 0) {
    alert('没有其他页面了！')
    return
  }

  const randomIndex = Math.floor(Math.random() * availableUrls.length)
  const targetUrl = availableUrls[randomIndex]

  router.go(withBase(targetUrl))
}

// --- 新增：全局点击拦截逻辑 ---
function handleGlobalClick(e: MouseEvent) {
  // 获取被点击的元素
  const target = e.target as HTMLElement
  // 向上寻找最近的 <a> 标签 (防止用户点击到按钮里的文字或图标span)
  const link = target.closest('a')

  if (link) {
    // 获取 href 属性
    const href = link.getAttribute('href')
    // 检查是否是我们的“暗号”
    if (href === '#randomjump') {
      e.preventDefault() // 阻止浏览器默认的锚点跳转行为
      jumpRandom()       // 执行随机跳转
    }
  }
}

// 在组件挂载时添加监听，卸载时移除
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
  gap: 4px;
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
```

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