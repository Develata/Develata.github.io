import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { syncJournal, sha256, projectionPath, websiteTitle } from './daily-math.mjs';
import matter from 'gray-matter';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'journal-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const archive = path.join(root, 'archive');
  fs.mkdirSync(path.join(archive, 'state'), { recursive: true });
  const records = [];
  function issue(date, title = 'Test') {
    const relative = `${date.slice(0, 4)}/${date.slice(5, 7)}/${date}.md`;
    const file = path.join(archive, relative);
    const source = `---\ndate: ${date}\ntitle: ${JSON.stringify(title)}\nsection_keywords: {private: [editorial]}\n---\n# ${title}\n\n$x^2$\n\n<details><summary>Proof</summary>\n\n$$x=1$$\n\n</details>\n`;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, source);
    records.push({ issue_id: date, date, title, path: relative, sha256: sha256(source) });
    save();
    return file;
  }
  function save() { fs.writeFileSync(path.join(archive, 'state/issues.jsonl'), records.map(r => JSON.stringify(r)).join('\n')); }
  issue('2026-07-17');
  return { root, archive, records, issue, save, target: path.join(root, projectionPath) };
}

test('complete history, original dates, body preservation and incremental no-op', t => {
  const f = fixture(t);
  assert.equal(syncJournal(f.archive, f.root).count, 1);
  const file = path.join(f.target, '2026-07-17.md');
  const before = fs.statSync(file).mtimeMs;
  const text = fs.readFileSync(file, 'utf8');
  assert.match(text, /2026-07-17T00:00:00\+08:00/);
  assert.match(text, /\$x\^2\$/);
  assert.match(text, /<details>/);
  assert.doesNotMatch(text, /section_keywords|editorial/);
  assert.equal(syncJournal(f.archive, f.root).changed, 0);
  assert.equal(fs.statSync(file).mtimeMs, before);
  f.issue('2026-07-18');
  assert.deepEqual(syncJournal(f.archive, f.root), { count: 2, changed: 3, oldest: '2026-07-17', newest: '2026-07-18' });
  assert.equal(fs.statSync(file).mtimeMs, before);
});

test('concise website titles preserve mathematical punctuation and are idempotent', () => {
  const cases = [
    ['边界不是少算半圈：带边曲面的角亏、转角与加倍法', '边界不是少算半圈'],
    ['把 Euler 公式局部化：平面图、离散曲率与 Gauss–Bonnet', '把 Euler 公式局部化'],
    ['只有一种简单块，却有 p 种不可分解块：循环 p 群的 Jordan 分类', '只有一种简单块，却有 p 种不可分解块'],
    ['每日数学 · 2026-10-19 · 边界不是少算半圈：带边曲面', '边界不是少算半圈'],
    ['没有副标题', '没有副标题'],
    ['比值 1:2 与映射 f: X → Y', '比值 1:2 与映射 f: X → Y'],
    ['$f : X \\to Y$：映射的解释', '$f : X \\to Y$'],
    ['$$x：y$$：解释', '$$x：y$$'],
    ['`a：b`：解释', '`a：b`'],
    ['（定义：局部）与“问题：边界”：解释', '（定义：局部）与“问题：边界”'],
    ['映射 f : X → Y', '映射 f : X → Y'],
  ];
  for (const [source, topic] of cases) {
    const title = websiteTitle('2026-10-19', source);
    assert.equal(title, `2026-10-19 · ${topic}`);
    assert.equal(websiteTitle('2026-10-19', title), title);
  }
});

test('future imports share headline policy without rewriting sources or body', t => {
  const f = fixture(t);
  syncJournal(f.archive, f.root);
  const date = '2027-01-01';
  const title = '未来的主标题：完整解释留在描述';
  const source = f.issue(date, title);
  const before = fs.readFileSync(source);
  assert.equal(syncJournal(f.archive, f.root).count, 2);
  const projected = matter(fs.readFileSync(path.join(f.target, `${date}.md`), 'utf8'));
  assert.equal(projected.data.title, `${date} · 未来的主标题`);
  assert.equal(projected.data.description, title);
  assert.equal(projected.data.sourceSha256, sha256(before));
  assert.equal(projected.data.date, `${date}T00:00:00+08:00`);
  assert.equal(projected.content.replace(/^# .+\n/, ''), matter(before.toString()).content.replace(/^# .+\n/, ''));
  assert.ok(projected.content.startsWith(`# ${projected.data.title}\n`));
  assert.ok(fs.readFileSync(path.join(f.target, 'index.md'), 'utf8').includes(`[${projected.data.title}](./${date})`));
  assert.deepEqual(fs.readFileSync(source), before);
  assert.equal(syncJournal(f.archive, f.root).changed, 0);
});

test('reject unregistered bytes before writing any projection', t => {
  const f = fixture(t);
  const file = f.issue('2026-07-18');
  fs.appendFileSync(file, '\nchanged');
  assert.throws(() => syncJournal(f.archive, f.root), /Unregistered bytes/);
  assert.equal(fs.existsSync(f.target), false);
});

test('ignore unregistered drafts; reject missing historical registration', t => {
  const f = fixture(t);
  fs.writeFileSync(path.join(f.archive, '2026/07/2026-07-19.md'), 'draft');
  assert.equal(syncJournal(f.archive, f.root).count, 1);
  f.issue('2026-07-18');
  syncJournal(f.archive, f.root);
  f.records.shift(); f.save();
  assert.throws(() => syncJournal(f.archive, f.root), /remove published history/);
});

for (const mutation of [r => r.path = '../../secret', r => r.date = '2026-07-18', r => r.sha256 = 'bad']) {
  test('reject invalid ledger fields', t => {
    const f = fixture(t); mutation(f.records[0]); f.save();
    assert.throws(() => syncJournal(f.archive, f.root), /Invalid/);
  });
}

test('reject duplicates, mismatched title and source symlink', t => {
  const f = fixture(t);
  f.records.push({ ...f.records[0] }); f.save();
  assert.throws(() => syncJournal(f.archive, f.root), /duplicate/);
  f.records.pop(); f.records[0].title = 'Wrong'; f.save();
  assert.throws(() => syncJournal(f.archive, f.root), /Frontmatter/);
  f.records[0].title = 'Test'; f.save();
  const file = path.join(f.archive, f.records[0].path);
  fs.renameSync(file, `${file}.real`); fs.symlinkSync(`${file}.real`, file);
  assert.throws(() => syncJournal(f.archive, f.root), /escapes/);
});

test('projection repairs known TeX escapes and relocates archive links', t => {
  const f = fixture(t);
  const file = path.join(f.archive, f.records[0].path);
  fs.appendFileSync(file, '\n$$\n\frac12+\bigl(x)\n$$\n[previous](../07/2026-07-17.md#test)\n');
  const before = fs.readFileSync(file);
  f.records[0].sha256 = sha256(before); f.save();
  syncJournal(f.archive, f.root);
  const projected = fs.readFileSync(path.join(f.target, '2026-07-17.md'), 'utf8');
  assert.ok(projected.includes('\\frac12+\\bigl(x)'));
  assert.ok(projected.includes('](./2026-07-17#test)'));
  assert.deepEqual(fs.readFileSync(file), before);
});

test('real Bun CLI and Git preserve trailing-space source and commit successfully', t => {
  const f = fixture(t);
  const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const file = path.join(f.archive, f.records[0].path);
  fs.appendFileSync(file, '\nMarkdown hard break  \nnext line\n  \tindent\n\n');
  f.records[0].sha256 = sha256(fs.readFileSync(file)); f.save();
  fs.mkdirSync(path.join(f.root, 'scripts'));
  fs.copyFileSync(path.join(repo, 'scripts/daily-math.mjs'), path.join(f.root, 'scripts/daily-math.mjs'));
  fs.copyFileSync(path.join(repo, '.gitattributes'), path.join(f.root, '.gitattributes'));
  const script = JSON.parse(fs.readFileSync(path.join(repo, 'package.json'), 'utf8')).scripts['daily-math:sync'];
  fs.writeFileSync(path.join(f.root, 'package.json'), JSON.stringify({ scripts: { 'daily-math:sync': script } }));
  fs.symlinkSync(path.join(repo, 'node_modules'), path.join(f.root, 'node_modules'), 'dir');
  function run(cmd, args) {
    const r = spawnSync(cmd, args, { cwd: f.root, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    return r.stdout;
  }
  assert.equal(JSON.parse(run('bun', ['run', 'daily-math:sync', f.archive])).count, 1);
  run('git', ['init', '-q']);
  run('git', ['add', '--', projectionPath, '.gitattributes']);
  run('git', ['diff', '--cached', '--check']);
  run('git', ['-c', 'commit.gpgsign=false', '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'fixture']);
  assert.equal(JSON.parse(run('bun', ['run', 'daily-math:sync', f.archive])).changed, 0);
  fs.writeFileSync(path.join(f.target, '2026-07-17.md.tmp'), 'interrupted atomic write');
  assert.equal(syncJournal(f.archive, f.root).changed, 0);
  assert.equal(fs.existsSync(path.join(f.target, '2026-07-17.md.tmp')), false);
  fs.appendFileSync(path.join(f.target, '2026-07-17.md'), '\n<<<<<<< conflict\n');
  run('git', ['add', '--', projectionPath]);
  assert.notEqual(spawnSync('git', ['diff', '--cached', '--check'], { cwd: f.root }).status, 0);
  fs.writeFileSync(path.join(f.target, 'unregistered.md'), 'not registered');
  assert.throws(() => syncJournal(f.archive, f.root), /Unexpected projection/);
});

test('content-free template opts out explicitly while main stays fail-closed', t => {
  const f = fixture(t);
  const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  if (!fs.existsSync(path.join(repo, 'scripts/cleanup-for-template.mjs'))) {
    t.skip('Template branch deliberately removes its generator');
    return;
  }
  fs.mkdirSync(path.join(f.root, 'scripts'));
  for (const name of ['daily-math.mjs', 'verify-daily-math.mjs', 'cleanup-for-template.mjs']) {
    fs.copyFileSync(path.join(repo, 'scripts', name), path.join(f.root, 'scripts', name));
  }
  fs.copyFileSync(path.join(repo, 'package.json'), path.join(f.root, 'package.json'));
  fs.symlinkSync(path.join(repo, 'node_modules'), path.join(f.root, 'node_modules'), 'dir');
  syncJournal(f.archive, f.root);
  const cleanup = spawnSync(process.execPath, ['scripts/cleanup-for-template.mjs'], { cwd: f.root, encoding: 'utf8' });
  assert.equal(cleanup.status, 0, cleanup.stderr);
  assert.equal(fs.existsSync(f.target), false);
  const template = spawnSync('bun', ['run', 'daily-math:verify'], { cwd: f.root, encoding: 'utf8' });
  assert.equal(template.status, 0, template.stderr);
  assert.match(template.stdout, /content-free template/);
  assert.notEqual(spawnSync(process.execPath, ['scripts/verify-daily-math.mjs'], { cwd: f.root }).status, 0);
  assert.ok(!JSON.parse(fs.readFileSync(path.join(repo, 'package.json'), 'utf8')).scripts['daily-math:verify'].includes('--allow-empty'));
});

test('RSS full-text window retains all history, renders only five and preserves identities on shift', async () => {
  const { applyDailyMathWindow, DAILY_MATH_FULL_TEXT_LIMIT } = await import('../docs/.vitepress/rss/knowledge.ts');
  assert.equal(DAILY_MATH_FULL_TEXT_LIMIT, 5);
  const make = n => ({
    title: `Issue ${n}`, url: `https://develata.me/knowledge/math/daily-math/${n}`,
    date: new Date(Date.UTC(2026, 0, n)), description: `Summary ${n}`,
  });
  const identity = ({ contentHtml, ...metadata }) => metadata;
  for (const count of [0, 1, 4, 5, 6, 76]) {
    const items = Array.from({ length: count }, (_, i) => make(i + 1)); // oldest first deliberately
    const unrelated = { title: 'Other', url: 'https://develata.me/knowledge/math/other', date: new Date('2030-01-01'), contentHtml: '<p>unchanged</p>' };
    const before = items.map(identity);
    let calls = [];
    const render = item => { calls.push(item.url); return `<p>${item.title}</p>`; };
    applyDailyMathWindow([unrelated, ...items], render);
    assert.equal(calls.length, Math.min(5, count));
    assert.deepEqual(calls, items.slice(-5).reverse().map(item => item.url));
    assert.equal(items.filter(item => item.contentHtml).length, Math.min(5, count));
    assert.deepEqual(items.map(identity), before);
    assert.equal(unrelated.contentHtml, '<p>unchanged</p>');
    if (count >= 5) {
      const formerFifth = items[count - 5];
      assert.ok(formerFifth.contentHtml);
      const next = make(count + 1);
      calls = [];
      applyDailyMathWindow([next, unrelated, ...items], render);
      assert.equal(calls.length, 5);
      assert.equal(formerFifth.contentHtml, undefined);
      assert.ok(next.contentHtml);
      assert.deepEqual(items.map(identity), before);
      assert.equal(new Set([...items, next].map(item => item.url)).size, count + 1);
    }
  }
});

test('archive navigation disables speculative article-body downloads', () => {
  const config = fs.readFileSync(new URL('../docs/.vitepress/config.mts', import.meta.url), 'utf8');
  assert.match(config, /router:\s*\{\s*prefetchLinks:\s*false\s*\}/);
});

test('year/month archives stay descending and metadata-only as history grows', async t => {
  const f = fixture(t);
  for (const date of ['2025-12-31', '2027-02-03', '2027-01-01', '2027-02-01', '2026-01-02']) f.issue(date);
  syncJournal(f.archive, f.root);
  const index = fs.readFileSync(path.join(f.target, 'index.md'), 'utf8');
  assert.deepEqual([...index.matchAll(/^## (\d{4})$/gm)].map(m => m[1]), ['2027', '2026', '2025']);
  assert.deepEqual([...index.matchAll(/<summary>([^<]+)<\/summary>/g)].map(m => m[1]), ['2027-02', '2027-01', '2026-07', '2026-01', '2025-12']);
  assert.deepEqual([...index.matchAll(/\]\(\.\/(\d{4}-\d{2}-\d{2})\)/g)].map(m => m[1]), f.records.map(r => r.date).sort().reverse());
  assert.equal((index.match(/<details open>/g) ?? []).length, 1);
  assert.doesNotMatch(index, /\$x|Proof|import\(|fetch\(/);
  assert.equal(syncJournal(f.archive, f.root).changed, 0);
  const { calendarArchive, calendarSidebar } = await import('../docs/.vitepress/utils/calendar-archive.ts');
  for (const count of [0, 76, 4000]) {
    const entries = Array.from({ length: count }, (_, i) => {
      const date = new Date(Date.UTC(2020, 0, i + 1)).toISOString().slice(0, 10);
      return { title: date, url: `/journal/${date}`, timestamp: Date.parse(date), year: date.slice(0, 4), monthKey: date.slice(0, 7) };
    });
    const tree = calendarArchive(entries);
    assert.deepEqual(tree.flatMap(y => y.months.flatMap(m => m.items)), [...entries].reverse());
    const sidebar = calendarSidebar(entries);
    const visibleMonths = sidebar.filter(y => !y.collapsed).flatMap(y => y.items.filter(m => !m.collapsed));
    assert.equal(visibleMonths.length, count ? 1 : 0);
    assert.ok(visibleMonths.flatMap(m => m.items).length <= 31);
    assert.equal(sidebar.flatMap(y => y.items.flatMap(m => m.items)).length, count);
  }
});

test('journal MathML is compact and deterministic across cache eviction', async () => {
  const { default: MarkdownIt } = await import('markdown-it');
  const { boundedMath } = await import('../docs/.vitepress/utils/bounded-math.ts');
  const md = new MarkdownIt().use(boundedMath, { native: true });
  const source = '$x^2$\n\n$$\\frac{1}{2}$$';
  const html = md.render(source);
  assert.match(html, /<math/);
  assert.match(html, /<mfrac>/);
  assert.doesNotMatch(html, /<svg|<merror/);
  assert.ok(html.length < 1500);
  assert.equal(md.render(source), html);
  for (let i = 0; i < 300; i++) md.render(`$x+${i}$`);
  assert.equal(md.render(source), html);
});
