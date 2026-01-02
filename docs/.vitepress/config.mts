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
