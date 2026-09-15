# Game Lab: independent vertical slices

Each game owns its logic, optional Rust core and WASM ABI, renderer, input adapter,
UI, configuration, algorithms, assets, tests, and documentation. A game must never
import another game's implementation internals or make another game depend on it.

Organize by game/domain (for example qin-polar-run/rust, render, input), not by
language across games. Do not create a shared game engine, renderer, input,
collision or WASM layer; a cross-game Rust workspace; rust/shared-utils; or a
generic DevelataGame trait without an explicit future user request. Tiny local
clamp/lerp/RNG helpers are preferable to incorrect cross-game abstractions.

Allowed shared infrastructure: Vue, VitePress, Vite, installed npm dependencies
(including Three.js), deployment, existing lazy component registration, and
GameHub catalog metadata. GameHub knows titles, descriptions, icons, tags and
routes only; never simulation, collision, renderer, scores, ABI or WASM startup.

Preserve legacy games and historical shared controls unless directly in scope.
These isolation rules govern new games and substantial future rewrites; they
are not permission to refactor existing games. Follow root AGENTS.md, including
the 400-line implementation-file limit and build/browser verification.
