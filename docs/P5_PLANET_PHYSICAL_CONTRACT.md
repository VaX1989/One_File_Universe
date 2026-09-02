# P5 Planet Physical Contract v1 Candidate

**Candidate contract:** `ofu-p5-planet-physical-v1`  
**Model:** `p5-planet-physical-1`  
**Schema:** `1`  
**Upstream P3 input:** `ofu-p3-p5-planetary-input-v1` / P3 schema `1` / `P4_T0`  
**Temporal authority:** `ofu-p4-temporal-v1`  
**Promotion state:** CANDIDATE ONLY until exact-head review and merge.

## 1. Authority boundary

P5 consumes the real `p3Astronomy.planetaryInputSnapshot()` producer. The adapter requires the v1 contract ID, `p3SchemaVersion === 1n` and `baselineEpoch === 'P4_T0'`. P3-owned byte identities and baseline integer facts are retained as byte arrays / `BigInt`; no persistent `Number` view exists.

P3 remains authoritative for planet/system/star identity and relations, orbit, astronomical insolation, committed baseline mass, coarse `bulkPriorClass`, and the protoplanetary solid-budget prior. P5 never rerolls those values.

`nonCanonicalNumberView()` exists only for presentation/research convenience and labels its output `NON_CANONICAL_PRESENTATION_ONLY`. Its output is not part of the physical contract or digest.

## 2. Promoted model scope

The v1 candidate intentionally supports only P3 `TERRESTRIAL` planets whose baseline mass is within **1000–8000 milli-Earth masses** (1–8 Mearth).

Other priors (`VOLATILE_RICH`, `ICE_GIANT`, `GAS_GIANT`) and terrestrial planets outside this mass range return explicit `UNSUPPORTED` results. There is no fallback to a weaker physical family.

For supported planets the persistent P5 facts are:

- a P2-addressed deterministic terrestrial composition refinement (`coreMassFractionPermille`, 200–400; remainder mantle);
- composition-aware mean radius in integer metres;
- surface gravity in integer micro-m/s^2;
- mean density in integer kg/m^3;
- exact upstream P3 baseline retention and provenance;
- static P4 temporal binding declaration.

### Evidence disposition

| Model | Evidence Class | Model Fidelity | Canonical interpretation |
| --- | --- | --- | --- |
| P3 v1 boundary preservation | ESTABLISHED | FORMAL | Exact contract/byte/value preservation. |
| Terrestrial composition refinement | HYPOTHETICAL | STYLIZED | Deterministic diversity compatible with the coarse terrestrial prior; not inferred mineralogy. |
| Rocky mass-radius relation | EMPIRICALLY_CONSTRAINED | APPROXIMATE | Bounded `R/Re = (1.07 - 0.21*CMF) * (M/Me)^(1/3.7)` realization evaluated with fixed integer semantics. |
| Spherical gravity/density | ESTABLISHED | APPROXIMATE | Established relationships evaluated from quantized mass/radius and frozen rational constants. |
| Cube-sphere topology | ESTABLISHED | FORMAL | Exact integer topological identity/seam/refinement semantics. |
| Terrain elevation code | FICTIONAL | STYLIZED | Dimensionless procedural signal only; not metres or geomorphological truth. |

## 3. Deterministic numeric contract

Persistent promoted fields are integers/bytes accepted by `OFU-CBV-1`.

### Rocky radius

- input mass: `BigInt` milli-Earth masses;
- input CMF: `BigInt` permille;
- domain: mass 1000–8000, CMF 0–400;
- exponent `1/3.7` is represented exactly as rational `10/37`;
- the mass power is evaluated as a deterministic integer 37th root at Q=1,000,000 fixed-point;
- final division uses round-to-nearest, ties-to-even;
- out-of-domain values return `OUT_OF_DOMAIN`, never extrapolation.

Conformance compares the integer realization against the reference floating expression over bounded vectors. Floating arithmetic in that test is an oracle/measurement, not persistent authority.

### Gravity and density

Frozen constants used by v1:

- Earth mass: `5972200000000000000000000 kg`;
- G: `667430 / 10000000000000000`;
- pi approximation: `355 / 113`.

All divisions use ties-to-even. Results are canonical integers.

## 4. P2 derivation binding

Every promoted procedural draw uses `P2.derive()` with:

- the canonical 32-byte master seed;
- the P5 Semantic Generator Manifest hash;
- domain `ofu.p5.planetology.v1`;
- a P2 Canonical Address containing the P3 planet Entity ID;
- explicit subsystem/property labels and counter.

P5 creates no alternate seed tree and no string-only canonical pseudo-address.

## 5. Terrain topology v1

`p5-cube-sphere-topology-1` uses six cube faces and 4x4 cells per patch (25 vertices). A vertex is represented by a reduced primitive integer cube vector and a P2 Canonical Address subordinate to the canonical planet ID.

Properties required by conformance:

- exact same-face seams;
- exact cross-face seams and eight cube corners;
- direct random-access repeatability;
- parent-to-child refinement stability;
- child generation order independence;
- `PROJECT(REFINE(parent))` exact parent recovery;
- deterministic `RECONCILE`;
- no global heightmap materialization;
- renderer/GPU independence.

The current elevation field is a signed 16-bit **dimensionless stylized code** derived at vertex addresses. Physical elevation scaling, oceans, erosion, plates and cratering remain research.

## 6. P4 binding

This candidate promotes **static P5 genesis facts only**. It therefore does not invent a P5 mutable transition merely to satisfy phase completeness.

- canonical time owner: P4;
- event identity/order owner: P4;
- replay/checkpoint/compaction/lineage/archive owner: P4;
- promoted P5 mutable state: none;
- P5 transition contract: deferred until a defensible time-evolving physical variable is promoted.

Future mutable P5 semantics must be a versioned reducer contract consumed by P4 and must pass replay/checkpoint/repeated-compaction equivalence before promotion.

## 7. Deferred research

The following remain non-canonical:

- water-rich/high-pressure EOS;
- sub-Neptune, ice-giant and gas-giant radius/evolution families;
- volatile partition calibration;
- XUV efficiency/history calibration and atmospheric escape evolution;
- greenhouse coefficients and climate transport calibration;
- detailed geodynamic/rheology models;
- physical terrain scaling, oceans, plates, craters and erosion.

`UNSUPPORTED` is the required behavior where a deferred family would otherwise be needed.

## 8. P5 -> P6 boundary

Candidate contract `ofu-p5-p6-environment-v1` exposes only promoted constraints: planet identity, mean radius, gravity, density and terrain topology version. Pressure, temperature envelope, water/volatile regime, radiation/escape diagnostics, ocean constraints and geological activity are explicitly `UNSUPPORTED` until their P5 models are promoted.

This boundary is environmental only. It implements no life or P6 semantics.

## 9. Promotion evidence

The candidate is not canonical merely because this document exists. Promotion requires exact-head P5 conformance, real P3 v1 integration, all frozen upstream regressions, reproducible P1–P5 single-file build, evidence isolation, and one identical P5 physical/terrain digest across the declared executed browser/platform matrix. Real Safari/iOS must not be claimed from Playwright WebKit evidence.
