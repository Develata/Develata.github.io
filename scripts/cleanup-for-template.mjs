import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const docsDir = path.resolve(rootDir, 'docs');

// Configuration: Directories to empty (keep the directory, remove files)
const dirsToEmpty = [
  'knowledge/math',
  'knowledge/coding',
  'knowledge/sharing',
  'books',
  'news',
  'news/AI_ML',
  'news/Math',
  'news/世界时事',
  'news/科技新闻',
  'news/舆情热点',
  'about/blog'
];

// Configuration: Files to delete specifically
const filesToDelete = [
    'about/me.md'
];

// Configuration: Files to overwrite with template content
const filesToReset = {
  'index.md': `---
layout: home

hero:
  name: "我的数字空间"
  text: "基于 VitePress & Develata Template 构建"
  tagline: 数学、编程、思考与游戏。
  actions:
    - theme: brand
      text: "开始探索"
      link: "/games/"
    - theme: alt
      text: "查看 GitHub"
      link: "https://github.com/Develata/develata.github.io"

features:
  - title: 🎮 互动游戏
    details: 内置 Tetris, Snake, Minesweeper 等 Vue 3 组件游戏。
  - title: 🧮 数学友好
    details: 原生支持 LaTeX 数学公式渲染。
  - title: 📝 Markdown & Vue
    details: 使用 Markdown 写作，并利用 Vue 组件增强交互。
---
`,
  'about/index.md': `# 关于

欢迎来到你的新博客！

这是一个模板页面。你可以在 \`docs/about/index.md\` 编辑此文件。
`
};

console.log('🧹 开始清理模板内容...');

// 1. Empty Directories
for (const dir of dirsToEmpty) {
  const absolutePath = path.resolve(docsDir, dir);
  if (fs.existsSync(absolutePath)) {
    console.log(`正在清理目录: ${dir}`);
    const files = fs.readdirSync(absolutePath);
    for (const file of files) {
      if (file === '.vitepress' || file.startsWith('.')) continue; // Skip config or hidden
      const filePath = path.join(absolutePath, file);
      
      // Recursive delete if it's a subdirectory inside a target dir (e.g. images)
      fs.rmSync(filePath, { recursive: true, force: true });
    }
    
    // Create a .gitkeep to ensure git tracks the folder
    fs.writeFileSync(path.join(absolutePath, '.gitkeep'), '');
  } else {
      // Create if doesn't exist (to maintain structure)
      fs.mkdirSync(absolutePath, { recursive: true });
      fs.writeFileSync(path.join(absolutePath, '.gitkeep'), '');
  }
}

// 2. Delete specific files
for (const file of filesToDelete) {
    const absolutePath = path.resolve(docsDir, file);
    if (fs.existsSync(absolutePath)) {
        console.log(`正在删除文件: ${file}`);
        fs.rmSync(absolutePath);
    }
}

// 3. Reset files
for (const [file, content] of Object.entries(filesToReset)) {
  const absolutePath = path.resolve(docsDir, file);
  console.log(`正在重置文件: ${file}`);
  fs.writeFileSync(absolutePath, content, 'utf-8');
}

console.log('✨ 清理完成！项目现在是一个纯净的模板。');
