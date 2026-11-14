/**
 * @file bilingual-pairs.ts
 * @description 双语逐段配对 (markdown-it core rule)。
 *
 * 约定（frontmatter）：
 * - 中文主页面：`translation: "<同目录英文文件名，不含 .md>"`；
 * - 英文页面：`lang: en`、`translation: "<中文文件名>"`、`hideInSidebar: true`。
 *
 * 渲染中文主页面时，读取英文文件，按顶层 Markdown 块逐一配对，输出
 *   <div class="bi-pair"><div class="bi-zh">块 i</div><div class="bi-en">块 i</div></div>
 * 默认只显示中文；切换到「对照」只改 <html> 上的类名（见 theme/bilingual.css）。
 *
 * 不变量：
 * 1. 两侧顶层块数必须相等，否则构建失败并指出文件——宁可报错，不静默错位；
 * 2. 英文一侧走与中文相同的标题注入规则（injectTitle），保证块数口径一致；
 * 3. 英文标题去掉 id 与锚点：大纲只收中文标题，也不会与中文标题 id 冲突；
 * 4. 本地搜索渲染（env.bilingualSkip）不配对，英文只由英文页面自己被索引，避免重复命中。
 */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type MarkdownIt from 'markdown-it';
import { injectTitle } from './auto-inject-title';

type Token = ReturnType<MarkdownIt['parse']>[number];
type TokenConstructor = new (type: string, tag: string, nesting: number) => Token;

interface BilingualEnv {
  path?: string;
  relativePath?: string;
  cleanUrls?: boolean;
  frontmatter?: Record<string, unknown>;
  bilingualSkip?: boolean;
  bilingualInner?: boolean;
}

/** 按嵌套深度把 token 流切成顶层块；每块从深度 0 开始、回到深度 0 结束。 */
function splitTopLevelBlocks(tokens: Token[]): Token[][] {
  const blocks: Token[][] = [];
  let current: Token[] = [];
  let depth = 0;
  for (const token of tokens) {
    current.push(token);
    depth += token.nesting;
    if (depth === 0) {
      blocks.push(current);
      current = [];
    }
  }
  if (current.length > 0) throw new Error('unbalanced markdown token stream');
  return blocks;
}

/** 去掉英文标题的 id 与 header-anchor 链接。 */
function stripHeadingAnchors(tokens: Token[]): void {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type !== 'heading_open') continue;
    token.attrs = (token.attrs ?? []).filter(([name]) => name !== 'id' && name !== 'tabindex');
    const inline = tokens[i + 1];
    if (inline?.type !== 'inline' || !inline.children) continue;
    const kept: Token[] = [];
    let skipping = false;
    for (const child of inline.children) {
      if (child.type === 'link_open' && (child.attrGet('class') ?? '').includes('header-anchor')) {
        skipping = true;
        continue;
      }
      if (skipping) {
        if (child.type === 'link_close') skipping = false;
        continue;
      }
      kept.push(child);
    }
    inline.children = kept;
  }
}

function htmlBlock(state: { Token: TokenConstructor }, content: string): Token {
  const token = new state.Token('html_block', '', 0);
  token.content = content;
  return token;
}

export function bilingualPairs(md: MarkdownIt): void {
  md.core.ruler.push('bilingual_pairs', (state) => {
    const env = state.env as BilingualEnv;
    const frontmatter = env.frontmatter ?? {};
    const translation = frontmatter.translation;
    if (env.bilingualSkip || env.bilingualInner) return;
    if (typeof translation !== 'string' || frontmatter.lang === 'en' || !env.path) return;

    const selfPath = env.path;
    const partnerPath = path.join(path.dirname(selfPath), `${translation}.md`);
    const label = env.relativePath ?? selfPath;
    if (!fs.existsSync(partnerPath)) {
      throw new Error(`[bilingual] ${label}: translation file not found: ${partnerPath}`);
    }

    const { data, content } = matter(fs.readFileSync(partnerPath, 'utf-8'));
    const body = typeof data.title === 'string' && data.injectTitle !== false
      ? injectTitle(content, data.title)
      : content;
    const partnerEnv: BilingualEnv = {
      path: partnerPath,
      relativePath: path.join(path.dirname(env.relativePath ?? ''), `${translation}.md`).replace(/\\/g, '/'),
      cleanUrls: env.cleanUrls,
      bilingualInner: true,
    };
    const partnerTokens = md.parse(body, partnerEnv);
    stripHeadingAnchors(partnerTokens);

    const zhBlocks = splitTopLevelBlocks(state.tokens);
    const enBlocks = splitTopLevelBlocks(partnerTokens);
    if (zhBlocks.length !== enBlocks.length) {
      throw new Error(
        `[bilingual] ${label}: ${zhBlocks.length} top-level blocks, but ${partnerEnv.relativePath} has ${enBlocks.length}. `
        + 'Paired paragraphs must match one-to-one.',
      );
    }

    const paired: Token[] = [];
    zhBlocks.forEach((zhBlock, i) => {
      paired.push(htmlBlock(state, '<div class="bi-pair"><div class="bi-zh" lang="zh-CN">\n'));
      paired.push(...zhBlock);
      paired.push(htmlBlock(state, '</div><div class="bi-en" lang="en">\n'));
      paired.push(...enBlocks[i]);
      paired.push(htmlBlock(state, '</div></div>\n'));
    });
    state.tokens = paired;
  });
}
