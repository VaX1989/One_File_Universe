# P5 Scientific Provenance v0.2

This register records research sources and applicability. It does not claim that P5 reproduces each full source model.

| Area | Source | P5 use | Evidence / fidelity |
| --- | --- | --- | --- |
| Rocky mass-radius | Zeng, Sasselov & Jacobsen (2016), ApJ 819:127, DOI `10.3847/0004-637X/819/2/127` | PREM-based composition-aware rocky relation; P5 uses it only for `1–8 M_Earth`, CMF `0–0.4` | EMPIRICALLY_CONSTRAINED / APPROXIMATE |
| Sub-Neptune envelopes | Lopez & Fortney (2014), ApJ 792:1, DOI `10.1088/0004-637X/792/1/1` | Research analytic envelope-radius comparison in its stated mass/envelope/flux/age range | EMPIRICALLY_CONSTRAINED / APPROXIMATE; not a replacement for full evolution grids |
| Atmospheric escape | Owen (2019), Annual Review of Earth and Planetary Sciences 47, DOI `10.1146/annurev-earth-053018-060246` | Motivates irradiation/XUV-driven escape beside thermal/Jeans retention | ESTABLISHED mechanism; P5 implementation APPROXIMATE |
| Retention trend | Zahnle & Catling (2017), arXiv:1702.03386 | Combined irradiation + escape-velocity diagnostic inspiration; not a hard universal boundary | EMPIRICALLY_CONSTRAINED / APPROXIMATE |
| Seasonal climate | Spiegel, Menou & Scharf (2008), arXiv:0807.4180 | Supports seasonal latitude EBM and obliquity sensitivity | EMPIRICALLY_CONSTRAINED model family / APPROXIMATE |
| EBM hierarchy | North, Cahalan & Coakley (1981), DOI `10.1029/RG019i001p00091` | Supports global -> latitude/season refinement before GCM | ESTABLISHED model family / APPROXIMATE application |
| Water reference state | IAPWS reference guidance | Critical point `647.096 K`, `22.064 MPa`; triple-point reference used for broad phase classification | ESTABLISHED / FORMAL constants; classifier APPROXIMATE |
| High-pressure water | Haldemann et al. (2020), A&A 643:A105, DOI `10.1051/0004-6361/202038367` | Evidence that water-rich interiors require an EOS across broad pressure/temperature space; P5 flags unsupported deep regimes instead of fabricating phase certainty | EMPIRICALLY_CONSTRAINED source; P5 APPROXIMATE |
| Tectonic regimes | Noack & Breuer (2014), DOI `10.1016/j.pss.2013.06.020`; Duarte et al. (2026), DOI `10.1007/s11214-026-01317-3` | Supports heat/rheology/boundary-condition dependence and rejection of mass-only plate-tectonics prediction | HYPOTHETICAL exoplanet inference / STYLIZED P5 proxy |

## Explicit non-claims

- P5 is not a mantle-convection solver and does not predict plate tectonics.
- The greenhouse/Tier-2 transport coefficients are not radiative-transfer or GCM calibration.
- Energy-limited escape is a diagnostic, not an integrated atmospheric history.
- Current ice/gas-giant radii are research-only.
- High-pressure-water states are classified as EOS-required rather than solved.
- Terrain topology is a refinement architecture; the present height field is stylized, not a geophysical forward model.

## Model decisions

Selected: bounded rocky model, separate volatile/giant families, multiple escape diagnostics, explicit unsupported water regimes, Tier 0/1/2 climate hierarchy, uncertain lid-regime proxy, integer shared cube-sphere topology.

Rejected: universal rocky/giant radius law, one atmospheric-retention threshold, mass-only tectonics, detailed high-pressure phase claims without EOS, full GCM baseline, whole-planet heightmap, and face-local terrain without shared edge/corner identity.
