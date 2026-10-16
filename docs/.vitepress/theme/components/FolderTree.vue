<!--
  @file FolderTree.vue
  @description 目录树组件 (Folder Tree)
  职责：
  1. 递归展示当前文档目录结构。
  2. 自动根据 VitePress Sidebar 配置生成树状列表。
  3. 支持文件夹折叠与文件链接跳转。
-->
<script setup lang="ts">
import { useData, withBase } from 'vitepress'
import { computed } from 'vue'

// 定义递归组件需要的 props
interface Item {
  text: string
  link?: string
  items?: Item[]
  collapsed?: boolean
  name?: string
}

// 接收外部传入的数据（如果是递归调用）
const props = defineProps<{
  items?: Item[]
  level?: number // 用于控制缩进层级
}>()

const { theme, page } = useData()

// 1. 核心逻辑：自动获取当前板块的目录数据
const currentDirItems = computed(() => {
  // 如果是递归调用，直接使用传入的 items
  if (props.items) return props.items

  // 否则（是根节点调用），自动根据当前路径查找 sidebar 配置
  const sidebar = theme.value.sidebar
  if (!sidebar) return []

  // 处理单侧边栏情况 (sidebar 是数组)
  if (Array.isArray(sidebar)) {
    return sidebar as Item[]
  }

  const path = page.value.relativePath.replace(/index\.md$/, '').replace(/\.md$/, '')

  // 尝试匹配 sidebar 中的 key
  // 优先匹配最长的 key (最精确匹配)
  const matchKey = Object.keys(sidebar)
    .filter(key => ('/' + path).startsWith(key))
    .sort((a, b) => b.length - a.length)[0]

  if (matchKey) {
    const conf = sidebar[matchKey]
    // 强制类型转换为 Item[]，解决 TS 隐式 any 报错
    let items = ((Array.isArray(conf) ? conf : conf.items) || []) as Item[]

    // 获取当前文件所在的目录路径
    const rawPath = page.value.relativePath
    const parentDir = rawPath.split('/').slice(0, -1).join('/')
    const currentFileDir = parentDir ? `/${parentDir}/` : '/'

    // 如果当前目录比 sidebar key 更深，需要向下查找
    if (currentFileDir.startsWith(matchKey) && currentFileDir.length > matchKey.length) {
      const relativePath = currentFileDir.slice(matchKey.length)
      const segments = relativePath.split('/').filter(Boolean)

      for (const segment of segments) {
        try {
          const decodedSegment = decodeURIComponent(segment)
          const found = items.find(item => (item.name === decodedSegment) || (item.text === decodedSegment))
          if (found && found.items) {
            items = found.items
          } else {
            break
          }
        } catch (e) {
          // 忽略解码错误
          break
        }
      }
    }

    return items
  }
  return []
})

// 计算缩进样式
const indentStyle = computed(() => {
  return { marginLeft: props.level ? '1.2em' : '0' }
})
</script>

<template>
  <div class="folder-tree" :class="{ 'root-tree': !level }">
    <div v-for="(item, index) in currentDirItems" :key="index" class="tree-item" :style="indentStyle">

      <!-- 情况 A: 是文件夹 (有 items) -->
      <template v-if="item.items && item.items.length > 0">
        <details class="folder-details" :open="false">
          <summary class="folder-summary">
            <span class="text folder-text">{{ item.text }}</span>
            <span class="count-badge">{{ item.items.length }}</span>
          </summary>
          <!-- 🔴 递归调用自己 -->
          <FolderTree :items="item.items" :level="(level || 0) + 1" />
        </details>
      </template>

      <!-- 情况 B: 是文件 (有 link) -->
      <template v-else-if="item.link">
        <a :href="withBase(item.link)" class="file-link">
          <span class="text">{{ item.text }}</span>
        </a>
      </template>

    </div>

    <!-- 空状态提示 -->
    <div v-if="!level && (!currentDirItems || currentDirItems.length === 0)" class="empty-tip">
      (当前目录下没有检测到文章)
    </div>
  </div>
</template>

<style scoped>
.folder-tree {
  font-size: 16px;
  line-height: 1.6;
  user-select: none;
}

.root-tree {
  margin-top: 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 16px;
  background: var(--vp-c-bg-soft);
}

.tree-item {
  margin: 4px 0;
}

/* --- 文件夹样式 --- */
.folder-summary {
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
  list-style: none;
  /* 隐藏原生三角 */
}

.folder-summary::-webkit-details-marker {
  display: none;
}

.folder-summary:hover {
  background: var(--vp-c-bg-alt);
}

.folder-text {
  font-weight: 600;
  margin: 0 8px;
  color: var(--vp-c-text-1);
}

/* 自定义小三角指示器 */
.folder-summary::before {
  content: '▶';
  font-size: 0.7em;
  margin-right: 6px;
  transition: transform 0.2s;
  color: var(--vp-c-text-3);
  display: inline-block;
}

details[open]>.folder-summary::before {
  transform: rotate(90deg);
}

.count-badge {
  font-size: 0.75em;
  background: var(--vp-c-divider);
  padding: 0 6px;
  border-radius: 10px;
  color: var(--vp-c-text-2);
  margin-left: auto;
  /* 靠右对齐 */
}

/* --- 文件样式 --- */
.file-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  padding: 4px 8px;
  border-radius: 6px;
  color: var(--vp-c-text-2);
  transition: all 0.2s;
}

.file-link:hover {
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-brand);
  transform: translateX(4px);
}

.file-link .text {
  margin-left: 8px;
}

.icon {
  opacity: 0.8;
}

.empty-tip {
  color: var(--vp-c-text-3);
  font-style: italic;
  text-align: center;
  padding: 20px;
}
</style>