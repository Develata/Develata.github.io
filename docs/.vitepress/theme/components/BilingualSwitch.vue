<!--
  @file BilingualSwitch.vue
  @description 双语切换 (中文 / English / 对照)
  职责：
  1. 中文页：「中文」「对照」只切换 <html> 上的 bi-mode-both 类，并记住选择；「English」跳到英文页。
  2. 英文页：「English」为当前；「中文」「对照」写入选择后跳回中文页。
  不变量：SSR 始终按默认「中文」渲染按钮状态；已保存的「对照」由 config.mts 的 head 脚本在首帧前
  加类，按钮高亮在挂载后同步，因此不会产生 hydration 不一致。
-->
<script setup lang="ts">
import { useData, useRouter, withBase } from 'vitepress'
import { computed, onMounted, ref } from 'vue'
import { BILINGUAL_BOTH_CLASS, BILINGUAL_MODE_KEY } from '../bilingualMode'

type Mode = 'zh' | 'en' | 'both'

const options: { value: Mode; label: string }[] = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
  { value: 'both', label: '对照' },
]

const { frontmatter, page } = useData()
const router = useRouter()

const isEnglishPage = computed(() => frontmatter.value.lang === 'en')
const partnerUrl = computed(() => {
  const relativePath = page.value.relativePath
  const dir = relativePath.slice(0, relativePath.lastIndexOf('/') + 1)
  return withBase(`/${dir}${frontmatter.value.translation}`)
})

const storedMode = ref<'zh' | 'both'>('zh')
const current = computed<Mode>(() => (isEnglishPage.value ? 'en' : storedMode.value))

function readStoredMode(): 'zh' | 'both' {
  try {
    return localStorage.getItem(BILINGUAL_MODE_KEY) === 'both' ? 'both' : 'zh'
  } catch {
    return 'zh'
  }
}

function persist(mode: 'zh' | 'both') {
  storedMode.value = mode
  document.documentElement.classList.toggle(BILINGUAL_BOTH_CLASS, mode === 'both')
  try {
    localStorage.setItem(BILINGUAL_MODE_KEY, mode)
  } catch {
    // 隐私模式等场景无法写入：本次会话内仍然生效。
  }
}

function select(target: Mode) {
  if (target === current.value) return
  if (target === 'en') {
    router.go(partnerUrl.value)
    return
  }
  persist(target)
  if (isEnglishPage.value) router.go(partnerUrl.value)
}

onMounted(() => {
  storedMode.value = readStoredMode()
})
</script>

<template>
  <div class="bilingual-switch" role="group" aria-label="阅读语言">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="bilingual-switch__option"
      :aria-pressed="current === option.value"
      @click="select(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.bilingual-switch {
  display: inline-flex;
  gap: 2px;
  margin-bottom: 16px;
  padding: 2px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background-color: var(--vp-c-bg-soft);
}

.bilingual-switch__option {
  min-width: 56px;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 500;
  transition: color 0.2s, background-color 0.2s;
}

.bilingual-switch__option:hover {
  color: var(--vp-c-text-1);
}

.bilingual-switch__option[aria-pressed='true'] {
  background-color: var(--vp-c-bg);
  color: var(--vp-c-brand-1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.bilingual-switch__option:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 1px;
}

@media (pointer: coarse) {
  .bilingual-switch__option {
    height: 44px;
    min-width: 64px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bilingual-switch__option {
    transition: none;
  }
}
</style>
