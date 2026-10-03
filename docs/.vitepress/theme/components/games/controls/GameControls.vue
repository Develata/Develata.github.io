<!--
  @file GameControls.vue
  @description 游戏通用控制器组件
  职责：
  1. 提供统一的 重置 / 撤销 / 返回 按钮组。
  2. 封装游戏常用的底部操作栏样式。
-->
<script setup lang="ts">
// 定义事件
const emit = defineEmits<{
    (e: 'up'): void
    (e: 'down'): void
    (e: 'left'): void
    (e: 'right'): void
    (e: 'action-a'): void
    (e: 'action-b'): void
}>()

// 定义 Props 来控制按钮显示（可选）
defineProps<{
    hideActions?: boolean
    labelA?: string
    labelB?: string
}>()
</script>

<template>
    <div class="game-controls">
        <!-- 左侧十字键 -->
        <div class="d-pad">
            <div class="d-row center">
                <button class="d-btn up" @click="$emit('up')" @touchstart.prevent="$emit('up')">▲</button>
            </div>
            <div class="d-row middle">
                <button class="d-btn left" @click="$emit('left')" @touchstart.prevent="$emit('left')">◀</button>
                <div class="d-center"></div>
                <button class="d-btn right" @click="$emit('right')" @touchstart.prevent="$emit('right')">▶</button>
            </div>
            <div class="d-row center">
                <button class="d-btn down" @click="$emit('down')" @touchstart.prevent="$emit('down')">▼</button>
            </div>
        </div>

        <!-- 右侧功能键 -->
        <div class="action-pad" v-if="!hideActions">
            <div class="action-btn-wrapper b-btn">
                <button class="action-btn" @click="$emit('action-b')" @touchstart.prevent="$emit('action-b')">
                    {{ labelB || 'B' }}
                </button>
                <span class="btn-label" v-if="labelB">{{ labelB }}</span>
            </div>
            <div class="action-btn-wrapper a-btn">
                <button class="action-btn main" @click="$emit('action-a')" @touchstart.prevent="$emit('action-a')">
                    {{ labelA || 'A' }}
                </button>
                <span class="btn-label" v-if="labelA">{{ labelA }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.game-controls {
    display: none;
    /* 默认桌面端隐藏 */
    width: 100%;
    max-width: 400px;
    background-color: #d1d5db;
    /* 掌机灰 */
    padding: 20px;
    border-radius: 20px 20px 40px 40px;
    box-shadow:
        inset 0 -5px 10px rgba(0, 0, 0, 0.1),
        0 10px 20px rgba(0, 0, 0, 0.2);
    margin-top: 20px;
    justify-content: space-between;
    align-items: flex-end;
    box-sizing: border-box;
    /* 防误触优化 */
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
    /* 禁止浏览器默认手势（缩放/滚动） */
}

@media (max-width: 768px) {
    .game-controls {
        display: flex;
    }
}

/* D-Pad Styles */
.d-pad {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.d-row {
    display: flex;
}

.d-btn {
    width: 60px;
    height: 60px;
    background: #374151;
    /* 深灰/黑 */
    border: none;
    color: #6b7280;
    /* 图标暗一点 */
    font-size: 1.2rem;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    box-shadow:
        inset 0 2px 3px rgba(255, 255, 255, 0.1),
        0 2px 2px rgba(0, 0, 0, 0.4);

}

.d-btn:active {
    background: #1f2937;
    box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.5);
    transform: scale(0.95);
}

.d-center {
    width: 60px;
    height: 60px;
    background: #374151;
    z-index: 1;
}

/* 十字键造型 */
.d-btn.up {
    border-radius: 5px 5px 0 0;
    margin-bottom: -1px;
    /* 消除缝隙 */
}

.d-btn.down {
    border-radius: 0 0 5px 5px;
    margin-top: -1px;
}

.d-btn.left {
    border-radius: 5px 0 0 5px;
    margin-right: -1px;
}

.d-btn.right {
    border-radius: 0 5px 5px 0;
    margin-left: -1px;
}

/* Action Buttons */
.action-pad {
    display: flex;
    gap: 15px;
    margin-bottom: 10px;
    /* 稍微向上一点，符合掌机人体工学 */
    transform: rotate(-15deg);
    /* 经典倾斜布局 */
}

.action-btn-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
}

.action-btn {
    width: 65px;
    height: 65px;
    border-radius: 50%;
    border: none;
    background: #ef4444;
    /* B键红 */
    color: rgba(0, 0, 0, 0.3);
    font-weight: bold;
    font-size: 1.2rem;
    box-shadow:
        0 3px 0 #b91c1c,
        0 5px 5px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    transition: transform 0.1s;
}

.action-btn.main {
    background: #ef4444;
    /* A键红 (或者可以换个颜色) */
}

.action-btn:active {
    transform: translateY(3px);
    box-shadow: 0 0 0 #b91c1c, inset 0 2px 5px rgba(0, 0, 0, 0.3);
}

.b-btn {
    margin-top: 20px;
}

.btn-label {
    font-family: sans-serif;
    font-weight: 900;
    color: #374151;
    font-size: 0.8rem;
    transform: rotate(15deg);
    /* 文字转正 */
}
</style>
