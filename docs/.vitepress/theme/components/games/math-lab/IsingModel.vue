<script setup lang="ts">
import ZeroPlayerExperiment from './ZeroPlayerExperiment.vue';
import { isingSpec } from './ising';
</script>

<template>
  <ZeroPlayerExperiment :spec="isingSpec" />
</template>
