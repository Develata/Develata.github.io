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

const SEARCHABLE_PREFIXES = [
  'index.md',
  'about/',
  'books/',
  'design/',
  'games/',
  'knowledge/',
];

function tokenizeMixedText(text: string): string[] {
  const normalized = text.toLowerCase().trim();
  if (!normalized) return [];

  const tokens = new Set<string>();
  const latinTokens = normalized.match(/[a-z0-9][a-z0-9_-]*/g) ?? [];
  latinTokens.forEach((token) => tokens.add(token));

  const cjkSegments = normalized.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+/gu) ?? [];
  cjkSegments.forEach((segment) => {
    tokens.add(segment);
    if (segment.length === 1) {
      tokens.add(segment);
      return;
    }
    for (let i = 0; i < segment.length - 1; i += 1) {
      tokens.add(segment.slice(i, i + 2));
    }
  });

  return [...tokens];
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
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
              tokenize: tokenizeMixedText,
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
            if (env.frontmatter?.search === false || !SEARCHABLE_PREFIXES.some((prefix) => env.relativePath.startsWith(prefix))) {
              return '';
            }
            const title = typeof env.frontmatter?.title === 'string'
              ? `<h1>${escapeHtml(env.frontmatter.title)}</h1><p>${escapeHtml(env.frontmatter.title)}</p>`
              : '';
            return `${title}${md.render(src, env)}`
              .replace(/<pre[\s\S]*?<\/pre>/g, ' ')
              .replace(/<code[\s\S]*?<\/code>/g, ' ');
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
