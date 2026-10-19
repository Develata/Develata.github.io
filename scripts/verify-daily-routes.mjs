/** Validate every migrated source against actual deployable HTML, not route assumptions. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { dailyRedirects } from '../docs/.vitepress/daily/routes.ts';
const docs = new URL('../docs/', import.meta.url);
const dist = new URL('../docs/.vitepress/dist/', import.meta.url);
const pages = fs.readdirSync(docs, { recursive: true }).filter(p => (p.startsWith('news/') || p.startsWith('daily/math/')) && p.endsWith('.md'));
const redirects = dailyRedirects(pages);
for (const [source, target] of redirects) {
  const old = fs.readFileSync(new URL(source.replace(/\.md$/, '.html'), dist), 'utf8');
  const canonical = new URL(target.replace(/index\.md$/, '').replace(/\.md$/, ''), 'https://develata.me/').href;
  assert.ok(old.includes(`rel="canonical" href="${canonical}"`), source);
  assert.ok(old.includes('location.replace('), source);
  assert.ok(old.includes('noindex'), source);
  const current = fs.readFileSync(new URL(target.replace(/\.md$/, '.html'), dist), 'utf8');
  assert.ok(current.includes(`rel="canonical" href="${canonical}"`), target);
  assert.ok(current.includes('<main'), target);
}
const sitemap = fs.readFileSync(new URL('sitemap.xml', dist), 'utf8');
assert.doesNotMatch(sitemap, /<loc>https:\/\/develata.me\/(news\/|knowledge\/math\/daily-math\/)/);
assert.ok(sitemap.includes('/daily/math/'));
const news = fs.readFileSync(new URL('daily/news/index.html', dist), 'utf8');
const main = news.split('<main')[1].split('</main>')[0];
const newsPages = pages.filter(p => p.startsWith('news/') && !p.endsWith('/index.md'));
for (const p of newsPages) assert.ok(main.includes(`/daily/${p.slice(0, -3)}`), `No-JS archive missing ${p}`);
assert.equal((main.match(/class="[^"]*\btimeline-item\b/g) ?? []).length, 20);
const all = fs.readFileSync(new URL('rss/all.xml', dist), 'utf8');
const guids = [...all.matchAll(/<guid[^>]*>(.*?)<\/guid>/g)].map(m => m[1]);
assert.equal(guids.length, new Set(guids).size, 'No duplicate identities');
const newsFeed = fs.readFileSync(new URL('rss/daily-news.xml', dist), 'utf8');
assert.match(newsFeed, /<link>https:\/\/develata.me\/daily\/news\//);
assert.match(newsFeed, /<guid[^>]*>https:\/\/develata.me\/news\//);
assert.ok(!fs.existsSync(new URL('rss/news.xml', dist)), 'No legacy feed alias');
for (const name of ['knowledge.xml', 'knowledge-math.xml']) {
  assert.doesNotMatch(fs.readFileSync(new URL(`rss/${name}`, dist), 'utf8'), /daily\/math|daily-math/);
}
console.log(JSON.stringify({ status: 'ok', redirects: redirects.length, newsArticles: newsPages.length,
  mathArticles: pages.filter(p => p.startsWith('daily/math/') && !p.endsWith('/index.md')).length,
  aggregateIdentities: guids.length, newsFeedItems: (newsFeed.match(/<item>/g) ?? []).length,
  landingBytes: fs.statSync(new URL('daily/index.html', dist)).size }));
