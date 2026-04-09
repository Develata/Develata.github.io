<template>
  <div class="help-overlay" @click.self="$emit('close')">
    <div class="help-card">
      <header>
        <h2>操作指引</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </header>
      <div class="help-content">
        <ul>
          <li><strong>开始游戏</strong>：点击画面中的 START 按钮进入战场。</li>
          <li><strong>选择机体</strong>：用鼠标点击场景中的我方机体（蓝色立方体），左侧日志会记录你的每一步操作。</li>
          <li><strong>规划行动</strong>：
            <ul>
              <li>在右下角“行动面板”中选择 <strong>「移动一格」</strong> 或 <strong>「锁定攻击」</strong>。</li>
              <li>选择后，在地面点击一个网格：
                <ul>
                  <li>移动模式：点击要前进的方向格子，下一回合会朝该方向迈出一格。</li>
                  <li>攻击模式：点击目标方向一次，出现霓虹预瞄准线，代表子弹的优化迭代轨迹。</li>
                </ul>
              </li>
            </ul>
          </li>
          <li><strong>执行回合</strong>：按右下角的 <strong>「下一回合」</strong> 按钮，或键盘 Space / Enter，执行目前选定的行动。</li>
          <li><strong>视角操作</strong>：拖拽鼠标旋转视角，滚轮缩放远近，仅影响观察，不改变机体位置。</li>
          <li><strong>小地图与场函数</strong>：
            <ul>
              <li>左上角小地图以伪彩热力展示场函数分布，同时标记玩家与敌人位置。</li>
              <li>场函数只影响数值与子弹行为，机体始终在平坦网格上运动。</li>
            </ul>
          </li>
          <li><strong>Buff 选择</strong>：击败敌人后会在右侧中部弹出 <strong>3 选 1 Buff</strong> 面板，点击其中一个即可获取对应增益，其等级取决于该敌人所在 ER 节点的度数。</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{ (e: 'close'): void }>();
</script>

<style scoped>
.help-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.help-card {
  background: rgba(8, 12, 25, 0.95);
  border: 1px solid #00ffcc;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 30px rgba(0, 255, 204, 0.2);
  color: #d8fff3;
}

.help-card header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(0, 255, 204, 0.2);
}

.help-card h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #00ffcc;
}

.close-btn {
  background: none;
  border: none;
  color: #d8fff3;
  font-size: 24px;
  cursor: pointer;
  padding: 0 8px;
  line-height: 1;
}

.close-btn:hover {
  color: #fff;
}

.help-content {
  padding: 24px;
  overflow-y: auto;
  font-size: 0.9rem;
  line-height: 1.6;
}

.help-content ul {
  margin: 0;
  padding-left: 20px;
}

.help-content li {
  margin-bottom: 8px;
}

.help-content strong {
  color: #00ffcc;
}
</style>
