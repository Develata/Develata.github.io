<!-- Lightweight catalog: exercise code is loaded only on its own route. -->
<script setup lang="ts">
import { withBase } from 'vitepress';
import { TRAINING_CATALOG } from './catalog';
</script>

<template>
  <main class="brain-hub">
    <header class="hub-heading">
      <p class="eyebrow">Cognitive Lab · 01–07</p>
      <h1>认知任务，<br><span>不制造脑力神话。</span></h1>
      <p class="lead">
        七项认知实验范式的游戏化练习。每项任务独立加载、独立计分，只比较可比条件下的个人表现。
      </p>
    </header>

    <aside class="evidence-note" aria-label="科学解释边界">
      <div class="evidence-mark" aria-hidden="true">∴</div>
      <div>
        <strong>练习效应是真实的，广泛迁移并非已证事实。</strong>
        <p>反复练习通常会提高本任务熟练度；迁移到 IQ、学业、工作、自控或日常专注的证据有限。</p>
      </div>
    </aside>

    <div class="axis-line" aria-label="覆盖的认知任务维度">
      <b>覆盖维度</b><i></i>
      <span>视觉搜索</span><i></i><span>干扰控制</span><i></i><span>工作记忆</span><i></i><span>空间变换</span><i></i><span>动态追踪</span>
    </div>

    <section class="training-list" aria-label="训练项目">
      <a
        v-for="(item, index) in TRAINING_CATALOG"
        :key="item.id"
        class="training-card"
        :href="withBase(item.route)"
        :style="{ '--item-accent-light': item.accent, '--item-accent-dark': item.darkAccent }"
      >
        <span class="card-index">0{{ index + 1 }}</span>
        <span class="card-symbol" aria-hidden="true">{{ item.symbol }}</span>
        <span class="card-copy">
          <span class="card-construct">{{ item.construct }}</span>
          <strong>{{ item.title }} <small>{{ item.enTitle }}</small></strong>
          <span>{{ item.description }}</span>
        </span>
        <span class="card-meta">{{ item.duration }} <b>进入任务</b><i aria-hidden="true">↗</i></span>
      </a>
    </section>

    <footer class="hub-footer">
      <p>所有记录只保存在当前浏览器；不上传、不跨设备排名、不生成综合“脑力分”。</p>
    </footer>
  </main>
</template>

<style scoped src="./BrainTrainingHub.css"></style>
