# R&D-16 Domain Decomposition and Causal Graph

## Decomposition

1. **Formation/input inventory boundary** — accepts scenario composition and upstream stellar/orbital forcing; it does not reroll P3/P5 facts.
2. **Bulk/interior** — bounded rocky bulk proxy, gravity/density, global thermal reservoir and Rayleigh diagnostic.
3. **Geodynamics** — candidate convection/lid regime labels; future work owns melt, tectonics and outgassing rate laws.
4. **Volatile evolution** — exact reservoirs; outgassing/condensation can enter through explicit transfers; XUV escape is an optional energy-limited research transition.
5. **Atmosphere/radiation** — optical depth is an explicit research input; grey atmosphere produces a model temperature, not a canonical surface temperature.
6. **Climate transport** — bounded zonal energy state with conservative nearest-neighbor transport and explicit external forcing.
7. **Hydrology/ice** — exact water reservoir transfers plus a deliberately low-fidelity temperature-only phase proposal.
8. **Terrain/hypsometry** — only a bounded sparse deterministic texture envelope exists here; physical hypsometry remains unsupported.
9. **Giant planets** — family taxonomy and heavy-element bookkeeping only; radius and atmosphere remain unsupported.
10. **Cross-scale seam** — exact planet-total budget partition into a bounded active region set via REFINE, aggregation via PROJECT, and fail-closed RECONCILE.
11. **Temporal seam** — research evolution emits a P4-targeted proposal, never a canonical event.

```mermaid
graph TD
  S[stellar / orbital forcing - upstream] --> X[XUV escape scenario]
  S --> R[radiative forcing]
  F[formation inventory scenario] --> C[bulk composition]
  C --> I[interior / gravity / density]
  I --> H[thermal budget]
  H --> RA[Rayleigh diagnostic]
  RA --> L[lid regime candidate]
  H --> O[outgassing proposal]
  O --> V[volatile reservoirs]
  I --> X
  X --> V
  V --> TAU[atmospheric optical depth scenario]
  TAU --> R
  R --> Z[zonal climate transport]
  Z --> W[water / ice reservoir proposal]
  W --> B[planet budget]
  T[stylized sparse terrain envelope] --> B
  B --> RF[REFINE region budgets]
  RF --> PJ[PROJECT]
  PJ --> RC[RECONCILE]
  V --> P4[P4 transition proposal only]
  H --> P4
  Z --> P4
  W --> P4
```

## Causal governance

A graph edge means “may provide an input to a research submodel,” not “scientifically identified cause in every planet.” No edge grants truth authority. Exogenous histories (stellar XUV, impacts, accretion, rheology parameters, atmospheric opacity) remain inputs until separate source-backed transition models exist.

P4 remains the only canonical temporal owner. The lane has no private clock, no EventId authority, no event ordering authority, and no admission/replay/checkpoint authority.
