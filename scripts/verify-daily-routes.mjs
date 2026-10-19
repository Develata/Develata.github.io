/** Validate every canonical Daily source against actual deployable HTML. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
const docs = new URL('../docs/', import.meta.url);
const dist = new URL('../docs/.vitepress/dist/', import.meta.url);
const pages = fs.readdirSync(new URL('daily/', docs), { recursive: true })
  .filter(p => p.endsWith('.md')).map(p => `daily/${p}`);
for (const retired of ['news/', 'knowledge/math/daily-math/']) {
  assert.ok(!fs.existsSync(new URL(retired, docs)), `Retired source ${retired}`);
  assert.ok(!fs.existsSync(new URL(retired, dist)), `Retired output ${retired}`);
}
const sitemap = fs.readFileSync(new URL('sitemap.xml', dist), 'utf8');
assert.doesNotMatch(sitemap, /<loc>https:\/\/develata.me\/(news\/|knowledge\/math\/daily-math\/)/);
for (const page of pages) {
  const canonical = new URL(page.replace(/index\.md$/, '').replace(/\.md$/, ''), 'https://develata.me/').href;
  const current = fs.readFileSync(new URL(page.replace(/\.md$/, '.html'), dist), 'utf8');
  assert.ok(current.includes(`rel="canonical" href="${canonical}"`), page);
  assert.ok(current.includes('<main'), page);
  assert.ok(sitemap.includes(`<loc>${canonical}</loc>`), `Sitemap missing ${page}`);
  assert.ok(!current.includes('location.replace('), `Unexpected redirect ${page}`);
}
const news = fs.readFileSync(new URL('daily/news/index.html', dist), 'utf8');
const main = news.split('<main')[1].split('</main>')[0];
const newsPages = pages.filter(p => p.startsWith('daily/news/') && !p.endsWith('/index.md'));
for (const p of newsPages) assert.ok(main.includes(`/${p.slice(0, -3)}`), `No-JS archive missing ${p}`);
assert.equal((main.match(/class="[^"]*\btimeline-item\b/g) ?? []).length, 20);
const all = fs.readFileSync(new URL('rss/all.xml', dist), 'utf8');
const guids = [...all.matchAll(/<guid[^>]*>(.*?)<\/guid>/g)].map(m => m[1]);
assert.equal(guids.length, new Set(guids).size, 'No duplicate identities');
const newsFeed = fs.readFileSync(new URL('rss/daily-news.xml', dist), 'utf8');
assert.match(newsFeed, /<link>https:\/\/develata.me\/daily\/news\//);
// Historical RSS identities are stable, not public-route aliases.
assert.match(newsFeed, /<guid isPermaLink="false">https:\/\/develata.me\/news\//);
assert.ok(!fs.existsSync(new URL('rss/news.xml', dist)), 'No legacy feed alias');
for (const name of ['knowledge.xml', 'knowledge-math.xml']) {
  assert.doesNotMatch(fs.readFileSync(new URL(`rss/${name}`, dist), 'utf8'), /daily\/math|daily-math/);
}
console.log(JSON.stringify({ status: 'ok', canonicalPages: pages.length, newsArticles: newsPages.length,
  mathArticles: pages.filter(p => p.startsWith('daily/math/') && !p.endsWith('/index.md')).length,
  aggregateIdentities: guids.length, newsFeedItems: (newsFeed.match(/<item>/g) ?? []).length,
  landingBytes: fs.statSync(new URL('daily/index.html', dist)).size }));
