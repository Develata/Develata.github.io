# Brain Training architecture contract

## Public routes

- `/games/brain-training/` is the catalog and evidence boundary.
- Each distinct cognitive paradigm owns an independent page and async Vue chunk.
- Variants of the same paradigm stay inside that paradigm's page; they are configuration, not separate products.

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
