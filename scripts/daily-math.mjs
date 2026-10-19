/** Registered journal -> deterministic public projection. Never modifies the archive. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

export const projectionPath = 'docs/knowledge/math/daily-math';
export const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function registeredIssues(archive) {
  const ledger = fs.readFileSync(path.join(archive, 'state/issues.jsonl'), 'utf8');
  const seen = new Set();
  const records = ledger.trim().split('\n').filter(Boolean).map(line => {
    const r = JSON.parse(line);
    const date = r.issue_id;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || r.date !== date ||
        new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date ||
        r.path !== `${date.slice(0, 4)}/${date.slice(5, 7)}/${date}.md` ||
        !/^[a-f0-9]{64}$/.test(r.sha256) || seen.has(date)) {
      throw new Error('Invalid/duplicate registered issue');
    }
    seen.add(date);
    return r;
  });
  if (!records.length) throw new Error('Empty registry refuses publication');
  return records.sort((a, b) => b.date.localeCompare(a.date));
}

export function projectIssue(archive, record) {
  const file = path.join(archive, record.path);
  if (fs.lstatSync(file).isSymbolicLink() || !fs.realpathSync(file).startsWith(`${fs.realpathSync(archive)}${path.sep}`)) {
    throw new Error('Archive path escapes source');
  }
  const source = fs.readFileSync(file);
  if (sha256(source) !== record.sha256) throw new Error(`Unregistered bytes: ${record.date}`);
  const { data, content } = matter(source.toString('utf8'));
  const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : data.date;
  if (date !== record.date || data.title !== record.title) throw new Error('Frontmatter disagrees with registry');
  // Public metadata is an allowlist: editorial control-plane keywords never reach pageData.
  const metadata = {
    title: `每日数学 · ${record.date} · ${record.title}`,
    date: `${record.date}T00:00:00+08:00`,
    description: String(data.topic_summary || record.title),
    journalIssue: record.date,
    sourceSha256: record.sha256,
  };
  // Historical JSON-escape damage: restore only witnessed TeX control prefixes.
  // Archive bytes and their registered hash remain unchanged; this is a public projection.
  const body = content.replace(/\u000crac/g, '\\frac').replace(/\u0008igl/g, '\\bigl')
    .replace(/\]\((?:\.\.?\/)+(?:\d{2}\/)?(\d{4}-\d{2}-\d{2})\.md(#[^)]*)?\)/g,
      (_match, date, fragment = '') => `](./${date}${fragment})`);
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(body)) throw new Error('Unsupported control character');
  return `---\n${Object.entries(metadata).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n')}\n---\n${body}`;
}

export function syncJournal(archive, repo = root) {
  const records = registeredIssues(archive);
  const target = path.join(repo, projectionPath);
  const previousFile = path.join(target, 'manifest.json');
  const previous = fs.existsSync(previousFile) ? JSON.parse(fs.readFileSync(previousFile, 'utf8')) : [];
  // A missing ledger entry must not silently delete already published history.
  const ids = new Set(records.map(r => r.date));
  if (previous.some(r => !ids.has(r.date))) throw new Error('Registry would remove published history');
  const allowed = new Set(['index.md', 'manifest.json', ...records.map(r => `${r.date}.md`)]);
  if (fs.existsSync(target)) {
    for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
      // Only our exact atomic-write remnants may be removed after interruption.
      if (entry.isFile() && entry.name.endsWith('.tmp') && allowed.has(entry.name.slice(0, -4))) {
        fs.unlinkSync(path.join(target, entry.name));
        continue;
      }
      if (!allowed.has(entry.name) || !entry.isFile()) throw new Error(`Unexpected projection file: ${entry.name}`);
    }
  }
  // Validate the entire input before any write. Retain hashes/metadata, not archive bodies.
  const manifest = records.map(r => ({ date: r.date, title: r.title, sourceSha256: r.sha256,
    projectionSha256: sha256(projectIssue(archive, r)) }));
  let changed = 0;
  function write(relative, content) {
    const file = path.join(target, relative);
    if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) return;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const temporary = `${file}.tmp`;
    fs.writeFileSync(temporary, content);
    fs.renameSync(temporary, file);
    changed++;
  }
  for (const [i, r] of records.entries()) {
    const file = path.join(target, `${r.date}.md`);
    if (fs.existsSync(file) && sha256(fs.readFileSync(file)) === manifest[i].projectionSha256) continue;
    write(`${r.date}.md`, projectIssue(archive, r));
  }
  const index = ['---', 'title: 每日数学', 'description: 数学概念、证明、反例与思想的每日札记；完整历史归档。', '---', '', '# 每日数学', '',
    '数学概念的来路、证明的机制、假设的边界，以及值得继续追问的问题。', '',
    '[订阅每日数学 RSS（全部历史、全文）](/rss/daily-math.xml) · [全部订阅](/about/rss)', '',
    `共 **${records.length}** 期，按原始日期倒序排列。`, ''];
  let month = '';
  for (const r of records) {
    if (r.date.slice(0, 7) !== month) { month = r.date.slice(0, 7); index.push('', `## ${month}`, ''); }
    const title = r.title.replace(/[\\[\]<>]/g, c => `&#${c.charCodeAt(0)};`);
    index.push(`- [${r.date} — ${title}](./${r.date})`);
  }
  write('index.md', `${index.join('\n')}\n`);
  write('manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
  return { count: records.length, changed, oldest: records.at(-1).date, newest: records[0].date };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error('Usage: node scripts/daily-math.mjs ARCHIVE');
  console.log(JSON.stringify(syncJournal(path.resolve(process.argv[2]))));
}
