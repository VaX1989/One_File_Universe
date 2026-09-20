# PROD-W1-INSTRUMENTS — Governed scientific instruments

`PROD-W1-INSTRUMENTS` adds an additive, read-only scientific measurement projection over the existing W1 Scientific Fingerprint and typed Scientific WHY providers.

The layer does **not** observe the physical world, create canonical facts, or infer missing quantities. It projects quantities that already exist in the governed OFU scientific state and labels their units, source model, provenance, uncertainty state, and authority. A numeric reading is emitted only when a supported source value is present and its upstream domain authority is not `UNKNOWN`.

## Authority boundary

The provider is `ANALYSIS_ONLY`. Every reading carries separate `source`, `projection`, and `effective` authority. The projection never raises source authority: effective authority is the weaker of the source and analysis layer. Unsupported operations are `UNSUPPORTED`; absent or unknown governed source values are `UNKNOWN` with `quantity=null`.

Presentation state is not a scientific source. Camera state, renderer state, materialization order, terrain presentation amplitudes, palette, visual LOD, and other presentation-only values are not measurement inputs.

No reading is represented as an observation unless an upstream source already provides observation authority. The current instrument catalog therefore describes deterministic projections of governed model/canonical state, not new empirical measurements.

## Supported instruments

| Instrument | Governed source | Source unit | Supported output unit(s) | Source domain |
| --- | --- | --- | --- | --- |
| `PLANET_RADIUS` | `planet.meanRadiusM` | `m` | `m`, `km` | `physicalPlanet` |
| `SURFACE_GRAVITY` | `planet.surfaceGravityMicroMs2` | `um/s^2` | `m/s^2` | `physicalPlanet` |
| `MEAN_DENSITY` | `planet.meanDensityKgM3` | `kg/m^3` | `kg/m^3` | `physicalPlanet` |
| `SURFACE_TEMPERATURE` | `environment.climate.surfaceTemperatureMilliK` | `mK` | `K`, `mK` | `environment` |
| `SURFACE_LATITUDE` | `surface.latitudeMicroDeg` | `microdeg` | `deg` | `surface` |
| `SURFACE_LONGITUDE` | `surface.longitudeMicroDeg` | `microdeg` | `deg` | `surface` |
| `SAMPLE_COMPONENT_COUNT` | `sample.componentCount` | `count` | `count` | `sample` |

Conversions use exact decimal scaling of canonical integer source text; floating-point rounding is not used to manufacture precision.

## Model basis and provenance

Each supported reading binds to:

- exact canonical subject;
- scientific-state contract;
- scientific-model and generator versions;
- source path and source domain;
- applicable scientific hash (`planet`, `surface`, or `sample`);
- Scientific Fingerprint provider identity/version;
- Scientific WHY provider identity/version and deterministic WHY graph hash.

`SURFACE_TEMPERATURE` additionally exposes the upstream climate model label when present. The instrument layer never reclassifies that model output as an observation.

## Uncertainty

Uncertainty is first-class only when explicitly supplied as an upstream-bound record. Supported forms are interval, qualitative, or explicit unknown uncertainty. Interval bounds are canonical decimal text and must use the selected output unit. Uncertainty authority cannot exceed the measurement source authority.

If uncertainty is absent the reading says `NOT_DECLARED_UPSTREAM`; it does not invent an error bar. Numeric/model uncertainty cannot be attached to an `UNKNOWN` reading, and no uncertainty can be attached to an unsupported instrument or unsupported output unit.

Explicit uncertainty records are also projected into the existing typed SCI-WHY graph, preserving exact subject/model binding and provenance.

## Determinism and resource bounds

Requests are normalized and sorted by deterministic request identity before projection. Reading identity and projection identity use the repository's deterministic generative serialization/hash machinery. Reordering semantically identical requests therefore does not change the projection hash or canonical serialization.

The provider has explicit request, text, and canonical-byte bounds. The result exposes request/source-read/WHY node/edge resource accounting. Bound exhaustion fails closed.

## Focused falsification

`tests/product/prod-w1-instruments.mjs` covers:

- repeated/reordered deterministic replay;
- exact unit conversion;
- source/effective authority propagation;
- Fingerprint and WHY provenance linkage;
- explicit uncertainty and uncertainty-authority bounds;
- `UNKNOWN` behavior for unavailable environment/surface/sample state;
- `UNSUPPORTED` behavior for unknown instruments and unsupported units;
- malformed requests, duplicate identities, reversed intervals, and resource bounds;
- invariance to presentation-only changes.

Permanent central registration in `package.json` is outside this lane's ownership. The required control-owned one-line registration is described in `INTEGRATION_PATCH_REQUEST_TEST_REGISTRATION.json`.
