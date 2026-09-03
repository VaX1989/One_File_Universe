# Advanced P5 Environment v2 — Canonical Closure Evidence

## Final promoted authority

- Environment contract: `ofu-p5-p6-environment-v2`
- schema: `2`
- model: `p5-environment-2`
- atmosphere-state contract: `ofu-p5-atmosphere-state-v2`
- authority: `P5_CANONICAL`
- volatile genesis: `NO_CANONICAL_GENESIS`
- atmosphere storage: absolute Tg / `u64 BigInt` / `ABSOLUTE_MASS_NO_DENOMINATOR`
- pressure semantic: `GLOBAL_SURFACE_COLUMN_PRESSURE`
- radiative law profile: `p5-radiative-equilibrium-s1361-sigma-codata2022-v1`
- P4 time authority preserved; private P5 clock: `false`

## Frozen lineage and Golden evidence

- Environment Semantic Manifest hash: `f35801f9cc4f2d44633a39013e135553f10c29cd62308d34b4da31c59a473d3f`
- Golden corpus: `golden-p5-environment-v2-corpus-v1`
- Golden corpus digest: `ac33ba776976d1381a841426fb7e0fbb0276877e98565261bfdec2bca598d7a4`
- shipped cross-runtime Environment digest: `f6ecaea013a78f5f7a16acf2a0f2fa33f7f7ec816474df33be9f8b0fa41de0a2`
- preserved P5 v1 Golden physical digest: `402267561fb311c16f68380afdf066df883eba62b8053d6470401d2eebd86d52`
- preserved shipped P5 v1 physical digest: `7532cf9a6d2258031bc3f29f76c8614ea75973367fbe3aaae7a7652755169bc7`

## Promotion pins

- pre-promotion canonical main: `89e32fd90fc4b56594e78cf3648a0708ff2cfe79`
- certified promotion candidate: `7688e9ca8719e1b7f42dcc15d7962f08a76e3e55`
- candidate tree: `838fc20d0028e77e33f8d54ac5c495e6422a5950`
- promotion PR: `#32`
- merge SHA: `ace38aac27b9098a9c01b390eeaa82933077f4be`
- merge tree: `838fc20d0028e77e33f8d54ac5c495e6422a5950`

The merge tree is byte-identical to the certified candidate tree.

## Certification runs

### Exact candidate

Actions run `33736791875` — SUCCESS:

- Foundation + P1 + P2 — PASS
- P3 — PASS
- P4 — PASS
- frozen P5 v1 — PASS
- Environment v2 conformance + Golden corpus + Worker scheduling invariance — PASS
- independent Python oracle — PASS
- sparse working-set benchmark — PASS
- evidence isolation — PASS
- reproducible Environment v2 single-file build — PASS
- Linux Chromium — PASS
- Linux Firefox — PASS
- Linux Playwright WebKit — PASS
- Windows Chromium — PASS
- macOS ARM64 Playwright WebKit — PASS
- aggregate cross-runtime seal — PASS

PR-specific Environment v2 run `33737182149` repeated the same Environment v2 exact-head and five-runtime seal successfully before merge. Frozen P5 v1 controlled-promotion run `33737181893` also passed on the promotion head.

### First exact main after promotion

Actions run `33737515944` on exact main `ace38aac27b9098a9c01b390eeaa82933077f4be` — SUCCESS:

- Foundation + P1 + P2 — PASS
- P3 — PASS
- P4 — PASS
- frozen P5 v1 — PASS
- Environment v2 conformance + Golden corpus + Worker scheduling invariance — PASS
- independent Python oracle — PASS
- sparse working-set benchmark — PASS
- evidence isolation — PASS
- reproducible Environment v2 single-file build — PASS
- Linux Chromium — PASS
- Linux Firefox — PASS
- Linux Playwright WebKit — PASS
- Windows Chromium — PASS
- macOS ARM64 Playwright WebKit — PASS
- aggregate cross-runtime canonical agreement — PASS

Playwright WebKit is not real Safari/iOS certification. Real Safari/iOS remains `NOT_VERIFIED`.

## Scientific adjudication

### Corrected Tier-0

P3 `baselineInsolationPpm` is Earth-normalized stellar flux. Environment v2 uses:

`T_eff = [S(1-A)/(4 sigma)]^(1/4)`

with IAU nominal solar irradiance `1361 W m^-2` and the frozen displayed NIST/CODATA Stefan-Boltzmann value. Earth-normalized forcing with Bond albedo `0.3` yields canonical `254.578 K`.

`T_eff` is effective radiative temperature, not mean surface temperature. Actual Bond albedo remains `UNKNOWN`; `surfaceTemperature` and greenhouse remain `UNSUPPORTED`.

### Volatile genesis

The research volatile prior is not promoted. Environment v2 uses `NO_CANONICAL_GENESIS`, because a universal generated atmospheric inventory for arbitrary 1–8 Mearth terrestrial worlds is not sufficiently constrained by the reviewed formation/degassing/escape literature.

### Pressure

Global surface column pressure is derived causally from retained atmospheric mass plus frozen P5 v1 surface gravity and mean radius. It is not a random draw or a local weather-pressure claim.

## Adversarial closure

Material blockers found before promotion: 4.

1. Incorrect Earth radiative normalization — FIXED.
2. Scientifically unjustified volatile genesis prior — FIXED BY SCOPE REDUCTION.
3. Reuse of the P5 v1 semantic manifest for Environment v2 — FIXED with dedicated manifest lineage.
4. Golden digest initially did not cover the frozen cross-runtime output vector — FIXED with CBV-defined corpus digest and executable verification.

Open material blockers at promotion: **0**.

## Explicit unsupported domains

- mean surface temperature
- greenhouse response / climate
- regional atmospheric transport / weather
- water phase / high-pressure EOS
- actual ocean area fraction
- physical terrain elevation
- canonical XUV evolution
- endogenous atmospheric escape history
- plate tectonics / geology
- geochemical energy / nutrient indices
- gas-giant environment semantics

Future research is routed independently in issues #29, #30 and #31.

## Closure statement

P5 v1 physical/terrain remains frozen and unchanged in meaning. Environment v2 is an additive canonical successor authority. Its contract, Semantic Manifest, numeric laws, Golden corpus and explicit unsupported states are frozen. Any incompatible future scientific or generator change requires a new versioned authority and fresh certification.
