<script setup lang="ts">
import ZeroPlayerExperiment from './ZeroPlayerExperiment.vue';
import { percolationSpec } from './percolation';
</script>

<template>
  <ZeroPlayerExperiment :spec="percolationSpec" />
</template>
