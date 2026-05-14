<script setup lang="ts">
import { data as newsCards } from './news.data.mts';
import NewsTimeline from './NewsTimeline.vue';
</script>

<NewsTimeline :items="newsCards" />
