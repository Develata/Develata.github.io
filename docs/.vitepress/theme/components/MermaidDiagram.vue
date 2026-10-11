<!--
  @file MermaidDiagram.vue
  @description Mermaid 图表 (按需加载)
  职责：
  1. 仅在客户端挂载后动态导入 mermaid，使其成为独立 chunk，不进入全站首屏包。
  2. 渲染前 / 无 JS / 渲染失败时显示图源，保证内容可读。
  3. 跟随 VitePress 明暗主题重新渲染。
-->
<script setup lang="ts">
import { useData } from 'vitepress'
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps<{ graph: string }>()

const { isDark } = useData()
const source = computed(() => decodeURIComponent(props.graph))
const svg = ref('')
const error = ref('')

// mermaid.render 要求 id 在文档内唯一，且是合法的 CSS 选择器。
let renderSeq = 0
const instanceId = `mermaid-${Math.random().toString(36).slice(2, 10)}`

async function renderDiagram() {
  const seq = ++renderSeq
  const renderId = `${instanceId}-${seq}`
  try {
    const { default: mermaid } = await import('mermaid')
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      // 失败时由本组件显示图源与错误，不让 mermaid 往 body 插入错误图。
      suppressErrorRendering: true,
      theme: isDark.value ? 'dark' : 'default',
    })
    const { svg: output } = await mermaid.render(renderId, source.value)
    // 主题快速切换时，只接受最后一次渲染的结果。
    if (seq !== renderSeq) return
    svg.value = output
    error.value = ''
  } catch (err) {
    // mermaid 渲染失败时可能遗留临时容器 #d<id>。
    document.getElementById(`d${renderId}`)?.remove()
    if (seq !== renderSeq) return
    svg.value = ''
    error.value = err instanceof Error ? err.message : String(err)
  }
}

onMounted(renderDiagram)
watch([isDark, source], renderDiagram)
</script>

<template>
  <div v-if="svg" class="mermaid-diagram" v-html="svg" />
  <div v-else class="mermaid-diagram mermaid-diagram--source">
    <pre><code>{{ source }}</code></pre>
    <p v-if="error" class="mermaid-diagram__error">Mermaid 渲染失败：{{ error }}</p>
  </div>
</template>

<style scoped>
.mermaid-diagram {
  margin: 16px 0;
  overflow-x: auto;
  text-align: center;
}

.mermaid-diagram--source {
  text-align: left;
}

.mermaid-diagram--source pre {
  margin: 0;
  padding: 16px;
  border-radius: 8px;
  background: var(--vp-code-block-bg);
  font-size: var(--vp-code-font-size);
  line-height: var(--vp-code-line-height);
  color: var(--vp-c-text-2);
}

.mermaid-diagram__error {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--vp-c-danger-1);
}
</style>
