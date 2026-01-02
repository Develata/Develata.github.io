<script setup lang="ts">
defineProps<{
    modelValue: number
}>()

defineEmits<{
    (e: 'update:modelValue', value: number): void
}>()

const options = [0.25, 0.5, 1, 1.5, 2, 3, 5]
</script>

<template>
    <div class="speed-control">
        <span class="label">SPEED:</span>
        <select :value="modelValue"
            @change="$emit('update:modelValue', Number(($event.target as HTMLSelectElement).value))"
            class="speed-select">
            <option v-for="opt in options" :key="opt" :value="opt">{{ opt }}x</option>
        </select>
    </div>
</template>

<style scoped>
.speed-control {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: var(--vp-c-bg-soft);
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid var(--vp-c-divider);
}

.label {
    font-size: 0.8rem;
    color: var(--vp-c-text-2);
    margin-bottom: 2px;
}

.speed-select {
    background: transparent;
    color: var(--vp-c-text-1);
    border: 1px solid var(--vp-c-divider);
    border-radius: 4px;
    padding: 2px 5px;
    font-family: inherit;
    font-weight: bold;
    cursor: pointer;
    outline: none;
}

.speed-select:focus {
    border-color: var(--vp-c-brand);
}
</style>
