---
title: RSS 订阅
---

<script setup lang="ts">
import { data as feeds } from './rss.data.mts';
</script>

Daily 独立订阅：[News](/rss/daily-news.xml) · [Math 最近 14 期全文（默认）](/rss/daily-math.xml) · [Math 全部历史全文（按需）](/rss/daily-math-all.xml)。

最近订阅按 **14 期**而非 14 个日历日截取，每期都是全文；全部历史订阅也全部为全文，没有摘要混合模式。普通网页不会预取全文订阅；只有主动打开或由阅读器订阅时才请求 XML，但阅读器一次会下载整份订阅，并非逐篇懒加载。聚合「全部更新」仅纳入最近 14 期数学，避免重复和历史全文膨胀。Knowledge 只包含普通笔记。

这里列出当前站点可用的订阅源。Knowledge 子栏目会随 `docs/knowledge/` 顶层目录自动更新。

<ul>
  <li v-for="feed in feeds" :key="feed.url">
    <a :href="feed.url">{{ feed.title }}</a>
    <p>{{ feed.description }}</p>
  </li>
</ul>
