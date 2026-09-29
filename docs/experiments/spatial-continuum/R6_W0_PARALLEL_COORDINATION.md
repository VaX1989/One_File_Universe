# R6/W0 Parallel Coordination — Continuous Reality Closure

Status: **ACTIVE CONTROL PLANE / PLANNING + INTEGRATION METADATA ONLY**  
Freeze ID: `OFU-R6-W0-2026-09-15-27657AB9`  
Repository: `VaX1989/One_File_Universe`  
Mission date: `2026-09-15`

## 1. Authority and immutable parent

This wave remains **R6/W0 / M0 Continuous Reality Closure**. It does not create R7, promote canonical science, merge to `main`, tag, or release.

- Active R6 PR: `#274`
- Roadmap / DAG PR: `#275`
- Parallel base branch: `experiment/spatial-continuum-r6-causal-universe-2026-09-14`
- Exact parent R6 SHA: `27657ab9e8215b2c5fc34e4a6aec8ad947f1cf3a`
- Exact parent R6 tree: `97c83b4341f23113267910f80952979280106f71`
- Control branch: `integration/spatial-continuum-r6-w0-continuous-reality-2026-09-15`
- Product behavior remains rooted in the certified R6 lineage; this record is coordination metadata only.

The final control `SHA` and `tree` are bound externally by the Draft control PR and the activation block emitted after this coordination commit. They cannot be embedded as literals in the same immutable commit without changing that commit/tree and invalidating the self-reference.

## 2. Authority layers that must remain distinct

Every lane and audit must preserve these non-interchangeable layers:

1. **Certified history** — previously certified repository truth; planning does not rewrite it.
2. **Canonical science** — authoritative scientific state and provenance; no lane may silently promote model/presentation output into it.
3. **Model-derived simulation** — deterministic generated/modelled state with explicit provenance and bounded authority.
4. **Presentation** — renderer/UX/audio/visual consequences; presentation never becomes scientific authority merely by being visible.
5. **Planning metadata** — roadmap, DAG, this coordination record and ownership record; planning authorizes work topology, not scientific truth or release.

## 3. Live shared-surface map at the accepted R6 head

| Surface | Current owning path(s) | Wave treatment |
|---|---|---|
| Macro discovery/materialization/rebuild | `src/experiments/spatial-continuum/open-universe.js` | R6-A writer; renderer hook remains convergence-owned |
| Planetary representation handoff/blending | `src/experiments/spatial-continuum/renderer.js`, `src/experiments/spatial-continuum/terrain-field.js`, `src/experiments/spatial-continuum/planetary-topology.js` | R6-B additive provider; shared integration edits requested, not written directly |
| Terrain patch planning/LOD/stitching/culling | `src/experiments/spatial-continuum/planetary-topology.js`, `src/experiments/spatial-continuum/renderer.js`, `src/experiments/spatial-continuum/terrain-field.js` | R6-D owns topology after R6-B; central transition hooks convergence-owned |
| HUMAN local environment/composition | `src/experiments/spatial-continuum/local-environment.js`, `src/experiments/spatial-continuum/renderer.js` | R6-C writer for local grammar; renderer integration requested |
| Causal visual consequence mapping | `src/experiments/spatial-continuum/causal-regimes.js`, `src/experiments/spatial-continuum/renderer.js` | R6-E writer for mapping; rendering hook convergence-owned |
| Material/micro/molecular/atomic presentation | `src/experiments/spatial-continuum/micro-grammar.js`, `src/experiments/spatial-continuum/renderer.js` | R6-F writer for epistemic grammar; renderer integration requested |
| Product shell/orientation/scale UI | `src/experiments/spatial-continuum/experience.js`, `src/experiments/spatial-continuum/camera.js`, `src/experiments/spatial-continuum/renderer.js` | R6-I additive-only; shell/camera/renderer stay convergence-owned |
| Bootstrap/provider registries | `src/experiments/spatial-continuum/kernel.js`, `src/experiments/spatial-continuum/world-adapter.js`, `src/experiments/spatial-continuum/generative-contract.js` | convergence-owned shared integration surface |
| Scientific authority boundary | `src/experiments/spatial-continuum/scientific-state.js` | read-only for production lanes unless separately adjudicated |
| Tests/workflows/build | `tests/spatial-continuum/run.mjs`, `.github/workflows/spatial-continuum-experiment.yml`, `package.json` | central runner/workflow/build convergence-owned; lane-specific tests may be additive |
| Audio | no dedicated R6 audio extension point identified in the inspected R6 source/tree | R6-J research-only; isolated prototype only, no activation hook |

`src/experiments/spatial-continuum/renderer.js` is the dominant shared implementation collision: macro rendering, terrain handoff/fade, HUMAN composition and micro/molecular/atomic presentation converge there. It is therefore owned by `CONTROL_CONVERGENCE` for this wave.

## 4. Lane topology

Immediate parallel writer count: **7** (`A`, `B`, `C`, `E`, `F`, `G`, `I`), within the roadmap limit of eight. `D` is stacked after `B`; `J` is research-only.

| Lane | Status | Primary owned paths | Shared read-only / integration-request surfaces | Dependency |
|---|---|---|---|---|
| R6-A Progressive macro materialization | `ACTIVE` | `src/experiments/spatial-continuum/open-universe.js`; new `macro-materialization.js`; lane test | `renderer.js`, `kernel.js`, central runner/workflow/build | exact CONTROL_SHA |
| R6-B Globe → regional → local representation handoff | `ACTIVE` | new `representation-handoff.js`; lane test | `renderer.js`, `planetary-topology.js`, `terrain-field.js`, `camera.js` | exact CONTROL_SHA |
| R6-C HUMAN sense of place | `ACTIVE` | `local-environment.js`; new `human-place-grammar.js`; lane test | `renderer.js`, `experience.js`, `camera.js` | exact CONTROL_SHA |
| R6-D Planetary LOD stitching/morphing/culling | `STACK_AFTER_R6_B` | `planetary-topology.js`; new `planetary-lod-transition.js`; lane test | `renderer.js`, `terrain-field.js`, `camera.js` | evidence-approved R6-B head |
| R6-E Causal planet visual consequences | `ACTIVE` | `causal-regimes.js`; new `visual-consequences.js`; lane test | `renderer.js`, `scientific-state.js` | exact CONTROL_SHA |
| R6-F Molecular/atomic epistemic presentation | `ACTIVE` | `micro-grammar.js`; new `epistemic-scale-presentation.js`; lane test | `renderer.js`, `scientific-state.js` | exact CONTROL_SHA |
| R6-G Quality Observatory / diversity / falsification | `ACTIVE` | additive `tools/spatial-continuum/quality-observatory/**`; lane test; lane evidence namespace | all production source read-only; central workflow/runner read-only | exact CONTROL_SHA |
| R6-I Orientation / scale-awareness UX | `ACTIVE` (restricted) | new `orientation-scale-ux.js`; lane test | `experience.js`, `camera.js`, `renderer.js` | exact CONTROL_SHA; shell hooks by patch request only |
| R6-J Systemic audio | `RESEARCH_ONLY` | evidence namespace; optionally isolated `systemic-audio.js` + direct lane test | `kernel.js`, `experience.js`, `renderer.js` and all activation registries | no product activation in W0 |

The machine-readable record is authoritative for exact path arrays and policy flags.

## 5. Collision adjudication

### R6-B / R6-D

`R6_D=STACK_AFTER_R6_B`. Both closures materially depend on the same terrain transition/handoff semantics and the same current implementation corridor (`renderer.js` + `planetary-topology.js` + `terrain-field.js`). Running them as independent peers would create semantic and integration races even if additive modules were used.

R6-D therefore branches from the evidence-approved R6-B head (or an explicitly frozen superseding B head), not from the original control SHA.

### R6-I / shell navigation

R6-I is active only as an additive lane. It may not edit `experience.js`, `camera.js`, or `renderer.js`. Any shell/navigation hook is an `INTEGRATION_PATCH_REQUEST` for the convergence owner. This preserves one camera/focus/selection authority and renderer-owned picking.

### Central integration surfaces

No specialist lane edits `renderer.js`, `kernel.js`, `experience.js`, `camera.js`, `terrain-field.js`, `scientific-state.js`, `generative-contract.js`, `world-adapter.js`, `tests/spatial-continuum/run.mjs`, `.github/workflows/spatial-continuum-experiment.yml`, or `package.json` unless a later control-plane amendment explicitly grants that path. Unavoidable changes are described as `INTEGRATION_PATCH_REQUESTS`; they are applied only by the convergence owner after evidence review.

## 6. Branching, PR and merge rules

For every writer lane:

- branch from the exact final `CONTROL_SHA`, except R6-D which stacks after the frozen/evidence-approved R6-B head;
- open a **Draft PR** against the control branch;
- do **not** merge the PR;
- do not force-push or rebase after evidence is published unless the packet is explicitly superseded and the new head is re-bound;
- do not edit another lane's owned paths;
- do not edit central registry/build/workflow/shared integration paths unless explicitly granted;
- prefer additive provider/module/test files;
- submit unavoidable shared edits as `INTEGRATION_PATCH_REQUESTS` with exact target path, intended insertion/replacement and rationale;
- preserve one selection/focus/camera authority and renderer-owned picking;
- preserve offline/direct-file behavior, deterministic/order-independent semantics, explicit scientific authority, bounded working sets, stale-work cancellation and reversible handoffs.

This control PR itself targets active R6 and remains Draft. It is a convergence surface, not a release path.

## 7. Evidence contract

Every writer lane publishes an evidence packet containing at minimum:

- lane ID and freeze ID;
- exact base branch/SHA/tree and head branch/SHA/tree;
- changed-path inventory checked against ownership;
- direct test commands and outcomes;
- deterministic rerun evidence for stateful/generative changes;
- offline/direct-file evidence when affected;
- visual evidence for visible behavior changes;
- resource/performance observations where the lane can alter boundedness, queueing, LOD or materialization;
- explicit classification of canonical science vs model-derived simulation vs presentation;
- provenance and fail-closed behavior where scientific/model state is involved;
- known limitations and falsification attempts;
- `INTEGRATION_PATCH_REQUESTS`, if any, as exact path-level patches/instructions rather than opportunistic shared writes.

R6-D additionally demonstrates old-coverage retention during handoff, stitch/morph/cull continuity, stale transition cancellation and no camera-dependent semantic identity. R6-G additionally reports perceptual-diversity and falsification measurements rather than aggregate pass/fail alone.

## 8. Read-only audit lanes

Auditors never become competing product writers. They inspect lane heads/PRs and file findings only.

- **AUDIT-SCIENCE** — scientific/epistemic honesty, provenance, authority promotion, fail-closed unsupported science.
- **AUDIT-VISUAL** — product/visual quality, continuity, legibility, perceptual repetition, scale coherence.
- **AUDIT-ARCH** — performance, bounded resources, determinism/order-independence, stale work, architecture and integration ownership.
- **AUDIT-DEVICE** — device/accessibility/direct-file behavior, interaction robustness and long-soak stability.

## 9. No-merge / no-release policy

This freeze authorizes parallel experimentation and convergence preparation only.

- **DO NOT merge `main`.**
- **DO NOT merge PR #274.**
- **DO NOT merge this control PR or specialist PRs.**
- **DO NOT tag or release.**
- **DO NOT use roadmap/planning metadata as scientific promotion authority.**
- **DO NOT create R7 from this wave.**

No product source, test runner, workflow, package/build file or release metadata is changed by this control-base commit.
