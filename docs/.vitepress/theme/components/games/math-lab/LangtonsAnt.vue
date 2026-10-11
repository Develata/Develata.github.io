<script setup lang="ts">
import ZeroPlayerExperiment from './ZeroPlayerExperiment.vue';
import { langtonSpec } from './langton';
</script>

<template>
  <ZeroPlayerExperiment :spec="langtonSpec" />
</template>
