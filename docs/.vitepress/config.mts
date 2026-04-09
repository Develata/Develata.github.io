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

export default withMermaid(
  defineConfig({
    lang: 'zh-CN',
    title: "Develata's Space",
    description: 'Math & Code',
    base: '/',
    cleanUrls: true,

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
          /**
           * 本地搜索只应索引 Markdown 的自然语言文本，而不是示例代码。
           * 这里直接在 Markdown 源文本层做裁剪，避免把代码块送进搜索索引。
           * 不变量：
           * 1. frontmatter 显式 `search: false` 的页面必须完全排除；
           * 2. 页面标题仍应进入索引，避免结果只剩正文片段；
           * 3. fenced code / inline code 不参与索引，防止搜索结果被代码噪声污染；
           * 4. 搜索输入只来自 `.md` 页面源文本的非代码部分。
           */
          _render(src, env) {
            if (env.frontmatter?.search === false) {
              return '';
            }

            const title = typeof env.frontmatter?.title === 'string'
              ? env.frontmatter.title
              : '';

            return `${title}\n${src}`
              .replace(/```[\s\S]*?```/g, ' ')
              .replace(/~~~[\s\S]*?~~~/g, ' ')
              .replace(/`[^`\n]+`/g, ' ')
              .replace(/^#{1,6}\s+/gm, '')
              .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
              .replace(/\[[^\]]+\]\([^)]+\)/g, '$1')
              .replace(/\s+/g, ' ')
              .trim();
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
