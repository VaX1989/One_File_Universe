# V1X-01 Camera / Scale / Reference Frames — Integration Notes

## Scope and authority

This lane is additive and owns presentation/derived camera behavior only. It does not mutate canonical scientific model state, P4 history, selection, the frozen Wave-IV input router, central registries, renderers, bootstrap/composer files, or other lane modules.

The single mutable spatial-distance quantity inside the V1X-01 camera authority is `logDistanceM`, defined as logarithmic presentation clearance from the current reference surface. `distanceM`, `distanceRadii`, semantic band and focus distance are derived views. This avoids a second independently mutable distance variable while preserving Wave-IV center-radius compatibility through the adapter.

Reference-frame transforms are hierarchical and computed through a common ancestor. The implementation never requires one giant absolute coordinate. A bounded return stack preserves the exact pre-handoff floating pose when a frame transition is immediately reversed without intervening spatial mutation; flattened 64-bit matrices are only required to remain finite and are not falsely claimed to preserve microscopic residue after an arbitrary macro flattening.

## Frozen contract compatibility

- Scale: `ofu-wave-iv-scale-runtime-3`
- Input intent: `ofu-wave-iv-input-intent-3`
- Selection: `ofu-wave-iv-selection-1`
- PX cross-scale remains external/read-only; no scientific refinement is promoted here.
- Absolute semantic-distance jumps require explicit `fastTravel=true`; ordinary wheel/pinch/keyboard operations traverse adjacent semantic boundaries and expose reference-frame handoffs.
- The adapter may adopt a legacy Wave-IV snapshot before authoritative camera commands. After authoritative camera movement begins, a conflicting legacy distance cannot silently overwrite the camera state.

## Consumers

### V1X-03 — Macrocosm 3D Rendering
Consume the camera snapshot and frame-relative matrices. Do not introduce a macro camera-distance state. Treat `distanceM`/`distanceRadii` as derived values and preserve `selectionToken` when rendering regime handoffs.

### V1X-04 — Stellar / System 3D Rendering
Provide a system/stellar frame identifier via the integration-owned frame resolver and consume the pose rebased into that frame. Do not flatten microscopic/local positions into a permanent galactic coordinate.

### V1X-05 — Planet / Orbit / Approach Continuity
Use the Wave-IV adapter for the existing orbit/approach radii contract. The adapter reproduces the frozen wheel/pinch/keyboard multiplicative radii semantics while storing only the authoritative clearance log.

### V1X-06 — Surface / Local / Human Rendering
Map global/regional/local/human bands to surface/local floating frames. Surface altitude remains renderer-specific presentation output; it must not become a competing semantic-distance authority.

### V1X-09 — Micro / Material / Molecular / Atomic Experience
Create descendant micro frames with bounded `metersPerUnit` and local origins. The camera can travel below the Wave-IV `human` band while retaining the last governed Wave-IV semantic band and setting `belowWaveIVHuman=true`; V1X-09 must define any successor micro-scale regime contract rather than silently extending the frozen Wave-IV ladder.

### V1X-10 — UX / Direct Manipulation / Mobile / Accessibility
Route wheel/pinch/keyboard accessibility intent through one V1X-01 semantic-distance operation. Buttons may invoke explicit fast travel but must mark that operation explicitly; ordinary direct manipulation must remain continuous and monotonic.

## Integration-owner action required

The central Wave-IV scale runtime and input router are frozen inputs for this lane. Therefore V1X-01 does not replace their globals or monkey-patch captured references. The convergence owner must choose the integration-owned composition seam that instantiates this authority, adopts the legacy snapshot once, then routes scale/camera intent through the V1X-01 adapter. Until that composition is performed, this branch is `IMPLEMENTED_UNCERTIFIED`, not founder-visible product closure.

## Fidelity and limitations

All camera/reference-frame outputs are `PRESENTATION_ONLY`. The static test hierarchy and 6,371,000 m fixture radius are deterministic presentation fixtures, not canonical claims about a selected world. Executed trace outputs are `MEASURED_RUNTIME_EVIDENCE` only for the tested software state. No physical Android/iOS device evidence exists. No founder acceptance is implied.
