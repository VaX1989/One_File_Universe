# PROD-W1-ATLAS-CORE — Personal Atlas / Explorer Memory

The Atlas core stores durable **semantic references**, not world copies.

## Stored authority

Every Atlas entry is exactly the frozen W1 `SavedObservation` contract:
- `PLACE` — canonical subject plus optional presentation-only return hint;
- `OBSERVATION` — canonical subject plus optional Scientific Fingerprint reference;
- `SNAPSHOT` — requires an exact P4 state reference.

The core never serializes renderer, scene-provider, mesh, DOM, camera-object or host runtime identity. A return reference stays `PRESENTATION_ONLY`; it is a hint for a later product adapter, not camera/world truth.

## Routes

Routes are ordered references to existing Atlas entry IDs. They do not copy mutable world state. Removing an entry used by a route fails closed until the route is removed.

## Persistence boundary

`exportBundle()` is a bounded, deterministic **internal product-state** serialization. It is not a public storage/provider ABI and does not freeze a filesystem, IndexedDB, localStorage, cloud or P4 archive backend.

Import is exact-version, exact-contract and canonical-byte only. Entry IDs are product-local deterministic content keys; any collision or ID/content mismatch fails closed. They are not scientific, canonical-entity or cryptographic authority.

## Revisit boundary

`revisitPlan(id)` returns references only. It never mutates selection, camera, P4 history or world state. A product adapter may later consume the plan under the existing selection/P4/scale authorities.
