# OFU Local AI & Ultimate Complexity — Successor Roadmap

**Status:** ACCEPTED AS LONG-RANGE DIRECTION / RESERVED POST-v1  
**Planning authority:** PLANNING_METADATA_ONLY  
**Source proposal:** `OFU-AI-ULTIMATE-SPEC`, version `1.0.0-draft`, reviewed 2026-09-06  
**Current implementation authority:** none beyond explicitly authorized research/feasibility work  
**Does this modify frozen P0-P6 or current v1 semantics?** No.

## 1. Purpose

This document reconciles the founder proposal for local AI and maximum coherent systemic depth with the current One File Universe architecture and roadmap governance.

It deliberately does **not** activate a new shipping requirement for v1.0.0. The current v1 critical path remains continuous viewport-first exploration, visual/surface maturity, deterministic/persistence integrity, resource bounds, accessibility/device evidence and exact-head release certification.

The proposal is adopted as a **successor program** whose architecture can be prepared without allowing it to distract from or mask unresolved founder-visible v1 defects.

## 2. Overall assessment

The proposal is strongly aligned with OFU in five important ways:

1. AI is treated as a governed consumer/proposer, never as canonical scientific authority.
2. The deterministic OFU core remains the source of world identity, scientific/model state, traversal semantics, event admission and persistence.
3. Offline/local-first and the non-AI edition remain first-class product properties.
4. The proposed adaptive-resolution principle matches OFU's existing sparse addressing, bounded working-set and REFINE/PROJECT/RECONCILE architecture.
5. The ultimate-complexity goal is defined as coherent causal depth rather than brute-force simulation of every particle or every individual.

The proposal therefore belongs in OFU's future architecture, but several details are converted from proposed requirements into **feasibility hypotheses** until measured.

## 3. Adopted invariants

The following are accepted as durable design direction for any future AI-enabled OFU edition.

### AI-INV-001 — No AI canonical authorship

Generated model output MUST NOT directly create, rewrite or promote `CANONICAL_PROVEN` state.

### AI-INV-002 — Unknown remains unknown

`UNKNOWN`, `UNSUPPORTED`, `INSUFFICIENT_ENVIRONMENT`, missing evidence and explicit absence states MUST retain their original meaning. An AI explanation may describe them; it may not upgrade them.

### AI-INV-003 — Typed gateway only

No generated natural-language text is executable. Every AI-requested OFU operation must pass through a typed, bounded, allowlisted gateway with schema, capability, authority and budget validation.

### AI-INV-004 — Deterministic OFU owns execution and consequences

AI may interpret language or propose an action. OFU tools produce query results. OFU transition/admission systems decide whether a state-changing proposal is valid and what its deterministic consequences are.

### AI-INV-005 — Authority classes are categories, not confidence rankings

`CANONICAL_PROVEN`, `DERIVED`, `MODEL_DERIVED_SIMULATION`, `PRESENTATION_ONLY` and `MEASURED_RUNTIME_EVIDENCE` remain the repository's existing authority classes. They MUST NOT be presented as an ordinal probability/confidence scale.

### AI-INV-006 — Evidence, fidelity and uncertainty remain source-owned

AI factual explanations must retain source IDs, authority, fidelity, assumptions, limitations and source-provided uncertainty where available. The language model MUST NOT invent a scientific `confidence_ppm` merely because it generated a sentence.

### AI-INV-007 — AI text is not a determinism oracle

Cross-browser/GPU byte-identical language generation is **not** required and must not become canonical meaning. Determinism remains required for OFU tools, canonical/model reducers where declared, event admission, save/replay and source-derived evidence. If an AI proposal affects model-derived or canonical history, the admitted structured proposal/event becomes the replay input; raw generative prose is never required to reconstruct world state.

### AI-INV-008 — Deterministic fallback

Core OFU simulation and exploration must remain usable and progress without AI. AI enriches interpretation, navigation convenience, dialogue and bounded proposals; it is not a liveness dependency.

### AI-INV-009 — Standard edition remains first-class

The long-range product target retains a fully functional non-AI standalone artifact derived from the same deterministic core as any AI edition.

### AI-INV-010 — In-universe text is untrusted data

Civilization text, save labels, NPC dialogue and other generated/imported strings cannot redefine system policy, tool schemas, prompts, authority or executable behavior.

## 4. Accepted but conditional product direction

### Dual edition target

The preferred successor topology remains:

```text
shared deterministic certified core
            |
      deterministic build
       /             \
OFU_STANDARD       OFU_AI
(no local SLM)   (+ local cognition)
```

Target artifact names may remain `One_File_Universe.html` and `One_File_Universe-AI.html`, but versioning and official release naming are intentionally unassigned until feasibility evidence exists.

### First AI product

The first shipping AI capability, if feasibility passes, should be a **Local Scientist** rather than NPCs or autonomous civilization agents.

Initial role:
- explain current OFU evidence and limitations;
- inspect/compare/search through existing typed providers;
- translate natural-language navigation into public OFU traversal operations;
- expose evidence/source authority to the user;
- never mutate scientific truth.

This maximizes usefulness while minimizing the new trust surface.

## 5. Proposal details converted to feasibility hypotheses

### Model parameter count

The proposed `100M-400M`, preferred `120M-200M`, is a useful experimental envelope, not a normative requirement. A 4-bit 120M-200M weight payload is roughly 60-100 MB before tokenizer/runtime/container overhead; 300M-500M is roughly 150-250 MB before overhead. Startup amplification, KV/cache memory and backend allocations can dominate raw weight size.

**Decision:** select model class from measured task success, startup time, memory, artifact size and device coverage. Context compilation/tool reliability must be optimized before parameter count grows.

### Embedded weights

Embedding weights inside one HTML remains the strict standalone target, but it is **conditional on AI-F0 feasibility**. The project must measure direct `file://` behavior, parse/decode cost, peak heap/GPU residency, browser limits, save coexistence and reproducible build impact before making this a release invariant.

### Backend policy

WebGPU cannot be the required baseline for the AI edition. The AI runtime must use capability detection and an evidence-backed backend policy. WASM/CPU portability and graceful AI-unavailable behavior are mandatory feasibility concerns; WebGPU or future accelerators are optional enhanced paths.

### AI determinism metrics

`same seed + same deterministic OFU query -> same OFU result` remains required where the underlying contract is deterministic.

`same prompt -> byte-identical AI prose` is **not** a release invariant.

### Evidence UI

Factual AI answers should expose claim-to-source mapping. The evidence object should contain stable source references, authority/fidelity and explicit limitations. Model self-confidence is not accepted as scientific evidence.

## 6. Activation gates

The successor AI program is intentionally blocked from becoming a shipping priority until these v1 gates are satisfied.

### V1-GATE-A — Founder experience architecture

Required before AI becomes product priority:
- primary universe/galaxy presentation is no longer grid-driven;
- macro/system exploration is genuinely spatial and viewport-first;
- camera/pinch/wheel/keyboard traversal feels continuous across semantic scale changes;
- planet approach/descent preserves identity and context;
- surface exploration is visibly embodied rather than an empty/schematic endpoint;
- life/civilization manifestations are visually present only when supported and remain authority-honest.

### V1-GATE-B — Product and certification stability

Required before AI shipping integration:
- exact-head v1 certification is green;
- deterministic source reproduction is green;
- no unresolved P0/P1 founder-visible journey blocker;
- long-soak/resource/persistence evidence is acceptable;
- accessibility and required browser matrix are passing.

### V1-GATE-C — Device baseline

Physical-device testing is not required to begin read-only AI feasibility research, but **an official OFU_AI release cannot be considered mature without real-device memory/performance/touch evidence** on its supported device classes.

## 7. Successor AI phases

### AI-F0 — Local inference feasibility

**State:** RESERVED / research may begin only when it cannot destabilize current v1 convergence.

Deliverables:
- benchmark candidate runtimes/backends under direct-file/offline conditions;
- benchmark multiple compact model classes rather than preselecting one by parameter prestige;
- embedded tokenizer/runtime/model prototype;
- startup, peak memory, first-token latency and sustained generation measurements;
- AI-unavailable fallback;
- no product navigation or state mutation yet.

Exit gate:
- at least one configuration is demonstrably usable on the declared target matrix without weakening OFU_STANDARD;
- unsupported platforms fail visibly and safely;
- artifact size/startup/memory are explicitly classified rather than hidden.

### AI-F1 — Cognition context + gateway

Deliverables:
- `v1.cognition.context` derived context compiler;
- typed tool proposal contract;
- minimal allowlist over existing `INSPECT`, `DISCOVER`, `TRAVEL` operations;
- authority/fidelity/source propagation;
- hard token/tool/retry/operation budgets;
- prompt-injection and malformed-output tests.

Exit gate:
- zero direct generated-token-to-state paths;
- 100% of executed tool calls have passed schema/capability/budget validation;
- unsupported/unknown preservation corpus passes.

### AI-F2 — Local Scientist

Deliverables:
- contextual questions such as "what is this?", "why?", "what is uncertain?";
- evidence-grounded explanation;
- world comparison/search;
- natural-language navigation through the same public traversal operations used by the ordinary product;
- machine-readable claim/source evidence drawer.

Exit gate:
- core journey remains fully available without AI;
- factual answer evidence coverage is complete for the defined test corpus;
- no factual answer silently treats pretrained model memory as evidence about a generated OFU entity.

### AI-F3 — Natural-language control hardening

Deliverables:
- broader navigation/action interpretation;
- ambiguity handling only where deterministic targets genuinely remain ambiguous;
- accessibility parity with ordinary controls.

Exit gate:
- no hidden teleport/mutation route;
- navigation identity/context matches ordinary traversal semantics.

### AI-F4 — NPC dialogue and bounded knowledge

**Dependency:** mature civilization/individual/history state.

Dialogue may use local/personal/cultural knowledge only. Dialogue itself is presentation/model output and does not become world fact.

### AI-F5 — Structured persistent memory

**Dependency:** AI-F4 + P4-compatible successor memory contract.

Only admitted structured memory events persist. Lifetime raw chat logs are not canonical reconstruction inputs.

### AI-F6 — Bounded agent proposals

**Dependency:** mature deterministic/model-derived agent action/consequence systems.

AI may propose. Deterministic admission and simulation own feasibility, costs, probability model where applicable, transfers, consequences and committed history. A deterministic non-AI policy remains available.

### AI-F7 — Cultural/historical narration

Generated chronicles, myths, letters, speeches and summaries are linked to structured source events/facts and retain `MODEL_DERIVED_SIMULATION` or `PRESENTATION_ONLY` authority as appropriate. Narration never fabricates a historical event into existence.

## 8. Ultimate Complexity integration with the existing frontier

The proposal's U1-U9 sequence is **not added as a duplicate linear roadmap**. It is mapped onto the existing Forward Frontier DAG.

| Proposal target | Existing OFU frontier owner | Disposition |
|---|---|---|
| U1 Certified Living Universe Core | F-EXP + F-VIS + F-UX + F-ENGINE + F-CERT | current v1 critical path |
| U2 Deep Planetary Causality | F-PLANET + F-STATE + F-ASTRO | successor scientific/model program |
| U3 Deep Ecology & Evolution | F-LIFE + F-PLANET + F-HISTORY | successor model/science program |
| U4 Civilizations with Consequences | F-CIV + F-HISTORY + F-STATE | successor causal society program |
| U5 Persistent Individuals | F-CIV + F-HISTORY + F-STATE | future explicit individual-refinement subprogram |
| U6 Material Continuity | F-MICRO + F-MATTER + F-EXP | existing frontier reservation |
| U7 Causal Cross-Domain Engine | F-GOV + F-STATE + mature domain workstreams | future cross-domain contract layer; do not build before domain seams stabilize |
| U8 Self-Consistent Historical Universe | F-HISTORY + F-ENGINE + F-STATE + domain workstreams | long-range convergence target |
| U9 Computational Universe Engine | all promoted/selected frontier workstreams + future F-AI | ultimate convergence outcome, not a single implementation lane |

This mapping avoids duplicated ownership and prevents a second roadmap from competing with the current DAG.

## 9. Adaptive-resolution policy

The proposal's strongest long-range systems principle is adopted unchanged in spirit:

```text
infinite semantic address space
+ deterministic generators/providers
+ stable identity
+ committed history/sparse exceptions
+ bounded active working set
```

Future aggregate-to-individual, organism-to-cell and material-to-atomic refinement must preserve identity, inherited commitments, history and explicit authority through `REFINE`, `PROJECT` and `RECONCILE`. Eviction may remove inactive materialization, never durable identity/history/required summary state.

## 10. Resource and release policy for OFU_AI

Every AI subsystem must declare explicit budgets for:
- embedded model/runtime bytes;
- decoded/peak heap bytes;
- GPU bytes when used;
- context tokens;
- output tokens;
- tool calls;
- retries/deliberation loops;
- queues/workers;
- initialization and first-token latency.

The proposal's LIGHT/STANDARD/EXPERIMENTAL artifact size classes remain useful **planning bands**, not release commitments. Actual limits are set only after AI-F0 measurements.

An AI edition must not weaken:
- direct-file/offline operation for the declared supported profile;
- reproducible build expectations for artifact bytes;
- save integrity;
- canonical/model authority boundaries;
- non-AI accessibility;
- standard-edition capability.

## 11. Quality gates

The following are accepted future AI release goals, interpreted narrowly and testably:

- canonical mutations directly authored by AI: `0`;
- untyped executable AI paths: `0`;
- unsupported fact upgrades in defined adversarial corpus: `0`;
- factual claim evidence-link coverage in defined Local Scientist corpus: `100%`;
- deterministic fallback availability for core simulation: `100%`;
- AI text required for canonical/model state reconstruction: `0`;
- provider/authority collisions: `0`;
- cross-scale identity mismatches caused by AI navigation: `0`.

Targets such as navigation intent accuracy or token throughput are benchmark targets, not semantic truth gates; they will be set from measured candidate hardware.

## 12. Explicit non-goals

Near-term OFU development must not:
- insert an LLM to compensate for weak primary navigation or rendering;
- make cloud inference mandatory;
- let AI replace deterministic world generators/reducers;
- make AI omniscient about universe state;
- persist generated prose as history without structured admission;
- simulate every individual/molecule/atom continuously;
- claim exact physical, climate, evolutionary, molecular or quantum simulation without bounded verified models;
- grow the model merely to increase benchmark prestige;
- delay v1 founder experience closure in order to begin NPC/agent development.

## 13. Activation rule

This document reserves architecture and sequencing. It does **not** activate AI implementation on the current v1 convergence branch.

The next product-development priority remains the founder-visible continuous-reality gap. AI-F0 can be authorized as a separate, read-only feasibility/research lane once its work no longer competes with that critical path. AI-F1+ require an explicit activation decision after the applicable gates above are evidenced.

The source proposal remains valuable project memory, but completion claims must follow the repository rule: **no capability is complete without executable evidence and an appropriate release gate.**
