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
  name: "My Awesome Space"
  text: "Built with VitePress & Develata Template"
  tagline: Mathematics, Coding, Thinking, and Gaming.
  actions:
    - theme: brand
      text: "Start Exploring"
      link: "/games/"
    - theme: alt
      text: "View on GitHub"
      link: "https://github.com/Develata/develata.github.io"

features:
  - title: 🎮 Interactive Games
    details: Built-in Vue 3 games like Tetris, Snake, Minesweeper, and more.
  - title: 🧮 Math Friendly
    details: Native LaTeX support for mathematical documentation.
  - title: 📝 Markdown & Vue
    details: Write content in Markdown, enhance it with dynamic Vue components.
---
`,
  'about/index.md': `# About

Welcome to your new blog!

This is a template page. You can edit this file at \`docs/about/index.md\`.
`
};

console.log('🧹 Starting template cleanup...');

// 1. Empty Directories
for (const dir of dirsToEmpty) {
  const absolutePath = path.resolve(docsDir, dir);
  if (fs.existsSync(absolutePath)) {
    console.log(`Cleaning directory: ${dir}`);
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
        console.log(`Deleting file: ${file}`);
        fs.rmSync(absolutePath);
    }
}

// 3. Reset files
for (const [file, content] of Object.entries(filesToReset)) {
  const absolutePath = path.resolve(docsDir, file);
  console.log(`Resetting file: ${file}`);
  fs.writeFileSync(absolutePath, content, 'utf-8');
}

console.log('✨ Cleanup complete! The project is now a clean template.');
