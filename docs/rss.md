---
title: RSS 订阅
---

<script setup lang="ts">
import { data as feeds } from './rss.data.mts';
</script>

# RSS 订阅

这里列出当前站点可用的订阅源。Knowledge 子栏目会随 `docs/knowledge/` 顶层目录自动更新。

<ul>
  <li v-for="feed in feeds" :key="feed.url">
    <a :href="feed.url">{{ feed.title }}</a>
    <p>{{ feed.description }}</p>
  </li>
</ul>
