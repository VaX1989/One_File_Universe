# P5 Environment Next Science Research

Status: **RESEARCH / NON-CANONICAL**.

This directory explores the smallest scientifically defensible successor surface beyond frozen `ofu-p5-p6-environment-v2`. It does not replace Environment v2, does not generate a volatile inventory, does not infer a surface temperature from radiative effective temperature, and does not create canonical escape, geology, ocean, climate, or biology.

Research authority: `P5_RESEARCH_DRAFT`.

Prototype contract: `ofu-p5-environment-next-research-v1`.

Main executable ideas:

- species-resolved, exactly conserved volatile reservoirs with explicit unresolved composition;
- global column pressure from atmospheric mass using the frozen Environment-v2 pressure-law geometry;
- ideal well-mixed gas mole fractions / partial pressures only under an explicit assumption and complete composition;
- deterministic IAPWS-IF97 Region-4 H2O vapor-liquid saturation pressure, used only as a saturation-tendency diagnostic when an authoritative surface temperature and H2O partial pressure exist;
- explicit fail-closed readiness assessments for surface temperature, XUV escape and geochemical energy.

No global grid, planet enumeration, private clock, event log, renderer input, or independent RNG is introduced.

Run research checks:

```sh
node tests/p5-environment-next-science/run-research-tests.mjs
python3 tools/p5_environment_next_oracle.py tests/p5-environment-next-science/golden-research-v1.json
node tests/p5-environment-next-science/benchmark-research.mjs
```
