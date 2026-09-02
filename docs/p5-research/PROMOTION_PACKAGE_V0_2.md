# P5 Research Promotion Package v0.2

**Status:** `P5 RESEARCH — PROMOTION ARCHITECTURE READY`  
**Canonical status:** NOT PROMOTED. Do not merge this research branch directly into `main` as canonical P5 semantics.

## Live upstream basis

Research was rebaselined against integration `main` at `7bfb738483e0975c2c72e60a64f6ee8f000dbb01`, P3 prototype `768ceb2a9bcfb91f9e1d4d5965f8cdfa8c2b0e6a`, P4 candidate `4a855bf77a2e453f6c0c95f8de9abfbb1354eae0`, and stable snapshot `ofu-p3-p5-planetary-input-snapshot-v0`.

P5 consumes rather than rerolls P3 planet/system/star identity, system/host facts, orbit, insolation, baseline mass, coarse bulk prior and solid budget. P5 owns detailed physical realization: composition, physical radius where supported, interior, atmosphere/hydrosphere, climate and terrain.

Current persistent planetary state is defined conceptually as:

```text
P3 procedural/reference baseline
+ P4 canonical history
+ versioned P5 planetary transition semantics
= current persistent planet
```

P5 has no private clock, event ordering, replay log, checkpoint or lineage authority.

## Promotion architecture implemented

- `research/p5/p3-snapshot-adapter.mjs`: snapshot v0 adapter that preserves upstream `BigInt`/32-byte identity facts and creates a separate safe `Number` research view.
- `research/p5/numeric-promotion.mjs`: integer/fixed-point candidate path for rocky radius, gravity, density and pressure.
- `research/p5/advanced-model.mjs`: causal planet research pipeline with separate rocky, water-rich/sub-Neptune, ice-giant and gas-giant families.
- `research/p5/climate-tier2.mjs`: latitude/season Tier-2 EBM-style research field; derived/non-persistent.
- `research/p5/terrain-topology.mjs`: random-access cube-sphere topology with global primitive-integer vertex identity and exact inherited-vertex projection.
- `research/p5/p4-transition-draft.mjs`: transition semantics descriptor only; P4 remains temporal authority.
- `tests/p5-research/promotion-prep-tests.mjs`: executable adapter/numeric/causal/climate/terrain property suite.

## Deterministic numeric strategy

Persistent candidate representations are integer-valued: composition ppm, radius metres, density kg/m3, gravity micro-m/s2, volatile/atmospheric inventory fractions and pressure Pa. Native floating-point climate, escape-history, volatile-rich/giant radius and geodynamic research outputs are not promoted merely because Node repeats them.

The current rocky candidate treats the Zeng/PREM exponent `1/3.7` as exact rational `10/37` and evaluates it with BigInt fixed-point plus an integer 37th root inside the declared `1–8 M_Earth`, CMF `0–0.4` domain. Outside-domain calls fail to a research-only path rather than silently becoming persistent facts.

## Terrain topology

Surface patch key:

```text
{ face: PX|NX|PY|NY|PZ|NZ, level, x, y }
```

Every patch-grid vertex is mapped to an integer cube-surface vector and reduced by `gcd(|x|,|y|,|z|)`. That primitive triple is the global vertex identity. Adjacent patches, cube-face edges/corners and parent/child inherited vertices therefore share one identity independent of generation order.

`REFINE` returns four deterministic children. `PROJECT` recovers every inherited parent vertex from the child union by global vertex key. `RECONCILE` verifies exact inherited heights, cube-face continuity, bounded materialization and finite-sample ocean calibration. No global heightmap is stored.

## Scientific model disposition

Strong promotion candidates: causal dependency graph; P3 adapter boundary; bounded rocky radius numeric path; integer composition/inventory representation; multiple escape diagnostics rather than one retention truth; explicit unsupported high-pressure-water states; Tiered climate architecture; uncertain geodynamic regimes; cube-sphere topology; compact P6 environmental projection.

Still research/calibration: volatile partitioning; water-rich/high-pressure EOS reduction; giant radius/evolution; XUV history and efficiency; greenhouse/Tier-2 transport coefficients; geodynamic/rheology calibration; physical plate/crater/erosion fields layered on the topology.

## P6 environment draft

`environmentalContractV02()` exposes planet identity, P3 baseline insolation, seasonal temperature envelope, surface/column pressure semantics, retention/XUV diagnostics, water regime, geological activity proxy, ocean/relief and radiation forcing. It implements no life and does not transfer P5 internal model authority to P6.

## Future controlled promotion sequence

1. Bind to stable P3 schema v1 facts.
2. Replace research fixture derivation with P2 addressed derivation domains.
3. Promote only models with explicit validity domains and deterministic persistent numerics.
4. Bind evolving P5 fields to P4 transition/reducer semantics without duplicating P4 history authority.
5. Freeze P5 conformance vectors including P3 preservation, causal metamorphism and terrain `REFINE/PROJECT/RECONCILE`.
6. Execute cross-runtime and working-set evidence on a separate integration candidate.
