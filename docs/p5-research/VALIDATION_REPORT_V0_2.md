# P5 Promotion-Preparation Validation v0.2

**Status:** research evidence, not certification.

## Upstream/authority properties

- P3 snapshot v0 adapter accepts P3-style 32-byte entity IDs and `BigInt` canonical integers.
- P3-owned baseline values are preserved unchanged; the research `Number` view is separate and range-checked.
- P5 consumes P3 baseline insolation/mass/prior rather than rerolling them.
- P5 transition draft declares P4 as canonical clock/order/replay/checkpoint authority and contains no private clock/history.

## Rocky deterministic numeric candidate

The first 0.5-M_Earth static table experiment was rejected after ~0.403% maximum interpolation error. A denser table reached ~0.122%, but publishing the table also highlighted needless static-byte cost.

The retained candidate exploits the exact rational form of the published exponent: `1/3.7 = 10/37`. It evaluates the mass term as BigInt fixed point and an integer 37th root. A local sweep across the declared `1–8 M_Earth`, CMF `0–0.4` research domain measured maximum relative difference from the native analytical expression of approximately `9.81e-7`.

A 1-M_Earth, CMF~0.33 probe remains approximately:

- radius: `6,375,460 m`;
- gravity: `9.806567 m/s^2`;
- density: `5,502 kg/m3`;
- pressure for an 850-ppb atmospheric-mass probe: `97,462 Pa`.

These are regression/model checks, not an Earth-reproduction claim.

## Causal/metamorphic evidence

The advanced local suite executed controlled pairs for irradiation, volatile inventory, internal heat, gravity/escape, obliquity and rotation. All directional invariants passed in the recorded run. Examples include higher irradiation -> higher equilibrium temperature and energy-limited escape, higher volatile budget -> non-decreasing pressure, and higher internal heat forcing -> higher heat/activity proxies.

Tier-2 climate regression values for one controlled Earth-like forcing included high-latitude seasonal amplitude increasing from ~19.27 K at 5-degree obliquity to ~116.46 K at 60 degrees. The slow-rotation research transport proxy reduced the annual equator-pole gradient in the same controlled experiment. These are architecture regression values, not forecasts.

## Terrain topology evidence

The full local terrain stress run audited cube-face boundaries at levels 0–5:

- unshared boundary vertices: `0` at every level;
- height contradictions: `0` at every level;
- shared cube-corner identities: `8` at every level.

Additional executed cases:

- adjacent-patch seams: `443`, all exact;
- parent/child REFINE->PROJECT cases: `234`, all exact;
- direct random-access repeats: `256`, all exact;
- inherited parent projection maximum delta: `0 m`;
- patch materialization: `25` vertices;
- global heightmap: not materialized.

The bounded planet-level ocean calibration uses 1,538 unique coarse topology vertices and retains only the scalar sea level/error metadata.

## Population stress evidence

Before the final BigInt rocky optimization, 20,000 broad synthetic planets produced:

- invalid states: `0`;
- P3 prior contradictions: `0`;
- non-finite outputs: `0`;
- negative pressures: `0`;
- atmospheric inventory violations: `0`.

Class counts were ROCKY `11,080`, WATER_RICH `2,201`, SUB_NEPTUNE `2,337`, ICE_GIANT `2,404`, GAS_GIANT `1,978`. Only `5,400` samples fell inside the bounded rocky promotion domain; unsupported objects were explicitly routed to research/out-of-domain model families rather than forced through the rocky model.

This population validates architecture and bounds only. It is deliberately not an observational occurrence-rate calibration.

## Performance interpretation

The pre-final numeric candidate generated 20,000 reduced-grid advanced planets in ~565 ms and 10,000 topology patches in ~786 ms in one local Node run. Those numbers are development observations only. The final BigInt 37th-root rocky path trades CPU for smaller static byte cost and stronger numeric portability; it requires a fresh browser/runtime performance campaign before promotion.

## Remaining blockers are model/calibration or integration evidence

- water-rich/high-pressure EOS reduction;
- ice/gas-giant physical radius/evolution family selection;
- volatile partition calibration and pressure-tail control;
- XUV history/efficiency calibration;
- greenhouse and Tier-2 heat-transport calibration;
- geodynamic/rheology calibration;
- physical plates/craters/erosion fields over the now-defined terrain topology;
- P2 addressed-derivation binding, stable P3 schema v1, P4 reducer integration and cross-runtime conformance.
