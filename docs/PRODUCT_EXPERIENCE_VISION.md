# Product Experience Vision

**Status:** active v1.0 acceptance target, ratified 2026-09-05. Current release implementations are evidence, not permanent UI contracts. The [implementation contract](governance/V1_IMPLEMENTATION_CONTRACT.md) requires shipping macro, world, life, civilization and bounded microscopic journeys rather than accumulating stand-alone prototypes.

## 1. Experience thesis

One File Universe should feel like **entering a universe**, not operating a scientific control panel.

The long-range hierarchy is:

**UNIVERSE FIRST → CONTEXT SECOND → TECHNICAL EVIDENCE THIRD**

The viewport, world and direct spatial choices are the primary interface. Scientific honesty is never hidden, but raw protocol detail is progressively disclosed rather than forced into the first experience.

## 2. The three conceptual workspaces

### Explore

Explore is viewport-dominant and spatial. Core verbs are:

`look → point → select → zoom → travel → approach → land → move → observe → interact → return`

The player should increasingly choose destinations by interacting with what is visible. Direct object picking, tap selection, drag/orbit, wheel zoom, pinch zoom, continuous scale travel, spatial surface target selection, local movement and reverse traversal are primary. Lists, named anchors and stage buttons remain useful for accessibility, orientation, search, fast travel and debugging.

A fixed flow such as `menu → scale → target → Approach → Surface` is a temporary product mechanism, not the final exploration contract.

### Inspect

Inspect answers human questions before protocol questions:

- What is this?
- What is known canonically?
- What is derived?
- What is uncertain, unknown or unsupported?
- Which scientific model/fidelity applies?
- How does it compare with nearby or related objects?
- What changed through history or player intervention?

Inspect should usually be a contextual drawer, sheet, overlay or side surface that preserves visual orientation to the universe.

### Lab

Lab exposes technical truth for experts:

- canonical address and Entity Identity;
- semantic manifests and digests;
- evidence/fidelity classifications;
- canonical versus derived/presentation records;
- P4 events, replay, checkpoints, archives and lineage;
- raw records and provenance;
- renderer/resource/performance diagnostics;
- conformance and certification evidence.

A normal player must be able to love OFU without seeing a SHA-256. An expert must be able to drill down to byte-level evidence.

## 3. Universal exploration freedom

`UNIVERSAL_EXPLORATION_FREEDOM` means the player can, within supported domains, address/query/discover arbitrary eligible entities and supported spatial locations instead of being limited by hard-coded showcase targets.

The product should preserve:

- stable selection/entity continuity while moving through scales;
- a reversible travel path;
- ability to revisit prior locations;
- explicit unsupported boundaries;
- discoverability of nearby valid targets without enumerating the theoretical universe;
- search/fast-travel as optional navigation aids rather than the only mechanism.

## 4. Cross-scale experience continuity

The player should not see:

`planet → loading/scene switch → unrelated local noise`.

The experience should communicate a constrained refinement of the same place. Camera transitions, visual blending and temporary presentation approximations are allowed, but identity and authoritative facts remain stable. When scientific continuity is not yet implemented, the UI must say so rather than imply a physical connection that does not exist.

Transitions should preserve at least:

- selected canonical entity;
- semantic scale/regime;
- spatial intent/reference frame where supported;
- history/time context;
- authority/fidelity state;
- reversible return target.

## 5. Product-completeness model

A user-visible capability is not product-complete merely because semantic tests pass. Its promotion/readiness review should assess:

| Dimension | Gate question |
|---|---|
| Scientific / model authority | Are claims supported, versioned and correctly labeled? |
| Systemic depth | Does the feature have meaningful causal consequences rather than decorative randomness? |
| Player freedom | Can the user choose meaningful supported targets/actions rather than follow one canned path? |
| Cross-scale continuity | Does refinement preserve the same world and declared constraints? |
| Graphical quality | Is the primary visual result coherent, legible and free of material visual defects? |
| UX quality | Can a non-expert understand and operate the journey without engineering knowledge? |
| Performance | Does it stay within documented CPU/GPU/memory/startup budgets? |
| Portability | Does Strict remain usable and Enhanced degrade transparently? |
| Determinism | Do canonical results remain independent of frame rate, GPU and scheduling? |
| Persistence | Do governed changes survive replay/export/import where applicable? |
| Accessibility | Are equivalent keyboard/non-drag/semantic paths and motion/target-size requirements handled? |
| Certification | Do exact-head, device/runtime and adversarial gates support public claims? |

Any material failure can block a product-complete claim. A beautiful feature with invented science fails. A deep simulation that cannot be meaningfully explored fails. A semantically correct but visibly broken main journey fails.

## 6. Scientific communication

Every visible fact should resolve to one of the authority states used by the relevant contract, with human-readable mappings such as:

- **Established/known** — canonical or governed evidence exists;
- **Derived** — computed from authoritative inputs under a declared model;
- **Hypothetical / research** — not canonical world fact;
- **Unknown** — model requires a value that is not established;
- **Unsupported** — current model family does not cover the requested case;
- **Presentation only** — visual aid with no scientific authority.

Unknown is not absent. Unsupported is not dead. A stylized terrain signal is not topography. Effective radiative temperature is not surface climate. A research biology fixture is not life on a canonical planet.

## 7. Direct manipulation and input ownership

Mouse, touch, pen and keyboard should map to the same semantic intent layer rather than independent modules mutating camera/scale state.

Target long-range input intents include:

- focus/select;
- orbit/look;
- continuous zoom/scale travel;
- translate/local move;
- spatial target pick;
- reverse/return;
- inspect/context request;
- interact/canonical action request.

Input handling must distinguish tap from drag, preserve document/page gestures where appropriate, and expose equivalent non-drag controls for functions that otherwise rely on dragging.

## 8. Mobile

Mobile is a first-class experience, not a shrunk desktop panel layout.

Requirements include:

- safe-area aware viewport and controls;
- touch ownership and pointer cancellation;
- pinch zoom and drag/orbit without page traps;
- contextual bottom sheets rather than permanent panel competition;
- readable scale/location/selection context;
- unobscured targets and minimum accessible target sizes;
- adaptive graphics quality and dynamic resolution where needed;
- no change to canonical truth based on hardware tier.

## 9. Accessibility

The 3D viewport must not be the only semantic representation of the universe.

Future journeys should include:

- keyboard-operable selection/travel alternatives;
- single-pointer alternatives when a drag is not essential;
- screen-reader accessible current selection, scale, scientific status and action affordances;
- visible focus;
- reduced-motion behavior for nonessential transitions;
- non-color-only status communication;
- sufficiently large/isolated targets;
- clear live-region announcements only for meaningful state changes;
- discoverable recovery from unsupported targets or failed actions.

Accessibility evidence should distinguish automated checks from physical assistive-technology/device verification.

## 10. Graphics and product meaning

Graphical fidelity is not cosmetic debt deferred until the end. It is part of whether the user can perceive scale, material class, atmosphere, terrain and causal differences. However, the renderer may only label visual features scientifically when upstream authority supports them.

The target is maximum honest visual quality under bounded budgets: astronomical depth, differentiated stars/worlds, physically inspired materials, atmosphere/cloud/water/ice where supported, terrain/geological structure, ecology, organisms, settlements and lighting where authorized, adaptive LOD, temporal/other antialiasing, dynamic resolution and optional WebGPU acceleration.

## 11. Current-product relationship

The existing Explore / Inspect / Lab work, v0.8 founder visual closure and Wave IV selection/scale/provider experiments are valuable product evidence. They do not freeze the final UI hierarchy, stage vocabulary or target set. In particular, Wave IV's release-specific scene bands and local presentation terrain cannot be promoted into a permanent universal navigation or physical-geography contract merely because they work as a vertical slice.
