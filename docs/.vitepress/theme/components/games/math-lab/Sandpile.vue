<script setup lang="ts">
import ZeroPlayerExperiment from './ZeroPlayerExperiment.vue';
import { sandpileSpec } from './sandpile';
</script>

<template>
  <ZeroPlayerExperiment :spec="sandpileSpec" />
</template>
