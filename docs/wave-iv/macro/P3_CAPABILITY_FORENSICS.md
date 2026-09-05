# Wave IV Macrocosm — P3 Capability Forensics

Status: implementation-lane evidence, not a certification artifact.

## Canonical geometry available to Macrocosm

P3 schema v1 establishes enough baseline spatial structure to support scientifically honest macro navigation without pretending that every screen-space coordinate is physical truth.

| Scale / fact | P3 authority | Macro mapping |
| --- | --- | --- |
| Region cell coordinates, galaxy cell span/size | canonical model geometry | `CANONICAL_GEOMETRY` |
| Region density/environment class | canonical model fact; HYPOTHETICAL/STYLIZED evidence | canonical contextual fact, never an observed density map |
| Galaxy site cell + `cellOffsetPc` | canonical model geometry | relative galaxy centers use `CANONICAL_GEOMETRY`; 2D projection is presentation-only |
| Galaxy morphology/radius/orientation | canonical model facts | morphology/orientation may influence glyphs, but the glyph is not a literal telescope image |
| Sector coordinates | computational partition | never presented as an independent physical body |
| System absolute site + `baselineLocalOffsetMilliPc` | canonical P4-T0 positional baseline | neighborhood relative position uses `CANONICAL_GEOMETRY`; viewport projection is presentation-only |
| Stellar component membership/facts | canonical | component layout inside a system is `PRESENTATION_ONLY` because P3 does not publish component Cartesian positions |
| Planet membership and orbit slot | canonical | canonical selectable membership and order |
| Planet semimajor axis/eccentricity/inclination/orbit center | canonical P4-T0 baseline facts | retained in metadata; system-map guide remains `CANONICAL_ORDER / PRESENTATION_GEOMETRY` unless true orbital geometry is rendered without phase claims |
| Moon membership/count | canonical when resolved | contextual only in this lane |

## Canonical capabilities used

- region identity, environment class and density metadata;
- galaxy identity, center offset, characteristic radius, morphology and orientation;
- sector/system addressing and stable System identity;
- system baseline local position at P4 `T0`;
- bounded sparse resolution of neighboring canonical systems;
- stellar component count, canonical star identity, temperature/radius/luminosity/evolutionary class;
- canonical planet count, identity, orbit slot/order, bulk prior, baseline mass/insolation and orbital elements;
- explicit absence (`status: ABSENT`) rather than fabricated entities.

## Capabilities intentionally unavailable / not claimed

P3 v1 does **not** establish:

- a literal all-sky or galaxy-wide star catalogue;
- arbitrary background-star distances or membership;
- canonical physical planet or moon radius;
- canonical albedo or display color;
- physical apparent brightness or physical angular size;
- a current orbital anomaly/phase for a planet;
- present-day component positions derived from an orbital solution;
- detailed planet composition realization, atmosphere, climate, terrain or biology.

Accordingly, decorative depth stars are always `DECORATIVE_ONLY`, system component placement is presentation-only, planet marker angles are presentation-only, and transitions are never canonical time or physical travel/orbital motion.

## Authority classes

`src/rendering/macro/macro-scene.js` uses exactly four classes:

1. `CANONICAL_GEOMETRY` — a P3-owned positional/geometric baseline is being consumed.
2. `CANONICAL_ORDER_PRESENTATION_GEOMETRY` — canonical membership/order/facts drive a deterministic schematic whose screen geometry is not itself canonical.
3. `PRESENTATION_ONLY` — deterministic visual encoding with no physical/canonical geometry claim.
4. `DECORATIVE_ONLY` — visual depth/noise with no canonical identity and no interaction rights.

No camera, LOD or transition state changes canonical membership.