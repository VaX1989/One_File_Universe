# V1X-01 Lane Evidence

## Production delta

V1X-01 adds a bounded hierarchical reference-frame graph, one camera pose/intention authority, one mutable logarithmic presentation-clearance distance (`logDistanceM`), explicit adjacent semantic-boundary traversal, explicit fast-travel semantics, a frozen-contract Wave-IV compatibility adapter, and deterministic trace replay.

`distanceM`, `distanceRadii`, semantic scale and focus distance are derived from `logDistanceM`; they are not independently mutable authorities. Selection is observed through a token and is never written by the camera authority.

## Targeted execution evidence

The following commands were executed locally against the lane source before handoff, using Node.js v22.16.0:

- `node tests/v1x-01-camera-scale-frames/reference-frames.mjs` — PASS, oracle `v1x01-reference-frames-oracle-1`.
- `node tests/v1x-01-camera-scale-frames/semantic-travel.mjs` — PASS, oracle `v1x01-semantic-travel-oracle-1`.
- `node tests/v1x-01-camera-scale-frames/adapter-trace.mjs` — PASS, oracle `v1x01-adapter-trace-oracle-1`, deterministic trace digest `750e10d3`.

The repository declares Node.js 24.20.x. Therefore these executions are useful lane evidence but are not reported as canonical-runtime or CI certification. A later attempt to clone the exact remote lane HEAD into a fresh verification directory was blocked by container DNS resolution to github.com; the repository connection remained available for live branch/tree verification. That infrastructure failure is not classified as a product/test failure.

## Semantic/journey witness

The semantic-travel test exercises monotonic wheel, pinch and keyboard movement, travels inward across governed bands into the below-Wave-IV-human presentation region, then reverses the same travel and restores the coherent starting semantic context and exact floating-frame pose when there has been no spatial mutation. The trace fixture explicitly visits a micro presentation frame and reverses to the human frame while preserving selection.

## Transform witness

Representative galaxy/system/planet/surface/human/micro transforms remain finite. The implementation explicitly does not claim that an arbitrary flattened IEEE-754 galaxy matrix can retain all microscopic residue. Reversible no-mutation handoffs use the bounded floating-frame return stack instead of fabricating numerical precision.

## Authority and fidelity

Camera, scale mapping, reference frames, adapters and test fixtures are `PRESENTATION_ONLY`. Executed deterministic trace results are `MEASURED_RUNTIME_EVIDENCE` about software execution only. No new `CANONICAL_PROVEN`, `DERIVED` scientific, or `MODEL_DERIVED_SIMULATION` fact is asserted. The fixture radius/frame hierarchy is test data, not a canonical astronomical claim.

## Remaining gate

The frozen central input/scale runtime was not edited. Integration-owner composition must instantiate V1X-01, adopt Wave-IV state once, and route the authoritative camera/scale intent through the adapter. Browser journey evidence, Node 24.20.x exact-head execution, physical-device evidence and founder acceptance remain outstanding.
