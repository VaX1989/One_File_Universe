# V1X-04 Stellar/System 3D Rendering Evidence

## Scope and ownership
This lane implements an additive stellar-system renderer/provider without modifying the central renderer, input, camera, scale, selection, persistence, P3 astronomy, or resource authorities. The frozen Prompt-0 ownership validator denies `src/rendering/v1/**` before lane allows, so the implementation uses the Prompt-0 SHIPPING owner namespace `src/v1x-04-stellar-system-rendering/**` and matching top-level component/conformance descriptors. Central scene binding remains a convergence-owner dependency.

## Before / after founder-visible delta
Before this lane, the exact frozen base had no V1X-04-owned true-3D stellar-system provider or same-system multi-perspective evidence. After this lane, one canonical system fixture is represented first in xyz scene coordinates, with xyz orbit polylines projected only through an external camera at render time. Direct picking returns canonical entity identity as an upstream selection intent. Region/neighborhood -> system -> planet -> system -> region/neighborhood witnesses preserve identity.

The committed `evidence/multi-perspective.svg` is deterministic presentation evidence generated from the production provider for the same system under three external cameras. It is not scientific imagery or canonical astronomy evidence.

## Authority and fidelity
Provider authority is `PRESENTATION_ONLY`. Canonical P3 inputs are stellar component count, barycentric scale, stellar masses, planet semi-major axis, eccentricity, inclination, and `orbitCenter`. Logarithmic display radius, multi-star layout, longitude of ascending node, argument of periapsis and display anchor anomaly are presentation-only transformations. Current orbital phase is `UNKNOWN_NOT_CANONICAL`; no ephemeris or present-day orbital-position claim is made. Camera/reference-frame, semantic scale, selection mutation and resource admission remain external governed authorities.

## Oracles
- `node reports/v1x/v1x-04-stellar-system-rendering/tests/system-rendering-oracle.mjs`
- `node reports/v1x/v1x-04-stellar-system-rendering/tests/static-system-3d-oracle.mjs`
- `node reports/v1x/v1x-04-stellar-system-rendering/generate-evidence.mjs`

The dynamic oracle covers multi-star hierarchy, true xyz orbit geometry, three perspective cameras, stable direct picks, byte/hex identity normalization, reversible handoff identity, continuous approach presentation transform, explicit phase limitation and hard resource caps. The static oracle rejects a primary normalized x/y ellipse-plus-depth representation.

## Resource measurement
`evidence/journey-resource-witness.json` is `MEASURED_RUNTIME_EVIDENCE` from Node v22.16.0 on Linux x64 for the evidence fixture. At 48 samples/orbit it records 7 scene nodes, 196 orbit vertices, 11 draw packets per perspective and 21,580 estimated scene bytes. The targeted full-oracle run at the default 96 samples/orbit records 388 orbit vertices and approximately 70.6-70.8 KiB encoded provider output. These are fixture/runtime measurements, not physical-device or GPU certification.

## Known limitations / integration dependencies
1. V1X-01 must supply the governed camera/reference-frame state.
2. V1X-02/shared cross-scale runtime must supply parent-space anchors and semantic transition state.
3. The top-level additive component descriptor is discoverable by the frozen build mechanism, but the convergence owner must bind this renderer into the central scene/composition path; this lane does not edit central composition.
4. Planet approach/surface rendering is outside V1X-04; system->planet is a handoff witness only.
5. Multi-star layout is presentation-only, not a canonical stellar orbital solution.
6. Canonical current orbital phase is unavailable and remains explicitly unknown.
7. Physical Android/iOS evidence is `NOT_VERIFIED`.
8. Founder acceptance is not claimed.
