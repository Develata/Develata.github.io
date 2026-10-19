---
title: Daily
description: 每日新闻与数学札记，独立的时间归档。
sidebar: false
prev: false
next: false
---
<script setup>
import { data } from './daily.data.mts';
</script>

# Daily

每日新闻与数学札记。各自按年、月、日期倒序归档。

<div class="daily-columns">
<section>

## [News](/daily/news/)

新闻日汇总 · [RSS](/rss/daily-news.xml)

<ul><li v-for="item in data.news" :key="item.url"><a :href="item.url">{{ item.title }}</a></li></ul>
</section>
<section>

## [Math](/daily/math/)

数学概念、证明、反例与思想 · [RSS](/rss/daily-math.xml)

<ul><li v-for="item in data.math" :key="item.url"><a :href="item.url">{{ item.title }}</a></li></ul>
</section>
</div>

<style scoped>
.daily-columns { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2rem; }
@media (max-width: 640px) { .daily-columns { grid-template-columns: 1fr; } }
</style>
