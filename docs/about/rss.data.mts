import { defineLoader } from 'vitepress';
import { listRssFeeds, type RssFeedLink } from '../.vitepress/rss/index';

declare const data: RssFeedLink[];
export { data };

export default defineLoader({
  load(): RssFeedLink[] {
    return listRssFeeds();
  },
});
