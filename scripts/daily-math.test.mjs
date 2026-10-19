import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { syncJournal, sha256, projectionPath } from './daily-math.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'journal-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const archive = path.join(root, 'archive');
  fs.mkdirSync(path.join(archive, 'state'), { recursive: true });
  const records = [];
  function issue(date) {
    const relative = `${date.slice(0, 4)}/${date.slice(5, 7)}/${date}.md`;
    const file = path.join(archive, relative);
    const source = `---\ndate: ${date}\ntitle: Test\nsection_keywords: {private: [editorial]}\n---\n# Test\n\n$x^2$\n\n<details><summary>Proof</summary>\n\n$$x=1$$\n\n</details>\n`;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, source);
    records.push({ issue_id: date, date, title: 'Test', path: relative, sha256: sha256(source) });
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
  fs.appendFileSync(file, '\nMarkdown hard break  \nnext line\n');
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
  run('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'fixture']);
  assert.equal(JSON.parse(run('bun', ['run', 'daily-math:sync', f.archive])).changed, 0);
  fs.writeFileSync(path.join(f.target, 'unregistered.md'), 'not registered');
  assert.throws(() => syncJournal(f.archive, f.root), /Unexpected projection/);
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
