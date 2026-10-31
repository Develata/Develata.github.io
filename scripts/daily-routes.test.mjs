import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { journalEntries } from '../docs/.vitepress/daily/journal.ts';
import { getNewsEntries, getRecentNewsCards } from '../docs/.vitepress/utils/news-index.ts';
import { buildNewsArticleSidebar, isNewsArticlePath } from '../docs/.vitepress/theme/components/newsSidebarTree.ts';
import { calendarSidebar } from '../docs/.vitepress/daily/calendar.ts';
import { isSearchableContent } from '../docs/.vitepress/configs/content-modules.shared.ts';

test('canonical sources use native routes and preserve search eligibility', () => {
  assert.ok(!fs.existsSync(new URL('../docs/news/', import.meta.url)));
  const config = fs.readFileSync(new URL('../docs/.vitepress/config.mts', import.meta.url), 'utf8');
  assert.doesNotMatch(config, /rewrites:|writeDailyRedirects/);
  assert.ok(isSearchableContent('daily/math/2027-01-01.md'));
  assert.ok(isSearchableContent('knowledge/math/note.md'));
  assert.ok(!isSearchableContent('daily/news/中文/2027/20270101.md'));
});

test('News adapter preserves latest-20 and category/month article navigation', () => {
  assert.ok(isNewsArticlePath('daily/news/中文/2027/20270101.md'));
  assert.ok(!isNewsArticlePath('daily/news/index.md'));
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
  const result = buildNewsArticleSidebar(tree, entry.url.slice(1) + '.md');
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
