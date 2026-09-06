# V1X-02 Consumer Contract for V1X-03 / V1X-04

Contract ID: `ofu-v1x-02-spatial-consumer-1`
Provider: `OFU.v1x02SpatialUniverse`
Coordinate space: `V1X02_PRESENTATION_3D`
Generated-position authority: `PRESENTATION_ONLY`

## Inputs

Consumers supply a macro context (`UNIVERSE`, `GALAXY`, `REGION`, `NEIGHBORHOOD`), stable scope identity, upstream entities carrying `canonicalId`, `entityId`, `id`, or `canonicalKey`, and optional presentation seed/morphology/density hints. View projection consumes an externally owned camera frame with origin/position, right/up/forward axes, and optional focal length/near plane.

## Outputs

- `projectEntities(...)`: deterministic bounded XYZ presentation objects.
- `sampleNeighborhood(...)`: bounded non-canonical sparse presentation probes.
- `representation(...)`: spatial objects plus optional projection through the external camera frame.
- `projectPoint(...)`: perspective projection through the external frame.
- `parallaxWitness(...)`: depth-dependent presentation witness from two external frames.

## Invariants

1. Upstream identity is preserved; presentation coordinates do not replace canonical facts.
2. `(presentationSeed, context, scopeId, stableIdentity)` determines generated XYZ independent of input query order, cache residency, and revisit.
3. Generated coordinates remain `PRESENTATION_ONLY` and never claim physical coordinates.
4. Source-backed positions are carried separately and retain their declared upstream authority without promoting generated positions.
5. Projection materializes at most 64 entities per request; neighborhood scaffolding materializes at most 96 probes and never enumerates a canonical population.
6. Presentation probes are not canonical, selectable, navigable, or scientific evidence.
7. V1X-03/V1X-04 must obtain camera frames from the governed camera owner rather than creating a second camera authority.
8. This provider does not mutate selection, input, camera, temporal, persistence, or canonical entity state.

Intended use: V1X-03 may consume this seam for macrocosm galaxy/region/neighborhood representation; V1X-04 may consume it for stellar-system-context placement around governed upstream identities. Central registry/bootstrap/scene composition remains convergence-owner work.
