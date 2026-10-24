<script setup lang="ts">
import type { CalendarEntry } from '../../daily/calendar';
defineProps<{ years: { year: string; months: { key: string; items: CalendarEntry[] }[] }[] }>();
</script>
<template>
  <section aria-label="完整时间归档">
    <section v-for="year in years" :key="year.year">
      <h2>{{ year.year }}</h2>
      <details v-for="(month, index) in year.months" :key="month.key" :open="year === years[0] && index === 0">
        <summary>{{ month.key }}</summary>
        <ul><li v-for="item in month.items" :key="item.url"><a :href="item.url">{{ item.title }}</a></li></ul>
      </details>
    </section>
  </section>
</template>
