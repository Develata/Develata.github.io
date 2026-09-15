<script setup lang="ts">
import ZeroPlayerExperiment from './ZeroPlayerExperiment.vue';
import { reactionDiffusionSpec } from './reactionDiffusion';
</script>

<template>
  <ZeroPlayerExperiment :spec="reactionDiffusionSpec" />
</template>
