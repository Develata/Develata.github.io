---
title: News
prev: false
next: false
---
<script setup lang="ts">
import { data as newsCards } from './news.data.mts';
import NewsTimeline from './NewsTimeline.vue';
import { data as archive } from './archive.data.mts';
import DailyArchive from '../../.vitepress/theme/components/DailyArchive.vue';
</script>

[订阅 News RSS](/rss/daily-news.xml) · [Daily](/daily/)

<NewsTimeline :items="newsCards" />

## 全部历史

<DailyArchive :years="archive" />
