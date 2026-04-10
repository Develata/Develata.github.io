/**
 * @file config.mts
 * @description VitePress 主配置文件 (Main Configuration)
 * 职责：
 * 1. 汇编所有配置模块 (Nav, Sidebar, Plugin)。
 * 2. 配置 Vite 构建选项和 Markdown 解析规则。
 * 3. 定义全局主题行为 (Search, SocialLinks, Outline)。
 */
import { defineConfig } from 'vitepress';
import markdownItMathjax3 from 'markdown-it-mathjax3';
import { withMermaid } from 'vitepress-plugin-mermaid';
import { nav } from './configs/nav';
import { sidebar } from './configs/sidebar';
import { autoInjectTitle } from './plugins/auto-inject-title';
import { tokenizeMixedText, tokenizeSearchQuery } from './utils/search-tokenize';

const SEARCHABLE_PREFIXES = [
  'index.md',
  'about/',
  'books/',
  'games/',
  'knowledge/',
];

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

type SearchFrontmatter = {
  aliases: string[];
  keywords: string[];
  searchDisabled: boolean;
  title?: string;
};

function parseListField(block: string, field: string): string[] {
  const match = block.match(new RegExp(`^${field}:\\s*\\r?\\n((?:\\s+-\\s+.*\\r?\\n?)*)`, 'm'));
  if (!match) return [];
  return match[1]
    .split(/\r?\n/)
    .map((line) => line.match(/^\s+-\s+(.+)\s*$/)?.[1]?.trim())
    .filter((value): value is string => Boolean(value))
    .map((value) => value.replace(/^['"]|['"]$/g, ''));
}

function parseFrontmatter(src: string): SearchFrontmatter {
  const match = src.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    return { aliases: [], keywords: [], searchDisabled: false };
  }

  const block = match[1];
  const searchDisabled = /^search:\s*false\s*$/m.test(block);
  const titleMatch = block.match(/^title:\s*(.+)\s*$/m);
  const rawTitle = titleMatch?.[1]?.trim();
  const title = rawTitle
    ? rawTitle.replace(/^['"]/, '').replace(/['"]$/, '')
    : undefined;
  const aliases = parseListField(block, 'aliases');
  const keywords = parseListField(block, 'keywords');

  return { aliases, keywords, searchDisabled, title };
}

export default withMermaid(
  defineConfig({
    lang: 'zh-CN',
    title: "Develata's Space",
    description: 'Math & Code',
    base: '/',
    cleanUrls: true,
    head: [
      ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ],

    // --------------------------------------------------
    // Vite 插件配置
    // --------------------------------------------------
    vite: {
      build: {
        chunkSizeWarningLimit: 2000
      },
      plugins: [
        autoInjectTitle()
      ]
    },

    markdown: {
      lineNumbers: true,
      config: (md) => {
        md.use(markdownItMathjax3);
      },
    },

    themeConfig: {
      nav,
      sidebar,

      search: {
        provider: 'local',
        options: {
          miniSearch: {
            options: {
              tokenize: tokenizeMixedText,
            },
            searchOptions: {
              tokenize: tokenizeSearchQuery,
            },
          },
          /**
           * 本地搜索只索引指定栏目中的 Markdown 文本内容。
           * 不变量：
           * 1. frontmatter 显式 `search: false` 的页面必须完全排除；
           * 2. `news/` 与未来新增的未列入白名单目录默认不进入索引；
           * 3. 页面标题与正文文本仍保留，但代码块不参与索引；
           * 4. `_render` 必须返回 HTML，交给 VitePress 的 section 抽取逻辑继续处理。
           */
          _render(src, env, md) {
            const frontmatter = parseFrontmatter(src);
            if (frontmatter.searchDisabled || !SEARCHABLE_PREFIXES.some((prefix) => env.relativePath.startsWith(prefix))) {
              return '';
            }
            const keywordHints = frontmatter.keywords
              .filter((value) => value.trim())
              .flatMap((value) => [
                `<h2>${escapeHtml(value)}<a href="#">#</a></h2>`,
                `<p>${escapeHtml(value)}</p>`,
                `<p>${escapeHtml(value)}</p>`,
              ])
              .join('');
            const aliasHints = frontmatter.aliases
              .filter((value) => value.trim())
              .map((value) => `<p>${escapeHtml(value)}</p>`)
              .join('');
            const pathHint = env.relativePath.trim()
              ? `<p>${escapeHtml(env.relativePath.replace(/\/+/g, ' ').replace(/[-_./]/g, ' '))}</p>`
              : '';
            const titlePrefix = typeof frontmatter.title === 'string'
              ? `<h1>${escapeHtml(frontmatter.title)}<a href="#">#</a></h1><p>${escapeHtml(frontmatter.title)}</p>`
              : '';
            return `${keywordHints}${titlePrefix}${aliasHints}${pathHint}${md.render(src, env)}`
              .replace(/<pre[\s\S]*?<\/pre>/g, ' ')
              .replace(/<div class="language-[\s\S]*?<\/div>/g, ' ');
          },
        },
      },

      socialLinks: [
        { icon: 'github', link: 'https://github.com/Develata' },
      ],

      outline: {
        level: [1, 4],
        label: '目录',
      },
    },
  }),
);
