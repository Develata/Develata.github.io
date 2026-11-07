<template>
  <section class="network-panel">
    <header>
      <span>ER 拓扑监视</span>
      <small>度分布驱动 buff 阶级</small>
    </header>
    <!-- 移除冗长的说明文字，节省空间 -->
    <div class="legend">
      <span><i class="node low"></i>低度：常规补给</span>
      <span><i class="node mid"></i>中度：稀有算子</span>
      <span><i class="node high"></i>高度：传奇异构</span>
    </div>
  </section>
</template>

<script setup lang="ts">
</script>

<style scoped>
.network-panel {
  background: rgba(8, 12, 25, 0.9);
  border: 1px dashed rgba(0, 255, 204, 0.35);
  color: #d8fff3;
  padding: 12px;
  font-family: 'Space Mono', 'Courier New', monospace;
  pointer-events: auto;
}

header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 6px;
}

header small {
  color: rgba(216, 255, 243, 0.7);
}

.description {
  font-size: 0.75rem;
  line-height: 1.4;
  color: rgba(216, 255, 243, 0.9);
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-height: 600px) {
  .description {
    display: none;
  }
}


.legend {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.75rem;
}

.legend i {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 6px;
}

.node.low {
  background: #00bcd4;
}

.node.mid {
  background: #ffb347;
}

.node.high {
  background: #ff4d6d;
}
</style>
