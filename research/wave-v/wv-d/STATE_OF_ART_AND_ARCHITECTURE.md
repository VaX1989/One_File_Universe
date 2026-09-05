# WV-D State of Art, Assumption Ledger, and Research Architecture

**Lane:** WV-D — Civilization + Deep History  
**Mode:** `RESEARCH_ONLY`  
**Research model:** `wv-d-civilization-history-research-1`  
**Research contract:** `ofu-wv-d-civilization-history-research-v1`

## 1. Scope and authority

This checkpoint researches a causal multiscale civilization/history engine. It does **not** authorize canonical civilization.

The required Wave V base SHA/tree and Prompt-0 ownership manifest were unresolved when the branch was created. The branch therefore exists only as an isolated research container. Positive fixtures require `SYNTHETIC_TEST_ONLY` upstream authority. Current canonical P6 cannot be converted into positive civilization because P6 v1 currently establishes no production biosphere.

The research target is:

```text
environment
+ resources
+ biology
+ population
+ technology
+ institutions
+ interactions
+ history
→ civilization state
```

P4 remains owner of canonical time, event identity/order, checkpointing, compaction, archive, replay and lineage. A future P7/WV-D transition contract may own civilization state transitions but must not redefine P4 ordering or persistence semantics.

## 2. Scientific stance

Human social systems do not support the same kind of universal predictive laws as orbital mechanics or conservation physics. Models are therefore separated into:

- `FORMAL`: software/math invariants such as exact partition sums, deterministic addressing, conservation accounting and replay equality;
- `EMPIRICALLY_INSPIRED`: mechanism families with substantial empirical precedent, such as cohort-component demography, gravity-style spatial interaction, network diffusion and settlement scaling;
- `HYPOTHESIS`: useful but context-sensitive abstractions such as a carrying-capacity proxy or settlement suitability score;
- `GENERATIVE_FICTION`: underdetermined synthetic social details such as individual biographies, exact political outcomes, cultural motifs, belief contents or language forms.

No empirically inspired mechanism is treated as a universal law. Parameters are not promoted merely because a literature exists.

## 3. Literature / provenance matrix

| Domain | Source | What is robust enough to inform architecture | What is **not** promoted from it |
|---|---|---|---|
| Demography | UN DESA, *World Population Prospects 2024: Methodology* — https://population.un.org/wpp/assets/Files/WPP2024_Methodology-Report_Final.pdf | Cohort-component decomposition; fertility, mortality and migration as distinct inputs; uncertainty/scenario separation | Universal fertility/mortality schedules for arbitrary species/civilizations |
| Human carrying capacity | Kirchner et al. 2025, systematic review, *Integrated Environmental Assessment and Management* — https://doi.org/10.1093/inteam/vjaf021 ; Richards 2025, *Ecological Modelling* — https://doi.org/10.1016/j.ecolmodel.2025.111232 | Carrying capacity is context- and purpose-dependent; quality-of-life, institutions and technology matter; use as bounded scenario variable rather than physical constant | A single fixed planetary population ceiling or deterministic collapse threshold |
| Settlement scaling | Lobo, Bettencourt, Smith & Ortman 2020, *Urban Studies* — https://doi.org/10.1177/0042098019873796 | Settlements can be modeled as spatially embedded interaction networks; aggregate scaling regularities can be valuable validation targets | Assuming one universal exponent or that all societies follow modern urban scaling |
| Spatial settlement / routes | Herzog 2014, *Archeologia e Calcolatori* — https://doi.org/10.19282/ac.25.2014.12 | Cost surfaces and least-cost routes are useful exploratory structures; parameter sensitivity and terrain resolution matter | Treating a least-cost route as historical fact without validation |
| Trade / migration interaction | Anderson 2011, *Annual Review of Economics* — https://doi.org/10.1146/annurev-economics-111809-125114 | Gravity-style interaction is a strong empirical family for bilateral flows; distance/trade costs and mass terms are useful generic factors | A universal gravity coefficient usable across eras/species without calibration |
| Innovation diffusion | Gondal 2023, *Sociology Compass* — https://doi.org/10.1111/soc4.13084 ; Meade & Islam 2023, *Annual Review of Statistics and Its Application* — https://doi.org/10.1146/annurev-statistics-040220-091526 | Diffusion depends on network structure, actor/innovation properties, barriers and communication; multiple model families exist | Treating contagion/logistic dynamics as a universal technology law |
| Network architecture / diffusion | Reich 2026, *Review of Economic Studies* — https://doi.org/10.1093/restud/rdag052 | Network architecture and coordination groups can qualitatively change adoption dynamics | Any claim that one network metric predicts all diffusion outcomes |
| Institutions | Epstein et al. 2020, *Current Opinion in Environmental Sustainability* — https://doi.org/10.1016/j.cosust.2020.06.002 | Institutions are rules/norms/customs embedded in social-ecological systems; history and power matter; institutional change is path-dependent | A scalar `institutionQuality` law determining outcomes |
| Computational institutions | Oesterling, Ambrose & Kim 2024, *International Journal of the Commons* — https://doi.org/10.5334/ijc.1335 | Agent-based institutional models are useful for mechanism exploration; multiple theoretical lenses coexist | Treating an ABM as validated prediction merely because it is deterministic |
| Cultural transmission | *Oxford Handbook of Cultural Evolution*, chapter “Modelling Cultural Transmission” (2023) — https://academic.oup.com/edited-volume/45648/chapter/411058474 | Vertical/horizontal/oblique transmission and social-learning biases are useful mechanism categories | Freezing particular cultural traits or values as universal human/sapient outcomes |
| Language cultural evolution | Kirby, Tamariz, Cornish & Smith 2015, *Current Opinion in Behavioral Sciences* — https://doi.org/10.1016/j.cobeha.2015.09.030 ; Steels 2011 — https://doi.org/10.1016/j.plrev.2011.10.014 | Language structure can emerge under learning/communication pressures; conventions can be modeled as cultural dynamics | Predicting actual grammar, lexicon, language family or semantic content from environment alone |
| Collapse / resilience | Cumming & Peterson 2017, *Trends in Ecology & Evolution* — https://doi.org/10.1016/j.tree.2017.06.014 | Collapse mechanisms are heterogeneous and contested; system identity and alternative causes must be explicit | A universal collapse score or deterministic monocausal collapse law |
| Archaeological resilience | Bradtmöller et al. 2022, *Annual Review of Anthropology* — https://doi.org/10.1146/annurev-anthro-041320-011705 | Deep-time archaeology demands historically situated, multi-causal interpretation and careful use of resilience concepts | Reading a ruin as a direct deterministic signature of one social cause |

The matrix is deliberately architectural. It does not freeze numeric constants.

## 4. Assumption ledger

### A. Formal commitments

1. **Determinism:** identical research seed + identical upstream fixture + identical model version => identical outputs.
2. **Query/order independence:** addressed detail must not depend on materialization order.
3. **Bounded materialization:** IMMEDIATE agents are local and bounded; no global individual enumeration.
4. **Refinement preservation:** finer representations may add detail but must preserve coarse population/resource/history commitments.
5. **Projection:** important local/fine events may be projected upward through explicit significance rules.
6. **Dematerialization:** removing HOT/IMMEDIATE detail must recover the WARM commitment exactly.
7. **Conservation accounting:** resource transfers/transformations preserve declared accounting quantities unless a flow explicitly crosses the modeled boundary.
8. **History causality:** a ruin/artifact must name the event(s) from which it derives. No causal history => no causal archaeology claim.

### B. Empirically inspired but uncalibrated mechanisms

- cohort-component demographic architecture;
- gravity-style bilateral interaction kernel;
- social-network/threshold diffusion architecture;
- settlement-network scaling observables;
- transport-cost / route-access influences;
- formal/informal institutional state;
- cultural transmission mechanism categories.

These remain `EMPIRICALLY_INSPIRED` until a future lane freezes species/context-specific calibration with provenance and sensitivity analysis.

### C. Hypotheses / approximations

- `carryingCapacityProxy` is a scenario constraint, not a fixed natural constant;
- settlement-potential weighting is an exploratory score, not a historical law;
- resource stock-flow units in the prototype are abstract conserved model units;
- significance thresholding is an engineering approximation for bounded deep history;
- institution state uses descriptive axes, not a normative ranking.

### D. Generative fictional zones

- personal identities, biographies, relationships and motives;
- detailed political choices or conflict outcomes;
- religion/belief/art content;
- exact language grammars/lexica;
- archaeological object style and inscriptions;
- named technologies absent a validated material/knowledge dependency chain.

These may be generated later for experience, but must remain visibly non-scientific and constrained by canonical commitments.

## 5. Dependency DAG

```text
UPSTREAM ENVIRONMENT AUTHORITY
    ├─ resource geography / transport cost
    ├─ hazards / climate constraints
    └─ viable habitat
            ↓
UPSTREAM BIOLOGY / POPULATION AUTHORITY
            ↓
DEMOGRAPHIC STATE ───────────────┐
            ↓                    │
RESOURCE STOCKS / PRODUCTION     │
            ↓                    │
SETTLEMENT NETWORK               │
            ↓                    │
TRADE / MIGRATION INTERACTIONS   │
            ↓                    │
TECHNOLOGY / KNOWLEDGE DIFFUSION │
            ↓                    │
INSTITUTIONS / FACTIONS          │
            ↓                    │
CULTURE / LANGUAGE CONVENTIONS   │
            └──────────┬─────────┘
                       ↓
                HISTORICAL EVENTS
                       ↓
        SIGNIFICANCE / COARSE COMMITMENTS
                       ↓
      LATE MATERIALIZATION + RECONCILIATION
                       ↓
           ARCHAEOLOGY / RUIN DERIVATION
```

Conflict, migration, collapse and institutional transition are **not** independent random generators. They are future event mechanisms that must consume relevant demographic, resource, network, institutional and historical state.

## 6. Civilization state model

### COLD — macro commitment

COLD stores bounded aggregated truth:

- civilization identity + upstream witness digest;
- total population;
- resource stocks and declared boundary flows;
- coarse technology-capability vector;
- coarse institution descriptors;
- macro network/statistical summaries;
- a history commitment containing event count, significance count and roots;
- uncertainty/evidence labels.

COLD is not a hidden list of every settlement/person.

### WARM — meso system

WARM refines COLD into bounded arrays/maps of:

- settlements;
- factions / institutional groups;
- resource-production nodes;
- trade/migration edges;
- technology/knowledge prevalence;
- cultural/linguistic convention summaries.

Required invariant:

```text
Σ settlement.population == COLD.population
Σ faction.population == COLD.population
```

Membership may be overlapping in a future richer model, in which case the equality contract must be replaced by an explicit population-membership semantics rather than silently double-counting.

### HOT — local social process

HOT materializes one or a small number of settlements/regions:

- local groups;
- local production/logistics queues;
- concrete infrastructure;
- local institution instances;
- bounded event detail;
- local archaeological features whose provenance points to history.

### IMMEDIATE — interaction set

IMMEDIATE materializes only entities needed for current gameplay/observation:

- bounded agents;
- current tasks/interactions;
- local object/event detail.

Prototype agents are explicitly `persistent=false`. A future persistent individual must receive a proper identity/history contract rather than inheriting a transient array index.

## 7. Late-materialization algorithm

1. Resolve coarse canonical state at requested time.
2. Select a bounded region/settlement from stable semantic identity, never insertion order.
3. Load its WARM commitment and significant-event summary.
4. `REFINE` deterministic local groups/resources/infrastructure subject to those commitments.
5. Materialize IMMEDIATE agents only for requested interaction scope.
6. Execute local simulation under a versioned domain transition contract when/if one exists.
7. `PROJECT` only events crossing declared significance thresholds or aggregate boundaries.
8. `RECONCILE` population/resource/history identities and digests.
9. Dematerialize local detail; keep only commitments/events required by authority and persistence semantics.

Fine history cannot invent a different population total, settlement destruction, founding time, resource state or significant event than the coarse representation has already committed.

## 8. History and significance model

The prototype uses research event envelopes:

```text
{
  civilizationId,
  time,
  type,
  targetId,
  payload,
  significancePpm,
  causes[],
  eventId
}
```

This is **not** a replacement for P4 event bytes. It is a research mirror for testing history semantics before a future P4 domain transition contract is designed.

Significance exists to bound deep history, not to redefine truth. A future production model should distinguish at least:

- events required for exact mutable state;
- events retained as causal/provenance witnesses;
- aggregate statistics sufficient for coarse evolution;
- locally reconstructable low-significance detail.

Projection must be deterministic and must never convert a discarded low-significance event into a contradictory high-significance history later.

## 9. Resources, economy and logistics

The prototype treats resources as stock-flow accounting, not as monetary macroeconomics.

Research structure:

```text
resource extraction/import
→ stocks
→ production transformations
→ goods/services/infrastructure capacity
→ consumption/maintenance/waste/export
```

Trade is a transfer across nodes; it cannot create stock. Production transforms declared input classes into outputs and byproducts. A future model may attach energy/work/loss coefficients, but any claimed conservation quantity must be explicit.

Gravity-style interaction is implemented only as a scenario kernel. It is not calibrated and does not create canonical trade/migration flows.

## 10. Institutions and factions

Institutions are represented as rules/norms/roles/coordination structures, not a single civilization “level.” Future models should separate:

- decision authority;
- membership;
- resource rights;
- monitoring/enforcement;
- conflict-resolution procedures;
- legitimacy/acceptance as an observed or modeled state;
- formal vs informal rules;
- institutional history.

Faction identity is not equivalent to ethnicity, culture, language, polity or ideology. These relations must be explicit and may be many-to-many.

No current rule predicts regime type, war, state formation or collapse.

## 11. Culture and language

The lane may model transmission and convention dynamics, because cultural-evolution research gives credible mechanism families. It must not infer specific content from weak causal inputs.

Safe architecture:

```text
population interaction network
+ learning/transmission channels
+ communication needs
+ memory/innovation constraints
→ convention distributions / divergence / convergence
```

Unsafe claim:

```text
climate X -> language grammar Y
```

The prototype therefore labels its culture/language adapter `GENERATIVE_FICTION` and `SCENARIO_ONLY_NON_PREDICTIVE`.

## 12. Conflict, migration and collapse

These are required WV-D research domains, but the current prototype intentionally does **not** freeze deterministic social laws for them.

Future conflict events should require explicit mechanisms such as contested resources, incompatible institutional claims, coercive capacity, alliance/network context and triggering history. Stochastic or deterministic scenario logic may be explored, but it must remain fidelity-labeled and falsifiable.

Migration should distinguish voluntary/forced movement, origin/destination capacity, network links, transport cost, hazards, institutions and demographic composition. A gravity kernel may propose interaction opportunity, not establish motive or outcome.

Collapse is not a scalar death-state. Candidate dimensions include population contraction, institutional fragmentation, network disconnection, settlement abandonment, production loss and transformation into successor institutions. Each must be represented separately so resilience/transformation is not misclassified as collapse.

## 13. Archaeology and ruins

Archaeology is derived from history, preservation rules and observation uncertainty.

Prototype rule:

```text
NO causal event -> NO causal archaeological feature
```

Examples:

- `INFRASTRUCTURE_BUILT` -> structural remains candidate;
- `INDUSTRIAL_ACTIVITY` -> production debris candidate;
- `SETTLEMENT_DESTROYED` -> destruction-layer candidate;
- `SETTLEMENT_ABANDONED` -> ruin candidate;
- `RITUAL_CONSTRUCTION` -> monumental-remains candidate.

A future preservation model must add burial/erosion/material durability/disturbance/visibility before an observed archaeological record is claimed. The generated ruin is not the same thing as an archaeologist’s interpretation.

## 14. Deterministic corpus / oracle coverage

The current test corpus uses three explicit synthetic fixtures:

- `river-valley`;
- `island-chain`;
- `dry-interior`.

The fixtures are not examples of canonical OFU planets and are not evidence that life/civilization exists in the shipped universe.

Focused oracles currently cover:

- synthetic-authority gate;
- deterministic COLD and WARM generation;
- exact population partitioning;
- HOT/IMMEDIATE refinement;
- bounded agents;
- dematerialization stability;
- addressed query/order independence;
- settlement score bounds;
- gravity-kernel qualitative invariants;
- adoption-score bounds;
- resource conservation and overdraft rejection;
- stock-transfer conservation;
- history replay ordering/deduplication;
- significance projection;
- fine/coarse history reconciliation;
- archaeology causal provenance.

## 15. Authority / fidelity map

| Surface | Current authority | Evidence/fidelity | Promotion status |
|---|---|---|---|
| Current P6 positive civilization input | none | upstream fail-closed | **BLOCKED** |
| Synthetic upstream fixtures | `SYNTHETIC_TEST_ONLY` | test/conformance only | research allowed |
| Exact population/resource reconciliation | research formal | `FORMAL` | candidate formal invariant |
| Deterministic addressing / replay roots | research formal | `FORMAL` | candidate formal invariant; must be ported to P2/P4 formats |
| Demographic architecture | research | `EMPIRICALLY_INSPIRED` | calibration required |
| Gravity interaction | research | `EMPIRICALLY_INSPIRED`, scenario only | no canonical coefficients |
| Settlement scoring | research | `HYPOTHESIS` | no canonical weights |
| Innovation diffusion score | research | `EMPIRICALLY_INSPIRED`, scenario only | no canonical thresholds |
| Institutions/factions | research schema | mixed | transition semantics unresolved |
| Culture/language | research | `GENERATIVE_FICTION` | presentation/synthetic only until narrowly validated |
| Conflict/collapse | conceptual only | disputed/contextual | no predictive law frozen |
| Archaeology causal linkage | research formal/provenance | `FORMAL` linkage, uncertain preservation | linkage candidate; preservation model missing |
| P4 mutable history | P4 canonical | frozen upstream authority | must be reused, never redefined |

## 16. Convergence conditions

WV-D may enter `FULL_ISOLATED_LANE` only after:

1. Prompt 0 publishes exact Wave V SHA/tree.
2. WV-D rebaselines on exactly that base.
3. Ownership manifest authorizes lane-owned files/modules.
4. Upstream P5/P6 successor contracts expose promotion-ready environment/life/population/resource inputs or WV-D remains synthetic-only.
5. A future civilization transition descriptor is reviewed against P4.
6. Scientific calibration and uncertainty are separated from scenario parameters.

Until then, this branch is a research candidate, not a production candidate.
