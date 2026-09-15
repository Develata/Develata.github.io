# AGENTS.md - Project Guidelines for Develata.github.io

> **Role & Context**: You are acting as a Math Architect and Senior Full-Stack Engineer. This repository is a VitePress-based personal knowledge base for mathematics, code, logic, books, news, and interactive Vue games/simulations.

## 1. Build, Preview, and Verification

This site has no dedicated unit-test suite. Verification means checking the VitePress build, and for UI-heavy changes, previewing the rendered page.

- **Development server**
  ```bash
  npm run dev
  ```
  Starts VitePress for local preview.

- **Build check**
  ```bash
  npm run build
  ```
  Run this after changing VitePress config, build-time utilities, RSS generation, theme components, Vue games, or TypeScript modules.

- **Production preview**
  ```bash
  npm run preview
  ```
  Use after a successful build when rendered output or routing needs inspection.

- **Do not use `npm test` as verification.**
  The current `test` script is a placeholder that exits with an error.

## 2. Current Architecture

- `docs/`: Markdown content root.
- `docs/.vitepress/config.mts`: Main VitePress config. It wires nav/sidebar, MathJax, Mermaid, local search customization, RSS generation, and Vite plugins.
- `docs/.vitepress/configs/`: Site-level content/navigation configuration.
  - `content-modules.shared.ts`: canonical content module registry and search eligibility.
  - `nav.ts`: top navigation.
  - `sidebar.ts`: generated sidebar assembly.
- `docs/.vitepress/plugins/`: VitePress/Vite plugins, currently including automatic title injection.
- `docs/.vitepress/rss/`: RSS feed generation and dev-server feed support.
- `docs/.vitepress/utils/`: build-time helpers for sidebar generation, news indexing, and mixed Chinese/English search tokenization.
- `docs/.vitepress/theme/`: custom VitePress theme, layout, CSS, sidebar implementation, global components, and games.
- `docs/.vitepress/theme/components/games/`: interactive games and mathematical simulations.
  - Shared controls live under `games/controls/`.
  - Larger games should split core logic, UI components, persistence, and rendering into submodules, as already done by `sudoku/`, `minesweeper/`, `math-lab/`, and `convergence/`.

## 3. Code Style and Conventions

### TypeScript and Vue

- Use TypeScript for config, utilities, and game logic.
- Use `.mts` for VitePress config entry files when needed by existing convention; use `.ts` for regular utilities and logic modules.
- Use `node:` imports for Node.js built-ins.
- Use `<script setup lang="ts">` for Vue SFCs.
- Prefer explicit types at module boundaries, public helpers, algorithms, and shared state. Avoid type noise inside simple local UI code.
- Follow nearby file style. The repository is not fully uniform, so consistency within the edited module is more important than imposing a broad formatting rewrite.

### Markdown Content

- Keep Markdown content readable and stable under VitePress.
- Use frontmatter intentionally. `search: false` excludes a page from local search.
- When adding content under a new top-level section, update `content-modules.shared.ts` and sidebar/nav configuration if the section should be indexed or navigable.
- Preserve LaTeX syntax and Mermaid fences; avoid transformations that may break MathJax or Mermaid rendering.

### Comments and Invariants

- Use JSDoc-style file headers for substantial config, utility, or algorithm modules.
- For math-heavy or simulation-heavy code, document:
  - preconditions,
  - state invariants,
  - update rules,
  - complexity where relevant.
- Comments should justify non-obvious correctness or performance choices, not restate simple code.

## 4. Engineering Constraints

**Target environment**: static site deployed to a low-resource VPS/GitHub Pages style environment. Keep build output and client-side runtime cost under control.

1. **Dependency discipline**
   - Prefer standard library, existing utilities, or lightweight local code.
   - Do not add heavy dependencies for problems already solved by VitePress, Vue, existing helpers, or small deterministic code.
   - If a dependency is added, justify its runtime/build impact.

2. **Lazy loading and bundle size**
   - Heavy game/simulation components must be registered through `createGameComponent` in `docs/.vitepress/theme/index.mts`.
   - Keep non-critical visual effects, games, and Three.js-heavy code out of the initial path where possible.
   - Watch for Vite chunk warnings; the current config raises the warning limit, but this is not a license to grow bundles casually.

3. **File size discipline**
   - **Soft rule**: prefer naturally modular files. Split code when a module mixes unrelated concerns, hides key invariants, or becomes hard to review.
   - **Hard limit**: keep implementation files under **400 lines**. If a file exceeds this, refactor/split it unless there is a clear, documented reason to keep it together.
   - Long Markdown essays, generated artifacts, lockfiles, and data-like content are exempt from the implementation-file limit.

4. **Performance-sensitive code**
   - For games, simulations, graph algorithms, and numerical logic, prefer predictable memory layout, low allocation pressure, and clear update loops.
   - Use `requestAnimationFrame` responsibly and cancel it on component unmount.
   - Keep `localStorage`, browser-only APIs, canvas access, and DOM access behind client-side lifecycle guards.

## 5. Feature-Specific Guidance

### VitePress Configuration

- Before adding global behavior, inspect `docs/.vitepress/config.mts`, `configs/`, and existing plugins.
- Keep `config.mts` as an integration point. Move reusable logic into `configs/`, `plugins/`, `rss/`, or `utils/`.
- Changes to search indexing must preserve:
  - `search: false` exclusion,
  - content module allowlist behavior,
  - mixed Chinese/English tokenization,
  - code-block exclusion from local search rendering.

### Sidebar, News, and RSS

- Sidebar behavior is generated from content modules. Prefer updating the module registry instead of hardcoding scattered sidebar entries.
- News has dedicated sidebar/index helpers; use existing `news-*` utilities before introducing new traversal logic.
- RSS generation is build-time and dev-server aware. Keep feed code deterministic and avoid network access in build hooks.

### Games and Simulations

- New games should have a Markdown entry under `docs/games/` and a Vue component under `docs/.vitepress/theme/components/games/`.
- Register new heavy components lazily in `theme/index.mts`.
- For larger games, separate:
  - pure core rules/state transitions,
  - rendering,
  - UI components,
  - persistence/runtime glue.
- For `math-lab`, preserve mathematical correctness over visual cleverness. State the model, boundary conditions, randomization, and conservation/update invariants where applicable.

## 6. Workflow

1. **Read first**
   - For config/theme changes, inspect `config.mts`, `theme/index.mts`, and the relevant `configs/`, `plugins/`, `utils/`, or `rss/` module.
   - For game changes, inspect the existing game component and any nearby split-out core modules.

2. **Plan before broad changes**
   - If the change affects navigation, search, RSS, or global theme behavior, identify the affected build-time and runtime paths before editing.
   - If an existing design is clearly weaker than a simple alternative, explain the tradeoff before replacing it.

3. **Implement narrowly**
   - Match existing architecture.
   - Avoid unrelated formatting churn.
   - Do not modify generated/build artifacts unless the task explicitly requires it.

4. **Verify**
   - Run `npm run build` for config, RSS, search, theme, Vue component, or TypeScript changes.
   - Use `npm run dev` or `npm run preview` when visual layout, interaction, routing, or browser-only behavior matters.
