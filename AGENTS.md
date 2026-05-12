# AGENTS.md - Project Guidelines for Develata.github.io

> **Role & Context**: You are acting as a "Math Architect" and Senior Full-Stack Engineer. This project is a VitePress-based personal knowledge base ("Develata's Space") focused on Mathematics, Code, and Logic. It includes interactive games/simulations implemented as Vue components.

## 1. Build, Lint, & Test Commands

Since this is a documentation site without a dedicated test suite, "testing" primarily means ensuring the build passes and the site renders correctly.

- **Verification (Build Check)**: 
  ```bash
  npm run build
  ```
  *Always run this after making changes to TypeScript config or Vue components to ensure no type/compilation errors.*

- **Development Server**:
  ```bash
  npm run dev
  ```
  *Use this to preview changes locally at http://localhost:5173.*

- **Linting/Formatting**: 
  - No strict linter is currently configured. 
  - **Rule**: Mimic the existing style (see Section 2). 
  - If unsure, standard `prettier` formatting (2 spaces, single quotes) is safe.

## 2. Code Style & Conventions

### Language & Syntax
- **TypeScript**: Use `.mts` for VitePress config files and `.ts` for utilities.
  - Use `node:` prefix for Node.js built-ins (e.g., `import fs from 'node:fs'`).
  - Use explicit types where helpful, but avoid over-engineering for simple UI logic.
- **Vue**: Use `<script setup lang="ts">` for components.
- **Formatting**:
  - **Indentation**: 2 spaces.
  - **Quotes**: Single quotes `'` preferred.
  - **Semicolons**: Yes, use them (observed in `index.mts`, `sidebar.ts`).

### Architecture & Components
- **Global Components**: Registered in `docs/.vitepress/theme/index.mts`.
- **Game Components**:
  - Located in `docs/.vitepress/theme/components/games/`.
  - **Lazy Loading**: MUST use the `createGameComponent` helper in `theme/index.mts` for heavy game components to optimize initial load time.
  - **Wrapper**: Games are typically wrapped in a `<div>` or embedded directly in Markdown files (e.g., `docs/games/math-lab/life.md`).

### Documentation & Comments
- **JSDoc**: Use JSDoc style comments for file headers and complex functions (see `config.mts`).
  ```typescript
  /**
   * @file filename.ts
   * @description Brief description of purpose
   */
  ```
- **Invariants**: For math/algorithm heavy code (e.g., in `math-lab`), explicitly comment on invariants and pre/post-conditions.

## 3. Engineering Constraints (Math-Architect Rules)

**Target Environment**: Low-resource VPS (e.g., 768MB RAM).
**Critical Rules**:
1.  **Memory Optimization**: 
    - Prefer lightweight solutions. 
    - Avoid heavy dependencies unless absolutely necessary.
    - Use async/lazy loading for non-critical assets (like the Games).
2.  **File Size Discipline**:
    - **Soft Rule**: Prefer naturally modular files. Split code when a module mixes unrelated concerns, hides key invariants, or becomes hard to review, rather than optimizing for an arbitrary short line count.
    - **Hard Limit**: Keep implementation files under **400 lines**. If a file exceeds this, refactor/split it unless there is a clear, documented reason to keep it together.
3.  **Math & Formalization**:
    - When implementing algorithms, prioritize correctness and clarity.
    - If modifying `math-lab`, ensure the mathematical logic is sound.

## 4. Directory Structure
- `docs/`: Markdown content root.
- `docs/.vitepress/config.mts`: Main configuration.
- `docs/.vitepress/theme/`: Custom theme, styles (`custom.css`), and components.
- `docs/.vitepress/utils/`: Build-time utilities (e.g., sidebar generation).

## 5. Workflow
1.  **Read**: Check `config.mts` or `theme/index.mts` before adding new global capabilities.
2.  **Plan**: If adding a new game/feature, decide if it needs a new component or just Markdown.
3.  **Implement**: Follow the style guides above.
4.  **Verify**: Run `npm run build` to ensure no breakages.
