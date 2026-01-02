<!--
  @file RandomJump.vue
  @description 随机跳转组件 (Random Jump)
  职责：
  1. 扫描项目中所有文档生成链接池。
  2. 提供按钮或通过 URL Hash (#randomjump) 触发随机跳转。
  3. 过滤非内容页面，确保跳转至有效文章。
-->
<script setup lang="ts">
/// <reference types="vite/client" />

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
// 修改：使用数组语法，在扫描阶段直接排除 .vitepress, public 和 node_modules
const modules = import.meta.glob([
  '../../../**/*.md',
  '!../../../.vitepress/**',
  '!../../../public/**',
  '!../../../node_modules/**'
])

// 2. 生成 URL 列表
const urls: string[] = []

for (const path in modules) {
  // 下面的过滤逻辑可以简化，因为 glob 已经排除了一部分

  let url = path
    // 移除相对路径前缀
    .replace(/^(\.\.\/)+/, '/')
    // 移除扩展名
    .replace(/\.md$/, '')
    // 处理 index 文件
    .replace(/\/index$/, '/')

  // 修复：排除首页 (通常是 / )，防止随机跳回主页
  if (url === '/') continue

  urls.push(url)
}

function jumpRandom() {
  // 获取当前路径，并标准化（移除 .html 和末尾斜杠，防止匹配失败）
  const currentPath = router.route.path
    .replace(/\.html$/, '')
    .replace(/\/$/, '')

  const availableUrls = urls.filter(url => {
    const target = decodeURI(url).replace(/\.html$/, '').replace(/\/$/, '')
    const current = decodeURI(currentPath)
    return target !== current
  })

  if (availableUrls.length === 0) {
    alert('没有其他页面了！')
    return
  }

  const randomIndex = Math.floor(Math.random() * availableUrls.length)
  const targetUrl = availableUrls[randomIndex]

  // 使用 router.go 进行跳转
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
