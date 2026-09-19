# Brain Training architecture contract

## Public routes

- `/games/brain-training/` is the catalog and evidence boundary.
- Each distinct cognitive paradigm owns an independent page and async Vue chunk.
- Variants of the same paradigm stay inside that paradigm's page; they are configuration, not separate products.

## Phase-two task contracts

| ID | Route | Task model | Reported metrics | Accessibility boundary |
| --- | --- | --- | --- | --- |
| BT-05 | `/multiple-object-tracking` | Identical targets are cued, move under a deterministic bounded simulation, then are selected from the full set. | target-selection accuracy, hits, false selections | Motion is the construct itself. The arena uses DOM controls and live phase status, but no false nonvisual equivalent is claimed. |
| BT-06 | `/mental-rotation` | Procedural chiral polyomino pairs are either rotation-equivalent or reflected; same/mirror trials are balanced. | accuracy, same/mirror accuracy, optional visual-mode overall and same-shape angle-bin median RT | Untimed screen-reader mode serializes both coordinate sets; its summaries omit RT. |
| BT-07 | `/change-localization` | A color-and-shape array is encoded, briefly retained, then exactly one location changes both cues. | localization accuracy, errors, optional visual-mode median RT | Untimed screen-reader mode announces sample/probe item descriptions and uses explicit progression; its summaries omit RT. |

All three use seeded pure cores. BT-05 advances a fixed-size typed-array state in-place; BT-06 and BT-07 generate bounded arrays in linear time. None reports attention capacity, spatial IQ, visual-memory capacity, brain age, or far-transfer claims.

## Scientific claims

These exercises report task performance only. They do not diagnose a condition or estimate IQ, brain age, prefrontal function, or real-world attention. Repeated practice can improve the trained task; broad transfer is not promised.

## Module boundaries

- `core.ts` modules are deterministic and do not import Vue, DOM, storage, or timers.
- UI modules own focus, keyboard/pointer input, `performance.now()` timing, visibility invalidation, and lifecycle cleanup.
- `shared/presentation.ts` starts stimulus timing at the first frame after Vue flush and makes pending frame work cancellable.
- `persistence.ts` stores bounded, versioned summaries only. Raw trial streams do not enter storage.
- Every generated round records its seed and parameters so a result remains interpretable.
- Reaction-time comparisons are personal and meaningful only under comparable task, browser, device, and input conditions.
- Dynamic tasks expose a stable live status. Timed tasks also offer an untimed screen-reader mode whose summaries omit reaction-time effects.

## Performance invariants

- Sequence generation is linear in trial/cell count.
- Fisher–Yates performs unbiased in-place shuffling without rejection loops.
- Typed arrays carry compact trial data where useful.
- Only animation-driven paradigms may own a frame loop; every timer and frame request must be cancelled on restart, hidden-tab abort, and unmount.
- A page mounts one exercise only. No global keyboard listener is used.

## Verification

`npm run brain-training:test` runs dependency-free deterministic invariant probes. Interaction changes additionally require the VitePress build plus real-browser keyboard, responsive, dark-mode, and axe checks.
