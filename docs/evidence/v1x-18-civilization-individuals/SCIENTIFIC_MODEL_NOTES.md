# V1X-18 Civilization / History / Individuals — Scientific Model Notes

Authority: **RESEARCH_ONLY / MODEL_DERIVED_SIMULATION candidate**. Nothing in this directory is canonical scientific truth, a historical reconstruction, or a shipping provider.

## Versioned model family

- `ofu-r18-civ-stockflow-1` — coupled settlement stock/flow prototype.
- `ofu-r18-civ-cohort-slices-1` — sparse birth-cohort/residence slices; no eager persons.
- `ofu-r18-civ-gravity-exchange-1` — bounded distance-friction exchange heuristic.
- `ofu-r18-civ-institution-stock-1` — stylized capacity/legitimacy stocks.
- `ofu-r18-civ-cultural-diffusion-1` — scalar social-learning/diffusion placeholder.
- `ofu-r18-civ-history-legacy-1` — ruins, route legacy, abandonment/reoccupation consequences.
- `ofu-r18-civ-person-refinement-1` — deterministic selected-person materialization.
- `ofu-r18-civ-p4-bridge-1` — candidate exact P4 transition family for research replay only.

## Numerical semantics and portability

State-changing arithmetic in the aggregate model uses safe integers plus explicit `BigInt` multiply/divide, integer square root, integer distance, and parts-per-million fixed-point rates. There are no floating-point random draws and no AI calls. Iteration order is explicitly sorted where pairwise settlement interactions matter. The current selected-person identity prototype uses Node `crypto` SHA-256 over a domain-separated tuple `(worldId, originSettlementId, birthYear, serial)`. Promotion should replace the Node binding with the frozen OFU canonical digest/domain-separation surface while preserving that tuple and proving identical vectors.

The diagnostic environment for this handoff is Node 22.16.0, while repository `package.json` declares Node 24.20.x. Integer/BigInt behavior is expected to be portable, but canonical promotion requires exact Node 24.20.x re-execution and browser/runtime cross-checks.

## Relationship ledger

Every causal relationship below is classified separately. Coefficients in this prototype are intentionally not presented as universal historical estimates.

| Relationship in prototype | Source basis | Validity domain used here | Classification | Assumptions / limitations / fidelity |
|---|---|---|---|---|
| Birth-cohort accounting and age-dependent transitions | Leslie (1945), age-structured population matrices | Aggregate demographic bookkeeping | **FORMAL STRUCTURE, APPROXIMATE IMPLEMENTATION** | Leslie establishes age-structured transition logic, not this model's rates. Initial broad cohorts are synthetic; annual births become explicit slices. |
| Mortality schedule by age plus stress increment | None asserted for coefficient values | Scenario dynamics only | **STYLIZED / HYPOTHETICAL** | Baseline rates and stress multipliers are hand-set; not calibrated to any era, population, disease regime, or sex structure. Hard maximum modeled age 110 prevents immortal integer remnants; this is a numerical guard, not a biological claim. |
| Fertility decreases under severe food stress | General demographic plausibility only; no coefficient source asserted | Scenario dynamics only | **STYLIZED / HYPOTHETICAL** | Fertility is a single adult-cohort rate. No parity, sex, marriage, lactation, disease, contraception, or age-specific fertility schedule. |
| Food production responds to ecology, technology and infrastructure | Stock/flow modeling convention; no universal historical equation asserted | Settlement resource stress experiments | **STYLIZED** | `landFoodCapacity` is an abstract flow capacity. No crop, soil, climate, labor, energy, or market calibration. Ecology arrives as an exogenous PPM driver pending V1X-17/V1X-16 research interfaces. |
| Bilateral exchange rises with settlement mass and falls with distance/friction | Anderson & van Wincoop (2003) for theoretically founded gravity trade; broader spatial-interaction tradition | Connectivity heuristic between settlements | **APPROXIMATE / STRUCTURAL ANALOGY** | This is not their structural gravity equation and has no multilateral resistance terms, prices, currencies, borders, comparative advantage, or empirical fit. It only borrows mass-distance/friction structure. |
| Migration follows bounded welfare gradients and distance friction | No single empirical law asserted | Scenario differentiation | **STYLIZED / HYPOTHETICAL** | Welfare is an internal composite of food satisfaction, legitimacy, infrastructure and conflict. Migration moves deterministic cohort tails to preserve stable identities; selection is computational, not a claim about who migrates. |
| Infrastructure accumulates from investible wealth and decays through maintenance/conflict | Generic capital-stock reasoning | Long-run path-dependence scenarios | **STYLIZED** | Wealth, infrastructure and productive capacity are abstract integer stocks without units or prices. No depreciation estimate is claimed. |
| Institution capacity and legitimacy respond to fiscal capacity, scarcity and conflict | No universal quantitative source asserted | Counterfactual scenario mechanism | **HYPOTHETICAL** | Institutional quality cannot be reduced universally to these variables. These stocks exist to make causal pathways inspectable, not to encode a political-science law. |
| Conflict/tension increases with scarcity, low legitimacy and outward migration pressure | No universal quantitative source asserted | Stress-test mechanism | **HYPOTHETICAL** | This is deliberately not calibrated as a conflict predictor. It must not be used to infer real-world violence risk or historical inevitability. |
| Technology increases through local investment/connectivity and saturates | Bettencourt et al. (2007) supports empirical scaling relationships between city size and several socioeconomic outputs; Henrich & McElreath (2003) motivates cumulative cultural/social learning | Abstract innovation/diffusion stock | **STYLIZED, EMPIRICALLY MOTIVATED** | No urban scaling exponent is implemented; `technologyPpm` is dimensionless and not an empirical technology index. |
| Cultural marker diffuses weakly through exchange-linked neighbors | Henrich & McElreath (2003), formal cultural-evolution/social-learning framing | Demonstrating path-dependent transmission | **STYLIZED / CONCEPTUAL** | A single scalar cannot represent language, norms, religion, identity or institutions. It exists only to prove deterministic transmission and local persistence mechanics. |
| Route use creates a decaying route legacy that reduces later friction | van Lanen et al. (2018) documents substantial route-network persistence in a Netherlands case study | Historical infrastructure legacy demonstration | **EMPIRICALLY MOTIVATED, STYLIZED TRANSFER** | Regional empirical percentages are not generalized or encoded. The prototype's decay and friction effects are arbitrary and only demonstrate a structural legacy channel. |
| Ruins, abandonment and reoccupation persist as present-state structure | Smith et al. (2021) and Crawford et al. (2023) motivate settlement persistence, path dependence, geography/demography/institutions, and long-duration archaeological study | History-to-present consequence mechanism | **EMPIRICALLY MOTIVATED, STYLIZED** | `ruins` is an abstract stock, not an archaeological visibility model. Preservation, taphonomy, rebuilding, looting, sedimentation and survey bias are absent. |
| Stable individuals are refined from aggregate cohort slices without eager materialization | Computational design, not an empirical relationship | OFU sparse-addressing research | **FORMAL / PROTOTYPE** | Stable identity is guaranteed for represented slice addresses. Genealogical parent links are model-derived candidates from birth-ledger cohorts and are explicitly marked synthetic, not recovered historical persons. |
| Individual memories/knowledge/roles/goals are bounded deterministic functions of aggregate state/history | Computational fallback design | Future AI-agent enrichment fallback | **STYLIZED / PRESENTATIONAL SIMULATION STATE** | They are not cognitive-science models. No claim is made that generated goals or memories correspond to real human psychology. AI enrichment must remain optional and subordinate to deterministic state. |

## Scientific sources

1. P. H. Leslie (1945), “On the use of matrices in certain population mathematics,” *Biometrika* 33(3), 183–212. DOI: https://doi.org/10.1093/biomet/33.3.183
2. James E. Anderson & Eric van Wincoop (2003), “Gravity with Gravitas: A Solution to the Border Puzzle,” *American Economic Review* 93(1), 170–192. DOI: https://doi.org/10.1257/000282803321455214
3. Luís M. A. Bettencourt, José Lobo, Dirk Helbing, Christian Kühnert & Geoffrey B. West (2007), “Growth, innovation, scaling, and the pace of life in cities,” *PNAS* 104(17), 7301–7306. DOI: https://doi.org/10.1073/pnas.0610172104
4. Joseph Henrich & Richard McElreath (2003), “The evolution of cultural evolution,” *Evolutionary Anthropology* 12(3), 123–135. DOI: https://doi.org/10.1002/evan.10110
5. Michael E. Smith et al. (2021), “The persistence of ancient settlements and urban sustainability,” *PNAS* 118(20), e2018155118. DOI: https://doi.org/10.1073/pnas.2018155118
6. Katherine A. Crawford et al. (2023), “A systematic approach for studying the persistence of settlements in the past,” *Antiquity* 97(391), 213–230. DOI: https://doi.org/10.15184/aqy.2022.175
7. Rowin J. van Lanen, Bert J. Groenewoudt, Theo Spek & Esther Jansma (2018), “Route persistence…: a case study from the Netherlands,” *Archaeological and Anthropological Sciences* 10(5), 1037–1052. DOI: https://doi.org/10.1007/s12520-016-0431-z

## P4 temporal/replay compatibility research

Frozen `ofu-p4-temporal-v1` computes a family key as `type + '@' + version` and admits custom reducers only through an exact transition contract whose declared event families exactly match reducer keys. The research bridge therefore declares three families:

- `research.civ.stockflow.step@1`
- `research.civ.history.consequence@1`
- `research.civ.refinement.materialize@1`

The bridge intentionally does **not** claim those families are admissible under `CORE_TRANSITION_CONTRACT`. A convergence owner would need to define/admit an exact shipping transition contract, test checkpoint/archive compatibility, and decide what civilization state belongs in P4 events versus deterministic recomputation. This lane has no authority to do that.

## Aggregate → individual refinement semantics

A settlement contains compact residence slices `(originId, birthYear, serialStart, count)`. Person identity is derived from `(worldId, originId, birthYear, serial)`, so moving a slice to a new settlement changes residence but not identity. Migration splits tail ranges, preserving serial addresses. Death reduces represented ranges deterministically. Births add one aggregate slice per settlement/year; no person object is created.

`REFINE` maps an ordinal in a selected settlement to one or more represented serials, materializes at most 128 persons, and produces bounded cognition/relationship fields. `PROJECT` reports sample counts by age/role. `RECONCILE` rematerializes every selected address and requires byte-for-byte-equivalent JSON structure, unique IDs, aggregate membership, and budget compliance. Materialization is observational and never mutates aggregate simulation state.

## Working-set and history limits

- max settlements: 64
- max cohort slices / settlement: 256
- max birth-ledger entries: 8192; exceeding the bound fails closed and therefore requires a future checkpoint/archive strategy
- max in-memory structural history events: 1024 (oldest entries dropped in this research prototype)
- max materialized persons per request: 128
- memories/person: 8; knowledge topics: 6; goals: 4; relationships: 6

A 300-year, two-settlement stress fixture reached 110 slices/settlement. This is evidence for the fixture only, not a proof for all migration graphs. The hard cap is the actual safety boundary.

## Known unsupported / not mature

No empirical calibration; no prices/currency/debt; no explicit production sectors; no disease/epidemic model; no sex-specific or household demography; no slavery/status/caste representation; no law or political regime taxonomy; no endogenous warfare actors or tactics; no historical language model; no archaeological preservation/survey model; no multi-polity diplomacy; no education system; no energy accounting; no climate model; no V1X-17 live ecology coupling yet; no stable promoted address schema; no canonical P4 event admission; no browser execution evidence; no Node 24.20.x evidence; no real-world historical prediction validity.
