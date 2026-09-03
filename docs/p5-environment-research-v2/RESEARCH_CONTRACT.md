# Advanced P5 Environment Research v2

Status: **RESEARCH / NON-CANONICAL**

Contract: `ofu-p5-p6-environment-research-v2` / version `2` / authority `P5_RESEARCH_DRAFT`.

Canonical base: exact `main` `89e32fd90fc4b56594e78cf3648a0708ff2cfe79`; frozen P5 v1 remains `p5-planet-physical-1`, `ofu-p5-planet-physical-v1`, `p5-cube-sphere-topology-1`, and `ofu-p5-p6-environment-v1`.

## Scope decision

This wave deliberately promotes no new canonical semantics. It narrows research to three useful output families:

1. causal volatile bookkeeping -> atmospheric retained mass -> hydrostatic global column pressure;
2. canonical-insolation-driven radiative-equilibrium temperature envelope with explicit albedo uncertainty and no surface-temperature claim;
3. water surface phase capability with explicit supercritical/high-pressure handling.

XUV escape, geology, geochemical energy and ocean area fraction remain unsupported for promotion.

## Scientific basis and governance

### Volatile inventory

The bookkeeping identity itself is formal, but the generated volatile inventory and atmosphere partition are **HYPOTHETICAL / STYLIZED**. They are deliberately broad research priors, not calibrated planetary formation predictions. Conservation is executable: atmosphere + condensed surface + subsurface/interior + lost = total volatile inventory.

Promotion blocker: replace the broad generated prior with an empirically/physically constrained formation/outgassing/retention model or make volatile inventory an explicit upstream/mutable state established by a promoted transition process.

### Pressure

For a thin atmosphere over a spherical planet, global column pressure is computed causally from atmospheric mass, canonical surface gravity and canonical radius. Evidence class: **ESTABLISHED**; fidelity: **APPROXIMATE** because the output is a global column pressure, not local meteorological pressure.

Persistent numeric candidate: integer Pa (`BigInt`) with rational half-even rounding. Zero atmospheric mass must yield exactly zero pressure. Pressure is not independently randomized.

### Thermal state

Tier 0 uses canonical P3 insolation. Bond albedo is not canonically known, so research v2 exposes a bracket (default 0.10–0.60) and returns a radiative-equilibrium effective-temperature envelope. It explicitly returns `surfaceTemperatureK: null` and `greenhouseResponse: UNSUPPORTED`.

Scientific basis: Del Genio et al. (2019), *Albedos, equilibrium temperatures, and surface temperatures of habitable planets*, ApJ 884:75, emphasizes that assumed albedo and greenhouse response materially separate equilibrium from surface temperature. NASA GISS publication page: https://www.giss.nasa.gov/pubs/abs/de06700y.html

Evidence class: **ESTABLISHED** radiative balance; fidelity: **APPROXIMATE**. Numeric authority remains floating scientific reference only. Fixed/integer fourth-root semantics are a promotion blocker.

### Water phase

Surface classification uses established water phase landmarks and refuses to collapse hot/high-pressure states into “ocean.” Triple point: 273.16 K and about 611.657 Pa. Critical point: 647.096 K and 22.064 MPa. Deep/high-pressure water EOS is explicitly unsupported.

Sources:

- NIST Chemistry WebBook, water phase-change data: https://webbook.nist.gov/cgi/cbook.cgi?ID=C7732185&Mask=4
- IAPWS/NIST thermodynamic reference material: https://www.nist.gov/srd/nistir-5078
- Wagner et al./IAPWS critical point values as reproduced by NIST reference materials.

Evidence class: **ESTABLISHED**; fidelity: **APPROXIMATE** because v2 does not implement the full saturation/melting EOS. The intermediate liquid-vs-vapor region therefore returns a bounded capability state rather than fake precision.

### XUV / escape

Status: **UNSUPPORTED_EVOLUTIONARY_RATE**.

Reason: canonical upstream state lacks stellar rotation/XUV history and upper-atmosphere state. Tu et al. (2015) show solar-mass stars can remain X-ray saturated for roughly 10–300 Myr depending on initial rotation, producing a wide XUV-history distribution during the atmosphere-critical young interval. A unique age-only decay law is therefore rejected.

Source: Tu, Johnstone, Güdel & Lammer (2015), A&A 577 L3, https://doi.org/10.1051/0004-6361/201526146

Owen (2019) reviews hydrodynamic escape and the limits of simple escape approximations. Energy-limited escape is retained only as a future diagnostic candidate, not a canonical transition law.

Source: Owen (2019), Annual Review of Earth and Planetary Sciences 47:67–90, https://doi.org/10.1146/annurev-earth-053018-060246

Evidence class: **EMPIRICALLY_CONSTRAINED**; fidelity: **APPROXIMATE**; current promotion state: **UNSUPPORTED**.

### Geology / geochemical energy

Status: **UNSUPPORTED**. Bulk mass/radius/composition do not justify claiming plate tectonics, resurfacing rate or a nutrient/chemical-energy index. These fields remain absent rather than synthetic P6 conveniences.

### Spatial environment

Research projection reuses canonical P5 planet identity and `p5-cube-sphere-topology-1` patch keys. No ecological or climate grid is introduced. Rendering LOD cannot change environmental identity.

Evidence: **ESTABLISHED / FORMAL** because the spatial identity is inherited from frozen P5 topology, not newly modeled climate physics.

## P4 temporal design

Field ownership:

- volatile-inventory hypothesis: `STATIC_GENESIS` in this research model only;
- pressure: `DERIVED_FROM_CURRENT_UPSTREAM_STATE`;
- radiative equilibrium envelope: `DERIVED_FROM_CURRENT_UPSTREAM_STATE`;
- water phase: `DERIVED_FROM_CURRENT_UPSTREAM_STATE`;
- atmospheric retained mass / lost mass: `PERSISTENT_MUTABLE_CANDIDATE`;
- effective temperature floating reference: `RESEARCH_ONLY_TRANSIENT`.

Draft transition equation:

`prior P5 environment state + P4-accepted event/time + p5-environment-transition-research-v1 = new P5 environment state`.

The implementation refuses atmosphere-loss transitions without `acceptedByP4 === true` and an explicit P4 time key. There is no P5-private clock or event log.

## Metamorphic / causal tests

The research gate checks:

- exact canonical P5 v1 conformance first;
- P5 physical digest unchanged before/after environment queries;
- volatile conservation;
- zero atmospheric mass -> zero positive pressure;
- more atmospheric mass on the same planet -> non-decreasing column pressure;
- supercritical water is not labeled ocean/liquid;
- low-pressure regimes are explicit;
- P4 acceptance is mandatory for mutable loss transition;
- loss transition conserves total volatile bookkeeping;
- query order does not alter environment realization;
- research contract references canonical `ofu-p5-p6-environment-v1` rather than replacing it.

## Working-set architecture

Planet environment queries materialize one compact planet record plus, optionally, one canonical patch key. No global climate grid, ocean mask or terrain heightmap is required. Regional projection currently adds identity only, not a spatial climate field. Active environmental cells per local query: 0 climate cells; 0 mandatory retained regional caches.

## P6-ready research fields

- `pressure.kind = SURFACE_COLUMN_PRESSURE` and integer `pressurePa`, with research authority inherited from volatile-inventory uncertainty;
- radiative `effectiveTemperatureK` envelope, explicitly not surface temperature;
- broad water phase capability classification;
- canonical stable spatial reference.

## Unsupported fields

- precise surface temperature / greenhouse climate;
- atmospheric detailed chemistry / mean molecular weight;
- canonical XUV history and evolved mass-loss rate;
- geological activity / tectonic regime;
- geochemical energy availability;
- actual ocean area fraction;
- deep high-pressure water EOS;
- regional climate transport.

## Recommended next controlled promotion scope

Do **not** promote the generated volatile prior. The narrowest defensible future promotion candidate is:

1. a generic canonical atmosphere-state schema with conserved integer inventories supplied by an explicitly governed genesis/transition source;
2. physical column-pressure derivation from that atmosphere mass plus frozen P5 radius/gravity;
3. a Tier-0 radiative effective-temperature reference/envelope whose fixed-point numeric semantics are specified.

Water phase can follow once the saturation-curve/EOS subset and volatile-water authority are promotion-stable. XUV escape and geology should remain separate later waves.
