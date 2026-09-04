# Product Evolution v0.8 Parallel Architecture

Status: frozen-baseline architecture contract once `V08_PARALLEL_BASE_SHA` is certified.

## Goal

Reduce merge conflict for Explorer Core without broad refactoring or changing scientific/canonical authority. The shipped artifact remains one offline HTML file. The v0.8 composed build uses the existing Rendering Production canonical loader, then composes product-owned HTML/CSS/JS development sources into that artifact.

## Frozen shared surfaces

The following are shared compatibility surfaces and are integration-owner-only during parallel lane work unless a lane handoff explicitly proves an unavoidable interface change:

- `src/bootstrap/ofu-template.html`
- `src/bootstrap/product-shell.js`
- `src/bootstrap/ofu-inspector.js`
- `tools/product-template-compose.mjs`
- `tools/build-ofu-rendering-v08.mjs`
- `.github/workflows/rendering-production.yml`
- canonical P1-P6 sources and persistence/replay contracts

`product-shell.js` remains the v0.7 workspace/synchronization compatibility adapter. Parallel lanes extend around it rather than editing it independently.

## Lane ownership

### A — Explore & Navigation

Principal files:

- `src/bootstrap/product/workspace-nav.html`
- `src/bootstrap/product/explore-panel.html`
- `src/bootstrap/product/explore-navigation.js`

May consume the public compatibility state exposed by `OFU.productUI`, `OFU.inspectorTest.state`, and `globalThis.__OFU_PLANET_PREVIEW__`. Must not become scientific authority.

### B — Rendering & Camera

Principal files:

- `src/bootstrap/product/viewport.html`
- `src/bootstrap/planet-preview.js`
- `src/rendering/planet-core.js`
- `src/rendering/planet-webgl2.js`

Owns presentation renderer, camera/LOD, renderer primitives and viewport-specific presentation behavior. P5/P6 remain canonical scientific authorities. Rendering remains `PRESENTATION_ONLY`; `physicalTerrainElevationClaim=false` remains invariant.

### C — Inspector Productization

Principal files:

- `src/bootstrap/product/inspect-panel.html`
- `src/bootstrap/product/inspector-product.js`

Consumes canonical inspector state; does not change canonical resolution, P3 identity, P4 replay, P5 Environment, or P6 semantics. Raw/advanced material may be progressively disclosed but not falsified.

### D — Mobile & Interaction

Principal files:

- `src/bootstrap/product/mobile.css`
- `src/bootstrap/product/mobile-interaction.js`

Owns mobile-first composition overrides and touch/interaction behavior. May call renderer/navigation public seams, but must not modify canonical data or scientific state.

### E — Lab / Technical Separation

Principal files:

- `src/bootstrap/product/lab-panel.html`
- `src/bootstrap/product/lab-technical.js`

Owns advanced/raw/debug/provenance presentation and Lab-specific interaction. P4 archive validation and deterministic replay authority remain in existing canonical/inspector services.

## Shared APIs and dependencies

### Stable read interfaces

- `OFU.productUI.state`: current workspace and presentation synchronization state.
- `OFU.productUI.workspace(name, options)`: workspace switch compatibility API.
- `OFU.productUI.announce(message)`: accessible live-region compatibility API.
- `OFU.productUI.sync()`: presentation synchronization request.
- `OFU.inspectorTest.state.current`: currently resolved canonical entity for compatibility with v0.7.
- `globalThis.__OFU_PLANET_PREVIEW__`: current presentation state; lanes may read it. Mutation is restricted to documented renderer methods such as `navigateToRadii` and `retarget`.

### Dependency direction

`canonical P1-P6 / persistence` -> `inspector + rendering adapters` -> `shared product compatibility adapter` -> `lane-owned presentation/interaction sources` -> `single-file composition`.

No dependency is permitted in the reverse direction from product UI/camera/browser state into canonical facts.

### Cross-lane rules

- A may request target/navigation actions through renderer public methods; it does not edit B principal files.
- B publishes presentation state and navigation primitives; it does not edit A/C/D/E principal files.
- C reads canonical/renderer state and publishes human-readable presentation only.
- D may attach input handlers to stable DOM/data attributes and call A/B public APIs; it must not implement independent canonical target resolution.
- E consumes existing technical/canonical diagnostics; it does not duplicate or replace canonical archive/replay validation.
- Changes to frozen shared surfaces are integration-owner decisions and must be reconciled centrally.

## Build composition

`tools/build-ofu-rendering-v08.mjs` executes the certified legacy rendering builder, then:

1. replaces the v0.7 navigation/viewport/workspace markup with lane-owned fragments;
2. injects the mobile CSS extension point into the existing inline stylesheet;
3. injects lane-owned extension scripts as inline scripts;
4. recomputes artifact bytes/SHA-256;
5. records SHA-256 and byte counts for every lane-owned composed source in `rendering-build-manifest.json`.

The artifact remains strict single-file, direct-file, offline, and network-independent.

## Parallel branch policy

All lanes branch from exact `V08_PARALLEL_BASE_SHA`, never from moving `main`:

- `feature/v08-explore-navigation`
- `feature/v08-rendering-camera`
- `feature/v08-inspector-product`
- `feature/v08-mobile-interaction`
- `feature/v08-lab-technical`

No lane writes `main` or `integration/product-evolution-v0.8`, merges another lane, publishes a release, or changes scientific authority.
