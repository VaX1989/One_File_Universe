# P5 Scientific Provenance Register

This register records sources that materially influence research choices. It does not imply that the current prototype reproduces each cited model in full.

| Area | Source | Use in P5 | Evidence interpretation |
| --- | --- | --- | --- |
| Rocky mass-radius | Zeng, Sasselov & Jacobsen (2016), *ApJ* 819:127, DOI 10.3847/0004-637X/819/2/127 | Composition-aware rocky radius calibration target; paper gives a PREM-based semi-empirical relation over roughly 1-8 Earth masses and core-mass-fraction range | EMPIRICALLY_CONSTRAINED / APPROXIMATE |
| Population mass-radius | Chen & Kipping (2017), *ApJ* 834:17, DOI 10.3847/1538-4357/834/1/17 | Population-level comparison/reference; not a causal composition model | EMPIRICALLY_CONSTRAINED / APPROXIMATE |
| Atmospheric escape | Owen (2019), *Annual Review of Earth and Planetary Sciences* 47:67-90, DOI 10.1146/annurev-earth-053018-060246 | Establishes importance of irradiation-driven atmospheric escape, especially for lower-mass close-in planets; motivates age/irradiation/escape coupling | ESTABLISHED mechanism; detailed P5 proxy remains APPROXIMATE/STYLIZED |
| Atmosphere retention population trend | Zahnle & Catling (2017), arXiv:1702.03386 | Cosmic-shoreline trend motivates combined insolation + escape-velocity diagnostics; not used as a hard universal boundary | EMPIRICALLY_CONSTRAINED / APPROXIMATE |
| Energy-balance climate | North, Cahalan & Coakley (1981), *Reviews of Geophysics* 19:91-121, DOI 10.1029/RG019i001p00091 | Supports staged EBM hierarchy and latitude/season refinement instead of beginning with a GCM | ESTABLISHED model family / APPROXIMATE application |
| Rocky-planet tectonics | Noack & Breuer (2014), *Planetary and Space Science* 98:41-49, DOI 10.1016/j.pss.2013.06.020 | Strong caution against inferring plate tectonics from mass alone; motivates categorical regime proxy dependent on thermal/rheological assumptions | HYPOTHETICAL exoplanet inference / STYLIZED P5 proxy |
| Rocky planet heat engines | Duarte et al. (2026), *Space Science Reviews*, DOI 10.1007/s11214-026-01317-3 | Current review framing: internal heat sources and boundary conditions can lead to diverse tectonic regimes; supports separate heat/regime state | ESTABLISHED heat sources + HYPOTHETICAL regime inference |

## Explicit non-claims

- The prototype is not a mantle-convection solver.
- The prototype does not predict plate tectonics.
- The greenhouse function is not a radiative-transfer model.
- Jeans parameter is not a complete atmospheric escape history.
- Current gas/ice giant radii are stylized placeholders.
- Terrain geometry is causally constrained procedural synthesis, not a geophysical forward model.

## Research priorities from provenance review

1. Replace simplified rocky radius exponent with a bounded Zeng-style composition-aware relation in its validity domain.
2. Add explicit model-family switching outside rocky validity ranges rather than extrapolating one formula.
3. Introduce a compact XUV/age fluence proxy and compare against simple energy-limited escape, without making either canonical prematurely.
4. Implement Tier-2 seasonal/latitudinal EBM and quantify projection consistency with Tier 1.
5. Keep tectonic regime probabilistic/stylized until thermal evolution and rheology parameterization evidence improves.
