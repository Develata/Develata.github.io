# Phase 2 implementation contract

Baseline: 5de4117. Scope is the existing independent Northern Run module.

- [x] Pure Rust progressive speed, conservative predicted arrival speed, variable meaningful hazard gaps, high-speed tests.
- [x] Rust 10-coin boost, 3.5s at 1.45x, smash/magnet, 1.0s exit grace, no healing/refill during boost.
- [x] ABI v2: existing 144 floats; header 13/14/15 = charge/boost seconds/biome. Events add boost/smash/biome. Slot padding exposes smashed lane masks.
- [x] Three bounded prebuilt environments, fixed Rust biome sequence each 40s, fog veil transition and bounded speed/smash FX.
- [x] Semantic boost input (Shift/E, double tap), thin meter, lazy HTMLAudio lifecycle and mute.
- [x] Verified CC0 source, one locally processed committed audio asset and provenance.
- [x] Rust/Node/build/browser/long-run QA, final requirement check and receipts.

## Boundaries and failure behavior

Rust remains the sole authority for speed, hazards, collision, boost, score and biome.
TS projects the same frame; no gameplay rule moves into rendering. The generator
keeps eight 48m chunks, and counts real distance between nonempty hazard rows.
Predicted normal arrival speed uses the shared pure speed function and a conservative
arrival horizon derived from the lowest possible movement speed. Recovery rows never
reset this hazard distance. Ordinary gaps do not use the boost multiplier.

Boost grants collision immunity and a one-second exit grace; it never resets hits.
Resolved boosted hazards receive per-row lane masks, so destroyed meshes stay gone.
Audio failures are nonfatal; no audio request or element before a Start gesture.
Pause/hidden/blur stop music and simulation; unmount releases all owned resources.

The ABI is versioned and assets requested with the ABI version to avoid silently
using old cached bindings. Existing loader retry/module reuse is preserved.
The source-hash WASM cache architecture is unchanged; audio never enters its key
and FFmpeg never runs in CI. Rolling back the feature commit restores v1 gameplay.

## Acceptance evidence

Pure tests cover curve continuity/guard, actual high-speed gaps and collisions,
boost activation/refill/smash/exit, and biome boundaries. Browser checks cover
real keyboard/touch input, audio lifecycle/failure, unrelated-route network laziness,
all biomes and repeated cycles, counts, high-speed view and safe-area layout.
Test-only synthetic frames stay in QA tooling, never normal UI or shipped cheats.
