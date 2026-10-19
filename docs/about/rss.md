---
title: RSS 订阅
---

<script setup lang="ts">
import { data as feeds } from './rss.data.mts';
</script>

Daily 独立订阅：[News](/rss/daily-news.xml) · [Math](/rss/daily-math.xml)。每日数学包含全部历史，最近 5 篇为全文，其余为摘要；Knowledge 只包含普通笔记。

这里列出当前站点可用的订阅源。Knowledge 子栏目会随 `docs/knowledge/` 顶层目录自动更新。

<ul>
  <li v-for="feed in feeds" :key="feed.url">
    <a :href="feed.url">{{ feed.title }}</a>
    <p>{{ feed.description }}</p>
  </li>
</ul>
