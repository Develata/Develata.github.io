/** Build acceptance: public projection, complete RSS, stable identity and SSR mathematics. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { sha256, projectionPath } from './daily-math.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, projectionPath);
const dist = path.join(root, 'docs/.vitepress/dist');
const manifest = JSON.parse(fs.readFileSync(path.join(source, 'manifest.json'), 'utf8'));
assert.ok(manifest.length > 0);
assert.equal(new Set(manifest.map(r => r.date)).size, manifest.length);
assert.deepEqual(fs.readdirSync(source).sort(), ['index.md', 'manifest.json', ...manifest.map(r => `${r.date}.md`)].sort(), 'Unexpected public projection files');
const feed = fs.readFileSync(path.join(dist, 'rss/daily-math.xml'), 'utf8');
const items = [...feed.matchAll(/<item>[\s\S]*?<\/item>/g)].map(m => m[0]);
assert.equal(items.length, manifest.length, 'RSS must contain all history');
const base = '/knowledge/math/daily-math/';
const index = fs.readFileSync(path.join(dist, base, 'index.html'), 'utf8');
const rssPage = fs.readFileSync(path.join(dist, 'about/rss.html'), 'utf8');
assert.ok(rssPage.includes('/rss/daily-math.xml'));
assert.ok(index.includes('/rss/daily-math.xml'));
for (let i = 0; i < manifest.length; i++) {
  const r = manifest[i];
  assert.equal(sha256(fs.readFileSync(path.join(source, `${r.date}.md`))), r.projectionSha256);
  const url = `https://develata.me${base}${r.date}`;
  assert.ok(items[i].includes(`<guid isPermaLink="true">${url}</guid>`));
  assert.ok(items[i].includes(`<pubDate>${new Date(`${r.date}T00:00:00+08:00`).toUTCString()}</pubDate>`));
  assert.ok(items[i].includes('<content:encoded><![CDATA['));
  assert.ok(items[i].includes('<math'), `RSS math missing: ${r.date}`);
  const html = fs.readFileSync(path.join(dist, base, `${r.date}.html`), 'utf8');
  assert.ok(html.includes('<math'), `SSR math missing: ${r.date}`);
  assert.ok(index.includes(r.date));
}
console.log(JSON.stringify({ status: 'ok', articles: manifest.length, rssItems: items.length,
  oldest: manifest.at(-1).date, newest: manifest[0].date, rssBytes: Buffer.byteLength(feed) }));
