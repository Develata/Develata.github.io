/** Build acceptance: concise titles, summary RSS, stable identity and complete SSR articles. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { sha256, projectionPath, websiteTitle } from './daily-math.mjs';
import matter from 'gray-matter';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, projectionPath);
const dist = path.join(root, 'docs/.vitepress/dist');
// Only the content-free template generator opts into this; main stays fail-closed.
if (!fs.existsSync(source) && process.argv.includes('--allow-empty-template')) {
  console.log('Daily Math verification: content-free template, no journal to verify.');
  process.exit(0);
}
const manifest = JSON.parse(fs.readFileSync(path.join(source, 'manifest.json'), 'utf8'));
assert.ok(manifest.length > 0);
assert.equal(new Set(manifest.map(r => r.date)).size, manifest.length);
assert.deepEqual(fs.readdirSync(source).sort(), ['index.md', 'manifest.json', ...manifest.map(r => `${r.date}.md`)].sort(), 'Unexpected public projection files');
const feed = fs.readFileSync(path.join(dist, 'rss/daily-math.xml'), 'utf8');
const items = [...feed.matchAll(/<item>[\s\S]*?<\/item>/g)].map(m => m[0]);
assert.equal(items.length, manifest.length, 'RSS must contain all history');
assert.ok(!feed.includes('<content:encoded'), 'Journal RSS must not embed full articles');
const escapeXml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
const base = '/knowledge/math/daily-math/';
const index = fs.readFileSync(path.join(dist, base, 'index.html'), 'utf8');
const rssPage = fs.readFileSync(path.join(dist, 'about/rss.html'), 'utf8');
assert.ok(rssPage.includes('/rss/daily-math.xml'));
assert.ok(index.includes('/rss/daily-math.xml'));
for (let i = 0; i < manifest.length; i++) {
  const r = manifest[i];
  const title = websiteTitle(r.date, r.title);
  const projected = matter(fs.readFileSync(path.join(source, `${r.date}.md`), 'utf8'));
  assert.equal(projected.data.title, title);
  assert.equal(projected.data.sourceSha256, r.sourceSha256);
  assert.ok(projected.content.startsWith(`\n# ${title}\n`) || projected.content.startsWith(`# ${title}\n`));
  assert.equal(sha256(fs.readFileSync(path.join(source, `${r.date}.md`))), r.projectionSha256);
  const url = `https://develata.me${base}${r.date}`;
  assert.ok(items[i].includes(`<guid isPermaLink="true">${url}</guid>`));
  assert.ok(items[i].includes(`<pubDate>${new Date(`${r.date}T00:00:00+08:00`).toUTCString()}</pubDate>`));
  assert.ok(items[i].includes(`<title>${escapeXml(title)}</title>`));
  assert.ok(items[i].includes(`<link>${url}</link>`));
  assert.match(items[i], /<description>[^<]+<\/description>/);
  const html = fs.readFileSync(path.join(dist, base, `${r.date}.html`), 'utf8');
  assert.ok(html.includes('<math'), `SSR math missing: ${r.date}`);
  assert.ok(html.includes(`<title>${escapeXml(title)} |`), `Page title missing: ${r.date}`);
  assert.ok(html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/)?.[0].includes(escapeXml(title)), `H1 missing: ${r.date}`);
  assert.ok(index.includes(escapeXml(title)), `Index title missing: ${r.date}`);
  assert.ok(index.match(new RegExp(`<a[^>]+href="${base}${r.date}"[^>]*>[\\s\\S]*?</a>`))?.[0].includes(escapeXml(title)), `Sidebar title missing: ${r.date}`);
  assert.ok(index.includes(r.date));
}
for (const name of ['knowledge.xml', 'knowledge-math.xml', 'all.xml']) {
  const aggregate = fs.readFileSync(path.join(dist, 'rss', name), 'utf8');
  const entries = [...aggregate.matchAll(/<item>[\s\S]*?<\/item>/g)].map(m => m[0]);
  const journal = entries.filter(item => item.includes(`<link>https://develata.me${base}`));
  assert.equal(journal.length, manifest.length, `${name}: all journal history`);
  assert.ok(journal.every(item => !item.includes('<content:encoded')), `${name}: journal must stay lightweight`);
  assert.ok(entries.some(item => !journal.includes(item) && item.includes('<content:encoded')), `${name}: unrelated full articles retained`);
}
console.log(JSON.stringify({ status: 'ok', articles: manifest.length, rssItems: items.length,
  oldest: manifest.at(-1).date, newest: manifest[0].date, rssBytes: Buffer.byteLength(feed) }));
