# PX executable extension foundation

This implementation preserves the post-#49 canonical kernels and the Wave IV
product. It is an implementation foundation, not a claim that the v1 product is
finished. Main remains protected; promotion still requires exact-head evidence.

## Runtime ownership

`src/extensions/contracts.js` defines bounded immutable data contracts. Authority
is one of CANONICAL_PROVEN, DERIVED, MODEL_DERIVED_SIMULATION, PRESENTATION_ONLY,
or MEASURED_RUNTIME_EVIDENCE. A provider result must retain its registered exact
version, authority, provenance, selection, parent context and P4 time/history.
Presentation, derived readers and measured telemetry cannot request TRANSITION.
Scientific changes must use separately admitted P4 events, not renderer methods.

`registry.js` admits descriptors against explicit owner policy, rejects duplicate
identity and capability claims, verifies exact dependency versions and authority,
and seals a deterministic topological order. Scientific descriptors cannot depend
on presentation or runtime measurements. Canonical admission is explicit in the
library's trusted policy; **shipping additive catalogs cannot grant themselves
canonical admission**. The existing canonical kernels remain governed separately.

Metadata is sealed before use. Packaged implementations bind each declared owner,
ID and version once; the product seals these bindings after all mandatory modules
initialize. Scene resolution uses sealed capability claims, not script insertion
order. Scene/scale additions do not require editing a central registration list.

This is a packaged-code authority boundary, not a JavaScript security sandbox.
An intentionally malicious same-realm script could access globals. Shipping code
is reviewed and tested; untrusted save/query data is copied, bounded, checked and
frozen before execution. No renderer receives a scientific mutation capability.
Cooperative operation counters bound declared provider work; they do not pretend
to preempt an uncooperative synchronous JavaScript function.

## Additive source composition

`config/components/*.json` contributes code, styles, GLSL/WGSL, workers, HTML,
scientific tables, data, compressed resources, images and audio. Each descriptor
records ID, semantic version, owner, authority, dependencies, provenance, source
hash and emitted hash/length. Text sources use an explicit LF normalization;
binary sources are byte-exact. Paths are confined to owned repository roots.

Composition rejects missing dependencies, cycles, duplicate IDs/capabilities,
fragment collisions, invalid authority, unsafe paths and re-embedding a frozen
baseline module. The registry manifests and their hashes are independently
reconstructed at build time. Inert resources are placed in the HTML head before
any consumer executes, including resources supplied by later build stages.
`resources.js` validates bounded embedded resource bytes before returning them.

The legacy canonical composer remains the source of the frozen baseline. The
foundation and full-product artifacts remain separate scopes at one exact source;
the full product, not the foundation, is the release-candidate artifact.

## Domain-owned extension path

Add an owned component manifest and a provider catalog resource whose ID starts
with `px.providers.`. Catalog dependencies are automatically ordered before the
registry bootstrap. Provider catalogs contain owner policies, descriptors and an
empty canonical-admission list. New science uses MODEL_DERIVED_SIMULATION rather
than relabeling research as canonical. Source roots for a new owner are scoped to
`src/domains/<owner>/`, `src/providers/<owner>/`, `src/<owner>/`,
`assets/<owner>/`, `data/<owner>/`, or its own extension configuration.

A scene declares exactly one `scene-id.<public-id>` and its `scene.<band>` claims.
A regime resource with ID `px.regimes.*` provides the explicit ordered parent
chain, decreasing navigation anchors and SPATIAL_PRESENTATION or REGIME_CHANGE.
These anchors express travel intent, not a physical equivalence between regimes.
Packaged modules bind their implementation before startup finalization.

## Rendering

`render-backend.js` routes actual globe and local-surface frames through a sealed
presentation backend host. WebGL2 Strict is the certification baseline. Optional
WebGPU descriptors cannot replace a missing portable baseline or modify identity,
canonical/model state, history or saves. API exposure alone is not an implemented
WebGPU backend and is reported separately.

The existing private-VAO WebGL passes retain allocation/deletion/context-generation
ownership. The host adds pre-render bounds and post-render tracked-allocation
checks. Its reusable allocation owner performs batch preflight, partial-failure
rollback, loss invalidation and generation-aware restoration. A failed deletion
retains the tracked handle and budget pressure until retry or context loss; it is
never counted as successful cleanup. Tracked bytes are
not physical driver VRAM. Surface terrain budgets reserve bounded instance-buffer
space rather than silently exceeding the advertised combined ceiling.

## Cross-scale reconciliation

`cross-scale.js` exposes REFINE, PROJECT and RECONCILE. The caller obtains the
parent commitment from the authoritative source, not from the refining child.
An independent projector verifies deterministic child identity, parent context,
selection, P4 time/history, provenance, spatial containment, inherited observables
and exact integer material/unit sums. Provider-supplied consistency booleans have
no role. Verification fails before a scale transaction is committed.

The current Wave IV integration independently captures real P3 identity/facts and
P4 T0 witnesses. It routes descent as REFINE and ascent as PROJECT and retains a
bounded ring of independent reconciliation witnesses. Its spatial commitment is a
selected-world presentation context, not canonical surface geodesy. Its empty
material ledger makes **no** physical matter claim. Existing terrain continuity
and independent mesh/ray/framebuffer oracles remain required separately. New
physical or microscopic models must supply actual supported spatial/material
commitments and their domain-specific scientific oracles.

## Persistence and evidence

The new context codec preserves the canonical semantic manifest and P4 contract;
its compatibility hash deliberately excludes renderer/scene registry state.
It supplements, not replaces, authoritative P1/P4 portable saves. Context data
cannot assert a new canonical world or overwrite committed history.

`config/conformance/*.json` contributes owner-qualified oracles to FAST_LOCAL,
LANE_TARGETED, INTEGRATION, CUMULATIVE and RELEASE. Commands use bounded direct
process invocation, not a shell. Mandatory providers require actual declared
FAST_LOCAL, INTEGRATION and RELEASE coverage. Missing, colliding, misowned or
failed evidence is rejected. Dirty-source local records are explicitly not exact
promotion evidence.

Rendering Production retains every historical gate and adds PX integration and
five-platform product journeys. The final production seal binds the provider
manifest, complete component composition, artifact bytes, browser evidence,
canonical/P4 witnesses and both directions of scale travel to one exact source.
Physical Android/iOS remain NOT_VERIFIED unless separate real-device evidence is
obtained. Managed local DOM diagnostics are not direct-file or GPU certification.
