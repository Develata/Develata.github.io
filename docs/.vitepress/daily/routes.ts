/** Static-host redirects, emitted after VitePress so they cannot enter search/RSS.
 * GitHub Pages has no _redirects support. These are HTTP 200 HTML documents with
 * location.replace (query/hash retained), meta refresh and a native no-JS link.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { SiteConfig } from 'vitepress';

export function dailyRedirects(pages: string[]): [string, string][] {
  return pages.flatMap(page => {
    if (page.startsWith('news/')) return [[page, `daily/${page}`] as [string, string]];
    if (page.startsWith('daily/math/')) return [[page.replace('daily/math/', 'knowledge/math/daily-math/'), page] as [string, string]];
    return [];
  });
}
export function redirectHtml(target: string): string {
  const url = new URL(target.replace(/index\.md$/, '').replace(/\.md$/, ''), 'https://develata.me/');
  const href = url.pathname;
  const attr = (s: string) => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="robots" content="noindex"><link rel="canonical" href="${attr(url.href)}"><script>location.replace(${JSON.stringify(href)}+location.search+location.hash)</script><meta http-equiv="refresh" content="0;url=${attr(href)}"><title>页面已迁移</title></head><body><a href="${attr(href)}">继续访问新地址</a></body></html>`;
}
export function writeDailyRedirects(config: Pick<SiteConfig, 'pages' | 'outDir'>): void {
  for (const [source, target] of dailyRedirects(config.pages)) {
    const file = path.join(config.outDir, source.replace(/\.md$/, '.html'));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, redirectHtml(target));
  }
}
