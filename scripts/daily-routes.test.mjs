import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { dailyRedirects, redirectHtml } from '../docs/.vitepress/daily/routes.ts';
import { journalEntries } from '../docs/.vitepress/daily/journal.ts';
import { getNewsEntries, getRecentNewsCards } from '../docs/.vitepress/utils/news-index.ts';
import { buildNewsArticleSidebar } from '../docs/.vitepress/theme/components/newsSidebarTree.ts';
import { calendarSidebar } from '../docs/.vitepress/daily/calendar.ts';
import { isSearchableContent } from '../docs/.vitepress/configs/content-modules.shared.ts';

test('route projection covers future producer output and never duplicates source pages', () => {
  assert.deepEqual(dailyRedirects(['news/index.md', 'news/中文/2027/20270101.md', 'daily/math/index.md', 'daily/math/2027-01-01.md', 'knowledge/math/note.md']), [
    ['news/index.md', 'daily/news/index.md'], ['news/中文/2027/20270101.md', 'daily/news/中文/2027/20270101.md'],
    ['knowledge/math/daily-math/index.md', 'daily/math/index.md'], ['knowledge/math/daily-math/2027-01-01.md', 'daily/math/2027-01-01.md'],
  ]);
  assert.ok(isSearchableContent('daily/math/2027-01-01.md'));
  assert.ok(isSearchableContent('knowledge/math/note.md'));
  assert.ok(!isSearchableContent('news/中文/2027/20270101.md'));
});

test('static redirects preserve encoded Unicode, query/hash and native no-JS fallback', () => {
  const html = redirectHtml('daily/news/中文/2027/20270101.md');
  let result;
  vm.runInNewContext(html.match(/<script>(.*?)<\/script>/s)[1], { location: {
    search: '?q=%E6%95%B0&x=1', hash: '#%E8%AF%81%E6%98%8E', replace(url) { result = url; },
  } });
  assert.equal(result, '/daily/news/%E4%B8%AD%E6%96%87/2027/20270101?q=%E6%95%B0&x=1#%E8%AF%81%E6%98%8E');
  assert.match(html, /http-equiv="refresh"/);
  assert.match(html, /<a href="\/daily\/news\/%E4/);
  assert.match(html, /name="robots" content="noindex"/);
  assert.doesNotMatch(html, /__VP|assets\//);
});

test('News adapter preserves latest-20 and category/month article navigation', () => {
  const entries = getNewsEntries();
  assert.ok(entries.length > 20);
  assert.equal(getRecentNewsCards().length, 20);
  assert.deepEqual(getRecentNewsCards().map(e => e.url), entries.slice(0, 20).map(e => e.url));
  assert.ok(entries.every(e => e.url.startsWith('/daily/news/')));
  const categories = [...new Set(entries.map(e => e.category))];
  const tree = categories.map(category => {
    const group = entries.filter(e => e.category === category);
    return { text: category, latestLink: group[0].url, collapsed: true, items: calendarSidebar(group) };
  });
  const entry = entries.at(-1);
  const result = buildNewsArticleSidebar(tree, entry.url.replace('/daily/', '') + '.md');
  const active = result.find(item => item.text === entry.category);
  assert.equal(active.collapsed, false);
  assert.ok(result.filter(item => item !== active).every(item => item.link && !item.items));
  const year = active.items.find(item => item.text === entry.year);
  assert.equal(year.collapsed, false);
  assert.ok(year.items.find(item => item.text === entry.monthKey).items.some(item => item.link === entry.url));
});

test('journal adapter consumes manifest only, ordinary Math has no Daily renderer or URL policy', () => {
  const entries = journalEntries();
  assert.equal(entries.length, JSON.parse(fs.readFileSync(new URL('../docs/daily/math/manifest.json', import.meta.url))).length);
  assert.ok(entries.every(e => e.url.startsWith('/daily/math/') && !('content' in e)));
  const ordinary = fs.readFileSync(new URL('../docs/.vitepress/utils/sidebar.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(ordinary, /daily-math|daily\/math|calendarSidebar/);
  const shell = fs.readFileSync(new URL('../docs/.vitepress/theme/components/NewsAwareSidebar.vue', import.meta.url), 'utf8');
  assert.doesNotMatch(shell, /knowledge\/math|exclusiveWithin|exclusive-within/);
});
