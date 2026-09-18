# One File Universe — Parallel Chat Mini-Prompt Library v4

`AUTHORITY=CONVENIENCE_INVOCATION_DOCUMENT_ONLY`  
`MASTER_OVERRIDES_THIS_DOCUMENT=true`  
`MASTER_HEAD_AT_GENERATION=c2cab6d6e914b918432432fdc69825e0a1000509`  
`MASTER_SCHEMA_VERSION=4`

Questa libreria contiene gli invocation envelope da copiare in chat ChatGPT separate per i canonical `PROMPT_ID` del master post-M0. Non è una roadmap e non autorizza lane: la fonte della verità resta il master v4 live. Ogni chat deve risolvere il proprio prompt dal master, caricare i source prompt completi e reautenticare repository/epoch/base/gate.

Master canonico: `docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

## Quick index

| PROMPT_ID | Status | Mode | Launch phase | Track | Section |
|---|---|---|---|---|---|
| `CTRL-WAVE0` | CONTROL_READY | WRITE_CONTROL | START_HERE | CONTROL | A |
| `CTRL-WAVE-EPOCH` | BLOCKED | WRITE_CONTROL | DO_NOT_LAUNCH_YET | CONTROL | E |
| `CTRL-CONVERGENCE` | BLOCKED | WRITE_CONTROL | DO_NOT_LAUNCH_YET | CONTROL | E |
| `PROD-W1-CONTRACTS` | READY_WRITER | WRITE_PRODUCT | AFTER_CTRL_WAVE0 | PRODUCT | B |
| `QOBS-CROSS-PROGRAM` | READY_WRITER | WRITE_PRODUCT | AFTER_CTRL_WAVE0 | PRODUCT | B |
| `IND-GOV-A` | READY_WRITER | WRITE | AFTER_CTRL_WAVE0 | INDUSTRIALIZATION | B |
| `IND-CONF-A` | READY_WRITER | WRITE | AFTER_CTRL_WAVE0 | INDUSTRIALIZATION | B |
| `IND-LIC-A` | READY_WRITER | WRITE | AFTER_CTRL_WAVE0 | INDUSTRIALIZATION | B |
| `IND-BRIDGE-A` | READY_WRITER | WRITE | AFTER_CTRL_WAVE0 | INDUSTRIALIZATION | B |
| `IND-SEC-A` | READY_READONLY_AUDIT | READ_ONLY_AUDIT | MAY_RUN_READ_ONLY | INDUSTRIALIZATION | C |
| `ARCH-RUNTIME` | READY_READONLY_AUDIT | READ_ONLY_AUDIT | MAY_RUN_READ_ONLY | ARCHITECTURE_RESEARCH | C |
| `ARCH-PERSIST` | READY_READONLY_AUDIT | READ_ONLY_AUDIT | MAY_RUN_READ_ONLY | ARCHITECTURE_RESEARCH | C |
| `ARCH-PROVIDER` | READY_READONLY_AUDIT | READ_ONLY_AUDIT | MAY_RUN_READ_ONLY | ARCHITECTURE_RESEARCH | C |
| `ARCH-UE` | READY_READONLY_AUDIT | READ_ONLY_AUDIT | MAY_RUN_READ_ONLY | ARCHITECTURE_RESEARCH | C |
| `ARCH-WASM` | READY_READONLY_AUDIT | READ_ONLY_AUDIT | MAY_RUN_READ_ONLY | ARCHITECTURE_RESEARCH | C |
| `AUDIT-DETERMINISM` | READY_READONLY_AUDIT | READ_ONLY_AUDIT | MAY_RUN_READ_ONLY | AUDIT | C |
| `AUDIT-AUTHORITY` | READY_READONLY_AUDIT | READ_ONLY_AUDIT | MAY_RUN_READ_ONLY | AUDIT | C |
| `AUDIT-SCIENCE` | READY_READONLY_AUDIT | READ_ONLY_AUDIT | MAY_RUN_READ_ONLY | AUDIT | C |
| `AUDIT-SECURITY` | READY_READONLY_AUDIT | READ_ONLY_AUDIT | MAY_RUN_READ_ONLY | AUDIT | C |
| `AUDIT-PERFORMANCE` | READY_READONLY_AUDIT | READ_ONLY_AUDIT | MAY_RUN_READ_ONLY | AUDIT | C |
| `AUDIT-PORTABILITY` | READY_READONLY_AUDIT | READ_ONLY_AUDIT | MAY_RUN_READ_ONLY | AUDIT | C |
| `AUDIT-ABI` | READY_READONLY_AUDIT | READ_ONLY_AUDIT | MAY_RUN_READ_ONLY | AUDIT | C |
| `AUDIT-PERSISTENCE` | READY_READONLY_AUDIT | READ_ONLY_AUDIT | MAY_RUN_READ_ONLY | AUDIT | C |
| `AUDIT-PRODUCT` | READY_READONLY_AUDIT | READ_ONLY_AUDIT | MAY_RUN_READ_ONLY | AUDIT | C |
| `PROD-W1-PRODUCT-DEPTH` | BLOCKED | WRITE_PRODUCT | DO_NOT_LAUNCH_YET | PRODUCT | D |
| `PROD-W1-SCI-FP` | BLOCKED | WRITE_PRODUCT | DO_NOT_LAUNCH_YET | PRODUCT | D |
| `PROD-W1-ATLAS-CORE` | BLOCKED | WRITE_PRODUCT | DO_NOT_LAUNCH_YET | PRODUCT | D |
| `PROD-W1-SCI-WHY` | BLOCKED | WRITE_PRODUCT | DO_NOT_LAUNCH_YET | PRODUCT | D |
| `PROD-W1-INSTRUMENTS` | BLOCKED | WRITE_PRODUCT | DO_NOT_LAUNCH_YET | PRODUCT | D |
| `PROD-W2-TIME` | BLOCKED | WRITE_PRODUCT | DO_NOT_LAUNCH_YET | PRODUCT | D |
| `PROD-W2-SEARCH` | BLOCKED | WRITE_PRODUCT | DO_NOT_LAUNCH_YET | PRODUCT | D |
| `PROD-W2-COMPARE` | BLOCKED | WRITE_PRODUCT | DO_NOT_LAUNCH_YET | PRODUCT | D |
| `PROD-W2-DIRECTOR` | BLOCKED | WRITE_PRODUCT | DO_NOT_LAUNCH_YET | PRODUCT | D |
| `EVID-PHYSICAL-DEVICE` | BLOCKED | READ_ONLY_AUDIT | DO_NOT_LAUNCH_YET | PRODUCT_EVIDENCE | D |
| `PRODUCT-MACRO` | BLOCKED | WRITE_PRODUCT | DO_NOT_LAUNCH_YET | PRODUCT | D |
| `PRODUCT-HUMAN` | BLOCKED | WRITE_PRODUCT | DO_NOT_LAUNCH_YET | PRODUCT | D |
| `PRODUCT-VISUAL-CONTINUITY` | BLOCKED | WRITE_PRODUCT | DO_NOT_LAUNCH_YET | PRODUCT | D |
| `PRODUCT-AUDIO` | BLOCKED | WRITE_PRODUCT | DO_NOT_LAUNCH_YET | PRODUCT | D |
| `GATE-G0A-AUDIT` | BLOCKED | READ_ONLY_AUDIT | DO_NOT_LAUNCH_YET | AUDIT | D |
| `IND-JS-HEADLESS` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | INDUSTRIALIZATION | D |
| `IND-SEC-B` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | INDUSTRIALIZATION | D |
| `IND-EXT-CONSUMER` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | INDUSTRIALIZATION | D |
| `GATE-G0B-AUDIT` | BLOCKED | READ_ONLY_AUDIT | DO_NOT_LAUNCH_YET | AUDIT | D |
| `IND-NATIVE-P2` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | INDUSTRIALIZATION | D |
| `IND-CABI-MICROHOST` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | INDUSTRIALIZATION | D |
| `GATE-G1-AUDIT` | BLOCKED | READ_ONLY_AUDIT | DO_NOT_LAUNCH_YET | AUDIT | D |
| `CORE-CBV` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | CORE | D |
| `CORE-NUMERIC` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | CORE | D |
| `CORE-MANIFEST` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | CORE | D |
| `CORE-IDENTITY` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | CORE | D |
| `CORE-ADDRESS` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | CORE | D |
| `CORE-DERIVE` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | CORE | D |
| `CORE-AUTHORITY` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | CORE | D |
| `CORE-CABI` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | CORE | D |
| `CORE-WASM` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | CORE | D |
| `CONF-CROSSLANG` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | CORE | D |
| `IND-RUNTIME` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | RUNTIME | D |
| `RUNTIME-QUERY` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | RUNTIME | D |
| `RUNTIME-PROVIDER` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | RUNTIME | D |
| `RUNTIME-SCHEDULER` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | RUNTIME | D |
| `RUNTIME-RESOURCE` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | RUNTIME | D |
| `RUNTIME-CACHE` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | RUNTIME | D |
| `RUNTIME-MATERIALIZATION` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | RUNTIME | D |
| `RUNTIME-TEMPORAL` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | RUNTIME | D |
| `RUNTIME-OBSERVABILITY` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | RUNTIME | D |
| `RUNTIME-CLI` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | RUNTIME | D |
| `RUNTIME-SECURITY` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | RUNTIME | D |
| `IND-PERSIST` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | PERSISTENCE_PROVIDER | D |
| `IND-PROVIDER` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | PERSISTENCE_PROVIDER | D |
| `PERSIST-EVENTLOG` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | PERSISTENCE_PROVIDER | D |
| `PERSIST-CHECKPOINT` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | PERSISTENCE_PROVIDER | D |
| `PERSIST-ARCHIVE` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | PERSISTENCE_PROVIDER | D |
| `PERSIST-MIGRATION` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | PERSISTENCE_PROVIDER | D |
| `PERSIST-CRASH` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | PERSISTENCE_PROVIDER | D |
| `PROVIDER-ABI` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | PERSISTENCE_PROVIDER | D |
| `DOMAIN-PILOT` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | PERSISTENCE_PROVIDER | D |
| `IND-WASM` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | ADAPTER | D |
| `IND-UE` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | ADAPTER | D |
| `IND-UNITY` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | ADAPTER | D |
| `IND-GODOT` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | ADAPTER | D |
| `IND-STD` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | STANDARD_SDK | D |
| `IND-SDK` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | STANDARD_SDK | D |
| `STD-EXTERNAL-CONFORMANCE` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | STANDARD_SDK | D |
| `SDK-DOCS` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | STANDARD_SDK | D |
| `SDK-PACKAGING` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | STANDARD_SDK | D |
| `SDK-RELEASE-ENGINEERING` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | STANDARD_SDK | D |
| `PROD-W3-LIVING-HISTORY` | BLOCKED | WRITE_PRODUCT | DO_NOT_LAUNCH_YET | DOMAIN_RESEARCH | D |
| `DOMAIN-ASTRO` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | DOMAIN_RESEARCH | D |
| `DOMAIN-PLANET` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | DOMAIN_RESEARCH | D |
| `DOMAIN-TERRAIN` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | DOMAIN_RESEARCH | D |
| `DOMAIN-ATMOS` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | DOMAIN_RESEARCH | D |
| `DOMAIN-HYDRO` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | DOMAIN_RESEARCH | D |
| `DOMAIN-MATTER` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | DOMAIN_RESEARCH | D |
| `DOMAIN-BIO` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | DOMAIN_RESEARCH | D |
| `DOMAIN-HISTORY` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | DOMAIN_RESEARCH | D |
| `DOMAIN-CIV` | BLOCKED | WRITE | DO_NOT_LAUNCH_YET | DOMAIN_RESEARCH | D |

# Section A — Control Plane

**START_HERE.** Usare `CTRL-WAVE0` per primo quando non esiste un active Wave0 epoch/control state valido. Non implementa le child lanes.

<!-- MINI_PROMPT_ID:CTRL-WAVE0 -->
## CTRL-WAVE0

**Status:** CONTROL_READY  
**Mode:** WRITE_CONTROL  
**Program track:** CONTROL  
**Dependencies / unlock requirements:** `M0_HISTORICAL`  
**Upstream gate:** `M0_HISTORICAL`  
**Semantic ownership:** CONTROL_PLANE  
**Source prompt refs:** `p286:CTRL-IW0-EPOCH`, `v3:CTRL-WAVE0`  
**When to launch:** START_HERE se manca un active Wave0 epoch/control state valido.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=CTRL-WAVE0` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

Agisci solo come control plane; non implementare personalmente le child implementation lanes.

Specializzazione: Create and maintain the Wave-0 convergence/control plane from the verified active R6 base; establish immutable lane ownership, dependency/gate status and safe merge ordering; never implement another lane's mission merely to accelerate it.

Guardia v4: Non implementare child lanes: materializza/aggiorna solo control epoch, base, ownership, control state e runnable queue.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

# Section B — Initial Ready Writers

Queste lane sono `READY_WRITER`, ma la scrittura parte solo dopo che `CTRL-WAVE0` ha materializzato epoch/base/ownership e le mantiene runnable.

<!-- MINI_PROMPT_ID:PROD-W1-CONTRACTS -->
## PROD-W1-CONTRACTS

**Status:** READY_WRITER  
**Mode:** WRITE_PRODUCT  
**Program track:** PRODUCT  
**Dependencies / unlock requirements:** `M0_HISTORICAL`  
**Upstream gate:** `M0_HISTORICAL`  
**Semantic ownership:** PRODUCT_CONTRACTS  
**Source prompt refs:** `v3:PROD-W1-CONTRACTS`, `p275:R6-W1-CONTRACTS`  
**When to launch:** Dopo CTRL-WAVE0, solo se epoch/base/ownership sono materializzati e la lane resta runnable.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=PROD-W1-CONTRACTS` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

Prima di scrivere richiedi epoch/base/ownership validi dal control plane: READY_WRITER non autorizza un head ipotizzato.

Specializzazione: Freeze the smallest additive contracts that allow Scientific Fingerprint/provenance and Atlas/saved-observation work to proceed independently without letting either lane invent competing authority or snapshot semantics.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:QOBS-CROSS-PROGRAM -->
## QOBS-CROSS-PROGRAM

**Status:** READY_WRITER  
**Mode:** WRITE_PRODUCT  
**Program track:** PRODUCT  
**Dependencies / unlock requirements:** `M0_HISTORICAL`  
**Upstream gate:** `M0_HISTORICAL`  
**Semantic ownership:** QUALITY_OBSERVATORY  
**Source prompt refs:** `p286:PRODUCT-QUALITY`, `v3:QOBS-CROSS-PROGRAM`, `p275:R6-W1-QOBS`  
**When to launch:** Dopo CTRL-WAVE0, solo se epoch/base/ownership sono materializzati e la lane resta runnable.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=QOBS-CROSS-PROGRAM` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

Prima di scrivere richiedi epoch/base/ownership validi dal control plane: READY_WRITER non autorizza un head ipotizzato.

Specializzazione: Evolve the existing Quality Observatory as continuous falsification infrastructure serving both product development and middleware feasibility while remaining observation/evidence tooling rather than universe authority.

Guardia v4: L'evidence dell'Observatory non diventa autorità scientifica né release authority.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:IND-GOV-A -->
## IND-GOV-A

**Status:** READY_WRITER  
**Mode:** WRITE  
**Program track:** INDUSTRIALIZATION  
**Dependencies / unlock requirements:** `M0_HISTORICAL`  
**Upstream gate:** `M0_HISTORICAL`  
**Semantic ownership:** INDUSTRIALIZATION_SPEC  
**Source prompt refs:** `p286:IND-GOV`, `v3:IND-GOV-A`  
**When to launch:** Dopo CTRL-WAVE0, solo se epoch/base/ownership sono materializzati e la lane resta runnable.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=IND-GOV-A` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

Prima di scrivere richiedi epoch/base/ownership validi dal control plane: READY_WRITER non autorizza un head ipotizzato.

Specializzazione: Harvest the smallest implementation-independent specification slice from proven P2/P4 invariants while explicitly classifying runtime, persistence, provenance and multiscale surfaces that are not mature enough to freeze.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:IND-CONF-A -->
## IND-CONF-A

**Status:** READY_WRITER  
**Mode:** WRITE  
**Program track:** INDUSTRIALIZATION  
**Dependencies / unlock requirements:** `M0_HISTORICAL`  
**Upstream gate:** `M0_HISTORICAL`  
**Semantic ownership:** CONFORMANCE_CORPUS  
**Source prompt refs:** `p286:IND-CONF`, `v3:IND-CONF-A`  
**When to launch:** Dopo CTRL-WAVE0, solo se epoch/base/ownership sono materializzati e la lane resta runnable.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=IND-CONF-A` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

Prima di scrivere richiedi epoch/base/ownership validi dal control plane: READY_WRITER non autorizza un head ipotizzato.

Specializzazione: Create a frozen, language-independent positive/malformed/rejection corpus for the minimum P2-first and narrow-P4 slice so future headless/native implementations can be judged against bytes and behavior rather than source similarity.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:IND-LIC-A -->
## IND-LIC-A

**Status:** READY_WRITER  
**Mode:** WRITE  
**Program track:** INDUSTRIALIZATION  
**Dependencies / unlock requirements:** `M0_HISTORICAL`  
**Upstream gate:** `M0_HISTORICAL`  
**Semantic ownership:** LICENSING_DECISION_DOSSIER  
**Source prompt refs:** `p286:IND-LIC`, `v3:IND-LIC-A`  
**When to launch:** Dopo CTRL-WAVE0, solo se epoch/base/ownership sono materializzati e la lane resta runnable.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=IND-LIC-A` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

Prima di scrivere richiedi epoch/base/ownership validi dal control plane: READY_WRITER non autorizza un head ipotizzato.

Specializzazione: Produce a precise decision dossier separating what the current no-license state blocks from what internal feasibility may continue to do, and inventory third-party redistribution, specification, vector, contribution, naming and certification decisions.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:IND-BRIDGE-A -->
## IND-BRIDGE-A

**Status:** READY_WRITER  
**Mode:** WRITE  
**Program track:** INDUSTRIALIZATION  
**Dependencies / unlock requirements:** `M0_HISTORICAL`  
**Upstream gate:** `M0_HISTORICAL`  
**Semantic ownership:** HEADLESS_BRIDGE_DESIGN  
**Source prompt refs:** `p286:IND-BRIDGE`, `v3:IND-BRIDGE-A`  
**When to launch:** Dopo CTRL-WAVE0, solo se epoch/base/ownership sono materializzati e la lane resta runnable.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=IND-BRIDGE-A` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

Prima di scrivere richiedi epoch/base/ownership validi dal control plane: READY_WRITER non autorizza un head ipotizzato.

Specializzazione: Discover, rather than invent prematurely, the smallest useful host-neutral JS headless API by tracing current product/bootstrap/render/runtime coupling and designing a tiny external consumer that would falsify the platform thesis cheaply.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

# Section C — Initial Read-Only / Audit / Architecture Cells

Tutte restano `READ_ONLY_AUDIT` nel modello v4. Le `ARCH-*` sono ricerca architetturale speculativa; le `AUDIT-*` sono audit indipendenti. Nessuna modifica di production source è autorizzata.

<!-- MINI_PROMPT_ID:IND-SEC-A -->
## IND-SEC-A

**Status:** READY_READONLY_AUDIT  
**Mode:** READ_ONLY_AUDIT  
**Program track:** INDUSTRIALIZATION  
**Dependencies / unlock requirements:** `M0_HISTORICAL`  
**Upstream gate:** `M0_HISTORICAL`  
**Semantic ownership:** READ_ONLY / NONE  
**Source prompt refs:** `p286:IND-SEC`, `v3:IND-SEC-A`  
**When to launch:** Può girare in parallelo read-only; se manca un target prerequisite, solo preparatory analysis autorizzata.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=IND-SEC-A` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

Production source è read-only: non trasformare ricerca/audit in implementation WRITE.

Specializzazione: Perform read-only threat research over canonical parsers, addresses, P4 archives/checkpoints, portable save, resource limits and prospective provider/query boundaries; do not create concrete fuzz ownership until IND-GOV-A freezes the attack-surface inventory.

Guardia v4: È la fase security pre-G0A read-only; non eseguire il WRITE hardening di IND-SEC-B.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:ARCH-RUNTIME -->
## ARCH-RUNTIME

**Status:** READY_READONLY_AUDIT  
**Mode:** READ_ONLY_AUDIT  
**Read-only subtype:** speculative architecture research  
**Program track:** ARCHITECTURE_RESEARCH  
**Dependencies / unlock requirements:** `M0_HISTORICAL`  
**Upstream gate:** `M0_HISTORICAL`  
**Semantic ownership:** READ_ONLY / NONE  
**Source prompt refs:** `p286:ARCH-RUNTIME`  
**When to launch:** Può girare in parallelo read-only; se manca un target prerequisite, solo preparatory analysis autorizzata.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=ARCH-RUNTIME` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

Production source è read-only: non trasformare ricerca/audit in implementation WRITE.

Specializzazione: Perform a read-only architecture study for the future headless runtime. Derive the smallest coherent runtime state machine covering create/open/close universe, query admission, provider resolution, task DAG, scheduler/resource reservation, cache/materialization, cancellation, temporal context…

Guardia v4: Ricerca architetturale speculativa: production source read-only, nessuna implementation claim.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:ARCH-PERSIST -->
## ARCH-PERSIST

**Status:** READY_READONLY_AUDIT  
**Mode:** READ_ONLY_AUDIT  
**Read-only subtype:** speculative architecture research  
**Program track:** ARCHITECTURE_RESEARCH  
**Dependencies / unlock requirements:** `M0_HISTORICAL`  
**Upstream gate:** `M0_HISTORICAL`  
**Semantic ownership:** READ_ONLY / NONE  
**Source prompt refs:** `p286:ARCH-PERSIST`  
**When to launch:** Può girare in parallelo read-only; se manca un target prerequisite, solo preparatory analysis autorizzata.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=ARCH-PERSIST` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

Production source è read-only: non trasformare ricerca/audit in implementation WRITE.

Specializzazione: Design, read-only, an industrial single-node persistence architecture that preserves P4 truth. Analyze WAL/ append-log, atomic checkpoints, crash recovery, compaction, archive import/export, migration and backend abstraction. Explicitly distinguish the current P1 JSON portable…

Guardia v4: Ricerca architetturale speculativa: production source read-only, nessuna implementation claim.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:ARCH-PROVIDER -->
## ARCH-PROVIDER

**Status:** READY_READONLY_AUDIT  
**Mode:** READ_ONLY_AUDIT  
**Read-only subtype:** speculative architecture research  
**Program track:** ARCHITECTURE_RESEARCH  
**Dependencies / unlock requirements:** `M0_HISTORICAL`  
**Upstream gate:** `M0_HISTORICAL`  
**Semantic ownership:** READ_ONLY / NONE  
**Source prompt refs:** `p286:ARCH-PROVIDER`  
**When to launch:** Può girare in parallelo read-only; se manca un target prerequisite, solo preparatory analysis autorizzata.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=ARCH-PROVIDER` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

Production source è read-only: non trasformare ricerca/audit in implementation WRITE.

Specializzazione: Reverse-engineer the current PX provider descriptor/registry and propose a host/language-neutral provider ABI capable of query, optional transition proposal, refine/project/reconcile and lifecycle/disposal without weakening authority. Separate metadata that must be canonical from runtime-only…

Guardia v4: Ricerca architetturale speculativa: production source read-only, nessuna implementation claim.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:ARCH-UE -->
## ARCH-UE

**Status:** READY_READONLY_AUDIT  
**Mode:** READ_ONLY_AUDIT  
**Read-only subtype:** speculative architecture research  
**Program track:** ARCHITECTURE_RESEARCH  
**Dependencies / unlock requirements:** `M0_HISTORICAL`  
**Upstream gate:** `M0_HISTORICAL`  
**Semantic ownership:** READ_ONLY / NONE  
**Source prompt refs:** `p286:ARCH-UE`  
**When to launch:** Può girare in parallelo read-only; se manca un target prerequisite, solo preparatory analysis autorizzata.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=ARCH-UE` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

Production source è read-only: non trasformare ricerca/audit in implementation WRITE.

Specializzazione: Research how an eventual Unreal adapter should consume a stable C ABI without letting UObject/Actor identity become canonical identity. Define subsystem ownership, async/task-thread boundary, buffer ownership, world origin/large-world concerns, lifecycle/hot reload, packaging…

Guardia v4: Ricerca architetturale speculativa: production source read-only, nessuna implementation claim.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:ARCH-WASM -->
## ARCH-WASM

**Status:** READY_READONLY_AUDIT  
**Mode:** READ_ONLY_AUDIT  
**Read-only subtype:** speculative architecture research  
**Program track:** ARCHITECTURE_RESEARCH  
**Dependencies / unlock requirements:** `M0_HISTORICAL`  
**Upstream gate:** `M0_HISTORICAL`  
**Semantic ownership:** READ_ONLY / NONE  
**Source prompt refs:** `p286:ARCH-WASM`  
**When to launch:** Può girare in parallelo read-only; se manca un target prerequisite, solo preparatory analysis autorizzata.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=ARCH-WASM` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

Production source è read-only: non trasformare ricerca/audit in implementation WRITE.

Specializzazione: Analyze how a native Core/Runtime compiled to WASM could coexist with strict direct-file/offline single-file packaging. Study startup, binary embedding, memory copies, worker/thread availability, CSP/file-scheme constraints and fallback strategy. Define what must remain…

Guardia v4: Ricerca architetturale speculativa: production source read-only, nessuna implementation claim.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:AUDIT-DETERMINISM -->
## AUDIT-DETERMINISM

**Status:** READY_READONLY_AUDIT  
**Mode:** READ_ONLY_AUDIT  
**Read-only subtype:** independent audit  
**Program track:** AUDIT  
**Dependencies / unlock requirements:** `M0_HISTORICAL`  
**Upstream gate:** `M0_HISTORICAL`  
**Semantic ownership:** READ_ONLY / NONE  
**Source prompt refs:** `p286:AUDIT-DETERMINISM`  
**When to launch:** Può girare in parallelo read-only; se manca un target prerequisite, solo preparatory analysis autorizzata.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=AUDIT-DETERMINISM` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

Production source è read-only: non trasformare ricerca/audit in implementation WRITE.

Specializzazione: Audit the specified target head read-only for hidden non-determinism: iteration/insertion order, wall clock, scheduling, RNG state, float/platform variance, Unicode drift, endian assumptions, cache/order dependence, stale work and host-object identity. Re-run or design…

Guardia v4: Production code è read-only: produrre solo il packet indipendente di evidence/audit.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:AUDIT-AUTHORITY -->
## AUDIT-AUTHORITY

**Status:** READY_READONLY_AUDIT  
**Mode:** READ_ONLY_AUDIT  
**Read-only subtype:** independent audit  
**Program track:** AUDIT  
**Dependencies / unlock requirements:** `M0_HISTORICAL`  
**Upstream gate:** `M0_HISTORICAL`  
**Semantic ownership:** READ_ONLY / NONE  
**Source prompt refs:** `p286:AUDIT-AUTHORITY`  
**When to launch:** Può girare in parallelo read-only; se manca un target prerequisite, solo preparatory analysis autorizzata.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=AUDIT-AUTHORITY` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

Production source è read-only: non trasformare ricerca/audit in implementation WRITE.

Specializzazione: Audit whether any data crosses CANONICALPROVEN, DERIVED, MODELDERIVEDSIMULATION, PRESENTATIONONLY, MEASUREDRUNTIMEEVIDENCE, UNKNOWN or UNSUPPORTED boundaries incorrectly. Trace dependencies through provider descriptors, results, cross-scale operations and UI projections. Flag scientific promotion by registration, cache,…

Guardia v4: Production code è read-only: produrre solo il packet indipendente di evidence/audit.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:AUDIT-SCIENCE -->
## AUDIT-SCIENCE

**Status:** READY_READONLY_AUDIT  
**Mode:** READ_ONLY_AUDIT  
**Read-only subtype:** independent audit  
**Program track:** AUDIT  
**Dependencies / unlock requirements:** `M0_HISTORICAL`  
**Upstream gate:** `M0_HISTORICAL`  
**Semantic ownership:** READ_ONLY / NONE  
**Source prompt refs:** `p286:AUDIT-SCIENCE`  
**When to launch:** Può girare in parallelo read-only; se manca un target prerequisite, solo preparatory analysis autorizzata.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=AUDIT-SCIENCE` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

Production source è read-only: non trasformare ricerca/audit in implementation WRITE.

Specializzazione: Audit scientific/model claims against declared authority, assumptions, units, provenance, uncertainty and applicability. Look especially for deterministic but unjustified physical claims, presentation geometry misread as data, conservation violations and unsupported cross-scale inference. Do…

Guardia v4: Production code è read-only: produrre solo il packet indipendente di evidence/audit.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:AUDIT-SECURITY -->
## AUDIT-SECURITY

**Status:** READY_READONLY_AUDIT  
**Mode:** READ_ONLY_AUDIT  
**Read-only subtype:** independent audit  
**Program track:** AUDIT  
**Dependencies / unlock requirements:** `M0_HISTORICAL`  
**Upstream gate:** `M0_HISTORICAL`  
**Semantic ownership:** READ_ONLY / NONE  
**Source prompt refs:** `p286:AUDIT-SECURITY`  
**When to launch:** Può girare in parallelo read-only; se manca un target prerequisite, solo preparatory analysis autorizzata.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=AUDIT-SECURITY` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

Production source è read-only: non trasformare ricerca/audit in implementation WRITE.

Specializzazione: Attack parsers, archives, FFI boundaries, provider descriptors, resource accounting, cancellation and future network surfaces conceptually and with permitted tests. Search for memory/resource exhaustion, integer and length overflow, normalization aliases, path traversal, prototype/object…

Guardia v4: Production code è read-only: produrre solo il packet indipendente di evidence/audit.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:AUDIT-PERFORMANCE -->
## AUDIT-PERFORMANCE

**Status:** READY_READONLY_AUDIT  
**Mode:** READ_ONLY_AUDIT  
**Read-only subtype:** independent audit  
**Program track:** AUDIT  
**Dependencies / unlock requirements:** `M0_HISTORICAL`  
**Upstream gate:** `M0_HISTORICAL`  
**Semantic ownership:** READ_ONLY / NONE  
**Source prompt refs:** `p286:AUDIT-PERFORMANCE`  
**When to launch:** Può girare in parallelo read-only; se manca un target prerequisite, solo preparatory analysis autorizzata.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=AUDIT-PERFORMANCE` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

Production source è read-only: non trasformare ricerca/audit in implementation WRITE.

Specializzazione: Measure phase-level CPU/GPU/IO/memory/queue/cache behavior appropriate to the target. Separate semantic discovery, provider compute, serialization, scheduling delay, persistence, host adapter and rendering. Report p50/p95/p99/worst cases, cancellation latency, long-soak growth and boundedness. Do not…

Guardia v4: Production code è read-only: produrre solo il packet indipendente di evidence/audit.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:AUDIT-PORTABILITY -->
## AUDIT-PORTABILITY

**Status:** READY_READONLY_AUDIT  
**Mode:** READ_ONLY_AUDIT  
**Read-only subtype:** independent audit  
**Program track:** AUDIT  
**Dependencies / unlock requirements:** `M0_HISTORICAL`  
**Upstream gate:** `M0_HISTORICAL`  
**Semantic ownership:** READ_ONLY / NONE  
**Source prompt refs:** `p286:AUDIT-PORTABILITY`  
**When to launch:** Può girare in parallelo read-only; se manca un target prerequisite, solo preparatory analysis autorizzata.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=AUDIT-PORTABILITY` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

Production source è read-only: non trasformare ricerca/audit in implementation WRITE.

Specializzazione: Audit assumptions that can diverge across x86-64/ARM64, Windows/Linux/macOS/WASM, compilers and host runtimes: endianness, integer widths, alignment, UTF behavior, filesystem/path rules, threading, timers, allocator and FFI conventions. Tie every finding to canonical or…

Guardia v4: Production code è read-only: produrre solo il packet indipendente di evidence/audit.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:AUDIT-ABI -->
## AUDIT-ABI

**Status:** READY_READONLY_AUDIT  
**Mode:** READ_ONLY_AUDIT  
**Read-only subtype:** independent audit  
**Program track:** AUDIT  
**Dependencies / unlock requirements:** `M0_HISTORICAL`  
**Upstream gate:** `M0_HISTORICAL`  
**Semantic ownership:** READ_ONLY / NONE  
**Source prompt refs:** `p286:AUDIT-ABI`  
**When to launch:** Può girare in parallelo read-only; se manca un target prerequisite, solo preparatory analysis autorizzata.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=AUDIT-ABI` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

Production source è read-only: non trasformare ricerca/audit in implementation WRITE.

Specializzazione: Audit C ABI surface for ownership, lifetime, allocator, struct-size/version negotiation, symbol stability, error/panic boundary, callback/thread rules and forward/backward compatibility. Attempt to identify host language assumptions. Produce breaking-change analysis and exact compatibility tests.…

Guardia v4: Production code è read-only: produrre solo il packet indipendente di evidence/audit.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:AUDIT-PERSISTENCE -->
## AUDIT-PERSISTENCE

**Status:** READY_READONLY_AUDIT  
**Mode:** READ_ONLY_AUDIT  
**Read-only subtype:** independent audit  
**Program track:** AUDIT  
**Dependencies / unlock requirements:** `M0_HISTORICAL`  
**Upstream gate:** `M0_HISTORICAL`  
**Semantic ownership:** READ_ONLY / NONE  
**Source prompt refs:** `p286:AUDIT-PERSISTENCE`  
**When to launch:** Può girare in parallelo read-only; se manca un target prerequisite, solo preparatory analysis autorizzata.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=AUDIT-PERSISTENCE` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

Production source è read-only: non trasformare ricerca/audit in implementation WRITE.

Specializzazione: Treat power loss, torn writes, partial fsync, corrupt checkpoints, stale archives, version mismatch and compaction interruption as normal adversarial conditions. Verify replay/checkpoint/history-root equivalence and fail-closed recovery. Produce fault matrix and minimal witnesses…

Guardia v4: Production code è read-only: produrre solo il packet indipendente di evidence/audit.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:AUDIT-PRODUCT -->
## AUDIT-PRODUCT

**Status:** READY_READONLY_AUDIT  
**Mode:** READ_ONLY_AUDIT  
**Read-only subtype:** independent audit  
**Program track:** AUDIT  
**Dependencies / unlock requirements:** `M0_HISTORICAL`  
**Upstream gate:** `M0_HISTORICAL`  
**Semantic ownership:** READ_ONLY / NONE  
**Source prompt refs:** `p286:AUDIT-PRODUCT`  
**When to launch:** Può girare in parallelo read-only; se manca un target prerequisite, solo preparatory analysis autorizzata.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=AUDIT-PRODUCT` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

Production source è read-only: non trasformare ricerca/audit in implementation WRITE.

Specializzazione: Verify industrialization has not degraded the strict single-file/offline reference product, canonical identity/history, selection/picking ownership, cross-scale continuity, accessibility or bounded resources. Use exact-head journeys and existing product tests. Distinguish architectural success from founder-visible…

Guardia v4: Production code è read-only: produrre solo il packet indipendente di evidence/audit.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

# Section D — Future / Blocked Prompts

Tutti i canonical ID qui inventariati sono `BLOCKED`. I due control successors sono inclusi nel conteggio ma il loro unico mini-prompt è in **Section E**, per evitare duplicazioni.

| Blocked control successor | Status | Mini-prompt location |
|---|---|---|
| `CTRL-WAVE-EPOCH` | BLOCKED · DO_NOT_LAUNCH_YET | Section E |
| `CTRL-CONVERGENCE` | BLOCKED · DO_NOT_LAUNCH_YET | Section E |

## D.1 — PRODUCT

<!-- MINI_PROMPT_ID:PROD-W1-PRODUCT-DEPTH -->
## PROD-W1-PRODUCT-DEPTH

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE_PRODUCT  
**Program track:** PRODUCT  
**Dependencies / unlock requirements:** `G-PROD-CONTRACTS`  
**Upstream gate:** `G-PROD-CONTRACTS`  
**Semantic ownership:** LANE_LOCAL:PROD-W1-PRODUCT-DEPTH after gate/epoch  
**Source prompt refs:** `v3:PROD-W1-PRODUCT-DEPTH`, `p275:R6-W1-PRODUCT-DEPTH`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=PROD-W1-PRODUCT-DEPTH` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Increase founder-visible depth, place, differentiation and perceived vastness across multiple worlds and scales without inventing scientific authority, regressing continuity, resource bounds or direct-file/offline behavior.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:PROD-W1-SCI-FP -->
## PROD-W1-SCI-FP

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE_PRODUCT  
**Program track:** PRODUCT  
**Dependencies / unlock requirements:** `G-PROD-CONTRACTS`  
**Upstream gate:** `G-PROD-CONTRACTS`  
**Semantic ownership:** LANE_LOCAL:PROD-W1-SCI-FP after gate/epoch  
**Source prompt refs:** `v3:PROD-W1-SCI-FP`, `p275:R6-W1-SCI-FP`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=PROD-W1-SCI-FP` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Implement a compact deterministic Scientific Fingerprint that links existing governed upstream facts/models to downstream consequences with explicit authority/provenance, without turning explanatory output into new canonical science.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:PROD-W1-ATLAS-CORE -->
## PROD-W1-ATLAS-CORE

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE_PRODUCT  
**Program track:** PRODUCT  
**Dependencies / unlock requirements:** `G-PROD-CONTRACTS`  
**Upstream gate:** `G-PROD-CONTRACTS`  
**Semantic ownership:** LANE_LOCAL:PROD-W1-ATLAS-CORE after gate/epoch  
**Source prompt refs:** `p286:PRODUCT-ATLAS`, `v3:PROD-W1-ATLAS-CORE`, `p275:R6-W1-ATLAS-CORE`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=PROD-W1-ATLAS-CORE` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Persist exact places, observations, snapshots and routes as compact semantic references enabling deterministic return without serializing renderer/camera objects as world truth; reserve fingerprint references but do not block Atlas on full Scientific…

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:PROD-W1-SCI-WHY -->
## PROD-W1-SCI-WHY

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE_PRODUCT  
**Program track:** PRODUCT  
**Dependencies / unlock requirements:** `PROD-W1-SCI-FP`  
**Upstream gate:** dependency-driven / no separate gate recorded  
**Semantic ownership:** LANE_LOCAL:PROD-W1-SCI-WHY after gate/epoch  
**Source prompt refs:** `p286:PRODUCT-SCIENTIST`, `v3:PROD-W1-SCI-WHY`, `p275:R6-W1-SCI-WHY`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=PROD-W1-SCI-WHY` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Expose deterministic typed causal ancestry, assumptions, authority, uncertainty and unsupported edges behind the Scientific Fingerprint; generated prose may render the graph but can never become state authority.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:PROD-W1-INSTRUMENTS -->
## PROD-W1-INSTRUMENTS

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE_PRODUCT  
**Program track:** PRODUCT  
**Dependencies / unlock requirements:** `PROD-W1-SCI-WHY`  
**Upstream gate:** dependency-driven / no separate gate recorded  
**Semantic ownership:** LANE_LOCAL:PROD-W1-INSTRUMENTS after gate/epoch  
**Source prompt refs:** `p286:PRODUCT-SCIENTIST`, `v3:PROD-W1-INSTRUMENTS`, `p275:R6-W1-INSTRUMENTS`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=PROD-W1-INSTRUMENTS` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Add bounded scientific measurement/instrument projections with units, model basis, provenance, uncertainty and authority labels; no naked number may imply more authority than its source model provides.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:PROD-W2-TIME -->
## PROD-W2-TIME

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE_PRODUCT  
**Program track:** PRODUCT  
**Dependencies / unlock requirements:** `PROD-W1-ATLAS-CORE`  
**Upstream gate:** dependency-driven / no separate gate recorded  
**Semantic ownership:** LANE_LOCAL:PROD-W2-TIME after gate/epoch  
**Source prompt refs:** `p286:PRODUCT-TIME`, `v3:PROD-W2-TIME`, `p275:R6-W2-TIME`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=PROD-W2-TIME` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Project existing governed P4/domain time into Atlas/exploration and exact temporal snapshots where supported, without fabricating unsupported historical states.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:PROD-W2-SEARCH -->
## PROD-W2-SEARCH

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE_PRODUCT  
**Program track:** PRODUCT  
**Dependencies / unlock requirements:** `PROD-W1-SCI-FP`, `PROD-W1-ATLAS-CORE`  
**Upstream gate:** dependency-driven / no separate gate recorded  
**Semantic ownership:** LANE_LOCAL:PROD-W2-SEARCH after gate/epoch  
**Source prompt refs:** `v3:PROD-W2-SEARCH`, `p275:R6-W2-SEARCH`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=PROD-W2-SEARCH` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Make vast deterministic address space discoverable through bounded fingerprint-aware sparse search, similarity and explicitly governed interestingness without claiming exhaustive indexing of the universe.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:PROD-W2-COMPARE -->
## PROD-W2-COMPARE

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE_PRODUCT  
**Program track:** PRODUCT  
**Dependencies / unlock requirements:** `PROD-W1-ATLAS-CORE`, `PROD-W1-SCI-WHY`  
**Upstream gate:** dependency-driven / no separate gate recorded  
**Semantic ownership:** LANE_LOCAL:PROD-W2-COMPARE after gate/epoch  
**Source prompt refs:** `v3:PROD-W2-COMPARE`, `p275:R6-W2-COMPARE`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=PROD-W2-COMPARE` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Compare saved observations/places under matched scale/time where possible and explain divergence through typed causal/provenance structures rather than visual difference alone.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:PROD-W2-DIRECTOR -->
## PROD-W2-DIRECTOR

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE_PRODUCT  
**Program track:** PRODUCT  
**Dependencies / unlock requirements:** `PROD-W1-ATLAS-CORE`, `PROD-W1-PRODUCT-DEPTH`  
**Upstream gate:** dependency-driven / no separate gate recorded  
**Semantic ownership:** LANE_LOCAL:PROD-W2-DIRECTOR after gate/epoch  
**Source prompt refs:** `v3:PROD-W2-DIRECTOR`, `p275:R6-W2-DIRECTOR`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=PROD-W2-DIRECTOR` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Add reproducible camera paths, guided scientific journeys and capture workflows over the same authoritative universe/Atlas state without creating a second camera or semantic timeline authority.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:PRODUCT-MACRO -->
## PRODUCT-MACRO

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE_PRODUCT  
**Program track:** PRODUCT  
**Dependencies / unlock requirements:** `G-PROD-CONTRACTS`  
**Upstream gate:** `G-PROD-CONTRACTS`  
**Semantic ownership:** LANE_LOCAL:PRODUCT-MACRO after gate/epoch  
**Source prompt refs:** `p286:PRODUCT-MACRO`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=PRODUCT-MACRO` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Improve perceived cosmic scale/depth and continuous macro materialization on the reference product while preserving authoritative identity, bounded residency and cancellation. Profile before optimizing. Avoid page/scene replacement and color-only diversity. Product work may…

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:PRODUCT-HUMAN -->
## PRODUCT-HUMAN

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE_PRODUCT  
**Program track:** PRODUCT  
**Dependencies / unlock requirements:** `G-PROD-CONTRACTS`  
**Upstream gate:** `G-PROD-CONTRACTS`  
**Semantic ownership:** LANE_LOCAL:PRODUCT-HUMAN after gate/epoch  
**Source prompt refs:** `p286:PRODUCT-HUMAN`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=PRODUCT-HUMAN` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Transform HUMAN into a memorable embodied place using near/mid/far composition, horizon, landmarks, atmosphere, lighting, contextual density and causal world differences. Keep generated context presentation- only unless upstream authority says otherwise. Preserve continuous…

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:PRODUCT-VISUAL-CONTINUITY -->
## PRODUCT-VISUAL-CONTINUITY

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE_PRODUCT  
**Program track:** PRODUCT  
**Dependencies / unlock requirements:** `G-PROD-CONTRACTS`  
**Upstream gate:** `G-PROD-CONTRACTS`  
**Semantic ownership:** LANE_LOCAL:PRODUCT-VISUAL-CONTINUITY after gate/epoch  
**Source prompt refs:** `p286:PRODUCT-VISUAL-CONTINUITY`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=PRODUCT-VISUAL-CONTINUITY` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Make representation handoffs perceptually invisible while retaining the exact same target identity/location. Preserve last complete detailed coverage until replacement is ready, suppress seams/pops, unify exposure/ atmosphere/lighting and test reversal/interruption. Do not confuse…

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:PRODUCT-AUDIO -->
## PRODUCT-AUDIO

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE_PRODUCT  
**Program track:** PRODUCT  
**Dependencies / unlock requirements:** `G-PROD-CONTRACTS`  
**Upstream gate:** `G-PROD-CONTRACTS`  
**Semantic ownership:** LANE_LOCAL:PRODUCT-AUDIO after gate/epoch  
**Source prompt refs:** `p286:PRODUCT-AUDIO`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=PRODUCT-AUDIO` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Implement bounded offline contextual audio/sonification from declared environmental/scientific context. Separate physically motivated sound from representational sonification and label authority accordingly. Audio must not change canonical state, block interaction or require network access.…

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

## D.2 — PRODUCT_EVIDENCE

<!-- MINI_PROMPT_ID:EVID-PHYSICAL-DEVICE -->
## EVID-PHYSICAL-DEVICE

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** READ_ONLY_AUDIT  
**Program track:** PRODUCT_EVIDENCE  
**Dependencies / unlock requirements:** `PROD-W1-PRODUCT-DEPTH`  
**Upstream gate:** dependency-driven / no separate gate recorded  
**Semantic ownership:** READ_ONLY / NONE  
**Source prompt refs:** `v3:EVID-PHYSICAL-DEVICE`, `p275:R6-W1-DEVICE-EVIDENCE`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=EVID-PHYSICAL-DEVICE` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Collect exact-SHA real-device/physical-GPU evidence for claims that hosted CI cannot prove, without modifying product code merely to satisfy an unavailable environment and without blocking ordinary R6 development.

Guardia v4: L'assenza di evidenza fisica resta EXTERNAL_EVIDENCE_LIMITATION, mai PASS/FAIL inventato.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

## D.3 — INDUSTRIALIZATION

<!-- MINI_PROMPT_ID:IND-JS-HEADLESS -->
## IND-JS-HEADLESS

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** INDUSTRIALIZATION  
**Dependencies / unlock requirements:** `G0A_MINIMUM_NORMATIVE_SLICE`  
**Upstream gate:** `G0A_MINIMUM_NORMATIVE_SLICE`  
**Semantic ownership:** HEADLESS_PUBLIC_SEAM  
**Source prompt refs:** `v3:IND-JS-HEADLESS`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=IND-JS-HEADLESS` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Implement the smallest host-neutral headless API in the existing JS language first, reusing authoritative P2/P4 semantics while proving that useful queries do not require DOM, Babylon, canvas, camera or product selection objects.

Guardia v4: Post-G0A e host-neutral: nessuna autorità DOM/Babylon/renderer/camera/product-selection.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:IND-SEC-B -->
## IND-SEC-B

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** INDUSTRIALIZATION  
**Dependencies / unlock requirements:** `G0A_MINIMUM_NORMATIVE_SLICE`  
**Upstream gate:** `G0A_MINIMUM_NORMATIVE_SLICE`  
**Semantic ownership:** LANE_LOCAL:IND-SEC-B after gate/epoch  
**Source prompt refs:** `p286:IND-SEC`, `v3:IND-SEC-B`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=IND-SEC-B` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Turn the accepted protocol/query attack inventory into reproducible hostile-input, parser-bound, depth/size, malformed-version and resource-abuse tests without changing valid semantics.

Guardia v4: È WRITE post-G0A: non attivare senza G0A_MINIMUM_NORMATIVE_SLICE.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:IND-EXT-CONSUMER -->
## IND-EXT-CONSUMER

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** INDUSTRIALIZATION  
**Dependencies / unlock requirements:** `IND-JS-HEADLESS`  
**Upstream gate:** dependency-driven / no separate gate recorded  
**Semantic ownership:** LANE_LOCAL:IND-EXT-CONSUMER after gate/epoch  
**Source prompt refs:** `v3:IND-EXT-CONSUMER`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=IND-EXT-CONSUMER` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Build the smallest deliberately independent consumer using only the candidate public headless seam. It must demonstrate consumer-independent usefulness and be disposable if the thesis fails.

Guardia v4: Il consumer deve usare la public headless seam, non internals o scorciatoie product-only.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:IND-NATIVE-P2 -->
## IND-NATIVE-P2

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** INDUSTRIALIZATION  
**Dependencies / unlock requirements:** `G0B_EXTERNAL_CONSUMER_SEAM_PROOF`  
**Upstream gate:** `G0B_EXTERNAL_CONSUMER_SEAM_PROOF`  
**Semantic ownership:** NATIVE_P2_EXPERIMENT  
**Source prompt refs:** `p286:IND-NATIVE`, `v3:IND-NATIVE-P2`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=IND-NATIVE-P2` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Implement only the smallest frozen P2/Core slice necessary to prove independent byte/digest/rejection parity from the conformance corpus. Do not port the Runtime.

Guardia v4: Native P2 resta strettamente dietro G0B_EXTERNAL_CONSUMER_SEAM_PROOF.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:IND-CABI-MICROHOST -->
## IND-CABI-MICROHOST

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** INDUSTRIALIZATION  
**Dependencies / unlock requirements:** `IND-NATIVE-P2`  
**Upstream gate:** dependency-driven / no separate gate recorded  
**Semantic ownership:** CABI_MICROHOST  
**Source prompt refs:** `v3:IND-CABI-MICROHOST`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=IND-CABI-MICROHOST` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Expose an intentionally tiny stable-C-shaped boundary around the proven native Core solely to test ownership, buffers, errors, version negotiation and host ergonomics. Do not design the final Runtime/provider ABI here.

Guardia v4: Il microhost C ABI segue native P2 parity e non deve anticipare il Runtime.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

## D.4 — AUDIT

<!-- MINI_PROMPT_ID:GATE-G0A-AUDIT -->
## GATE-G0A-AUDIT

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** READ_ONLY_AUDIT  
**Read-only subtype:** independent audit  
**Program track:** AUDIT  
**Dependencies / unlock requirements:** `IND-GOV-A`, `IND-CONF-A`, `IND-BRIDGE-A`  
**Upstream gate:** `G0A_MINIMUM_NORMATIVE_SLICE (audit prerequisite)`  
**Semantic ownership:** READ_ONLY / NONE  
**Source prompt refs:** `v3:GATE-G0A-AUDIT`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=GATE-G0A-AUDIT` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Read-only independent audit that the proposed normative slice is source-backed, the corpus is sufficient for the slice, and the headless seam proposal does not freeze product/runtime accidents. Approve G0A only from evidence;…

Guardia v4: Production code è read-only: produrre solo il packet indipendente di evidence/audit.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:GATE-G0B-AUDIT -->
## GATE-G0B-AUDIT

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** READ_ONLY_AUDIT  
**Read-only subtype:** independent audit  
**Program track:** AUDIT  
**Dependencies / unlock requirements:** `IND-JS-HEADLESS`, `IND-EXT-CONSUMER`, `IND-CONF-A`  
**Upstream gate:** `G0B_EXTERNAL_CONSUMER_SEAM_PROOF (audit prerequisite)`  
**Semantic ownership:** READ_ONLY / NONE  
**Source prompt refs:** `v3:GATE-G0B-AUDIT`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=GATE-G0B-AUDIT` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Read-only audit of dependency closure, usefulness, parity and coupling. Approve G0B only if the consumer is truly independent and the API has not frozen product-specific accidents.

Guardia v4: Production code è read-only: produrre solo il packet indipendente di evidence/audit.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:GATE-G1-AUDIT -->
## GATE-G1-AUDIT

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** READ_ONLY_AUDIT  
**Read-only subtype:** independent audit  
**Program track:** AUDIT  
**Dependencies / unlock requirements:** `IND-NATIVE-P2`, `IND-CABI-MICROHOST`  
**Upstream gate:** `G1_MINIMUM_PLATFORM_PROOF (audit prerequisite)`  
**Semantic ownership:** READ_ONLY / NONE  
**Source prompt refs:** `v3:GATE-G1-AUDIT`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=GATE-G1-AUDIT` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Read-only strategic and technical audit of the Platform Proof Capsule. Verify independent consumer value, cross-language parity, ABI containment, maintenance cost and absence of product-authority leakage. Explicitly allow PLATFORMEXTRACTIONPREMATURE as a successful falsification…

Guardia v4: Production code è read-only: produrre solo il packet indipendente di evidence/audit.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

## D.5 — CORE

<!-- MINI_PROMPT_ID:CORE-CBV -->
## CORE-CBV

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** CORE  
**Dependencies / unlock requirements:** `G1_PASS_CONTINUE`  
**Upstream gate:** `G1_PASS_CONTINUE`  
**Semantic ownership:** LANE_LOCAL:CORE-CBV after gate/epoch  
**Source prompt refs:** `p286:CORE-CBV`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=CORE-CBV` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Implement the frozen OFU-CBV slice in the selected native Core architecture. Preserve exact tags, minimal ULEB128, ZigZag, Unicode/NFC profile, map-key canonical byte order and resource limits. The decoder must reject every non-canonical…

Guardia v4: L'espansione Core/native è post-G1_PASS_CONTINUE; wording legacy IW1 non può bypassarlo.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:CORE-NUMERIC -->
## CORE-NUMERIC

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** CORE  
**Dependencies / unlock requirements:** `G1_PASS_CONTINUE`  
**Upstream gate:** `G1_PASS_CONTINUE`  
**Semantic ownership:** LANE_LOCAL:CORE-NUMERIC after gate/epoch  
**Source prompt refs:** `p286:CORE-NUMERIC`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=CORE-NUMERIC` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Implement checked i64 addition, exact-intermediate fixed multiplication with nearest ties-to-even and u64 integer square root exactly as frozen. Build boundary/property vectors for overflow, negative signs, odd scales and ties. No floating/transcendental semantics…

Guardia v4: L'espansione Core/native è post-G1_PASS_CONTINUE; wording legacy IW1 non può bypassarlo.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:CORE-MANIFEST -->
## CORE-MANIFEST

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** CORE  
**Dependencies / unlock requirements:** `G1_PASS_CONTINUE`  
**Upstream gate:** `G1_PASS_CONTINUE`  
**Semantic ownership:** LANE_LOCAL:CORE-MANIFEST after gate/epoch  
**Source prompt refs:** `p286:CORE-MANIFEST`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=CORE-MANIFEST` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Implement strict Semantic Generator Manifest validation/encoding/hash using the frozen CBV interface. Enforce exact fields, versions and fail-closed unknown/missing schema. Explicitly exclude implementation, browser, renderer, CI and source-commit metadata from semantic identity. Add…

Guardia v4: L'espansione Core/native è post-G1_PASS_CONTINUE; wording legacy IW1 non può bypassarlo.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:CORE-IDENTITY -->
## CORE-IDENTITY

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** CORE  
**Dependencies / unlock requirements:** `G1_PASS_CONTINUE`  
**Upstream gate:** `G1_PASS_CONTINUE`  
**Semantic ownership:** LANE_LOCAL:CORE-IDENTITY after gate/epoch  
**Source prompt refs:** `p286:CORE-IDENTITY`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=CORE-IDENTITY` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Implement Universe Identity and universe-scoped Canonical Entity Identity using the frozen domain-separated SHA-256 descriptors. Test cross-universe non-aliasing and stability under mutable location/context changes. Host pointers, renderer objects, filenames and scheduling must never…

Guardia v4: L'espansione Core/native è post-G1_PASS_CONTINUE; wording legacy IW1 non può bypassarlo.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:CORE-ADDRESS -->
## CORE-ADDRESS

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** CORE  
**Dependencies / unlock requirements:** `G1_PASS_CONTINUE`  
**Upstream gate:** `G1_PASS_CONTINUE`  
**Semantic ownership:** LANE_LOCAL:CORE-ADDRESS after gate/epoch  
**Source prompt refs:** `p286:CORE-ADDRESS`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=CORE-ADDRESS` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Implement Canonical Address v1 parser/builder with OFUA/version prefix, bounded segment count, namespace/u64/ i64/bytes segments, exact big-endian representation, minimal ULEB lengths, frozen text profile and complete size limits. Reject unknown versions/tags/non-NFC/trailing bytes and…

Guardia v4: L'espansione Core/native è post-G1_PASS_CONTINUE; wording legacy IW1 non può bypassarlo.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:CORE-DERIVE -->
## CORE-DERIVE

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** CORE  
**Dependencies / unlock requirements:** `G1_PASS_CONTINUE`  
**Upstream gate:** `G1_PASS_CONTINUE`  
**Semantic ownership:** LANE_LOCAL:CORE-DERIVE after gate/epoch  
**Source prompt refs:** `p286:CORE-DERIVE`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=CORE-DERIVE` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Implement HMAC-SHA-256 addressed derivation with exact message framing and strict arguments. Prove domain, property, address, semantic-manifest and counter separation. Add regression witnesses showing adding an unrelated property does not shift existing property…

Guardia v4: L'espansione Core/native è post-G1_PASS_CONTINUE; wording legacy IW1 non può bypassarlo.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:CORE-AUTHORITY -->
## CORE-AUTHORITY

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** CORE  
**Dependencies / unlock requirements:** `G1_PASS_CONTINUE`  
**Upstream gate:** `G1_PASS_CONTINUE`  
**Semantic ownership:** LANE_LOCAL:CORE-AUTHORITY after gate/epoch  
**Source prompt refs:** `p286:CORE-AUTHORITY`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=CORE-AUTHORITY` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Convert the frozen authority/provenance semantics into Core-neutral data structures and validators without importing browser/provider function identity. Preserve non-escalation rules, sources, assumptions, limitations and evidence requirements. Define explicit UNKNOWN/UNSUPPORTED representation if G0 approved…

Guardia v4: L'espansione Core/native è post-G1_PASS_CONTINUE; wording legacy IW1 non può bypassarlo.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:CORE-CABI -->
## CORE-CABI

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** CORE  
**Dependencies / unlock requirements:** `G1_PASS_CONTINUE`  
**Upstream gate:** `G1_PASS_CONTINUE`  
**Semantic ownership:** LANE_LOCAL:CORE-CABI after gate/epoch  
**Source prompt refs:** `p286:CORE-CABI`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=CORE-CABI` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Design and implement the C ABI v0 candidate around opaque handles/immutable byte buffers with explicit ownership, allocator, error codes, versioned struct sizes and panic/exception containment. The ABI must not expose Rust/C++ internals…

Guardia v4: L'espansione Core/native è post-G1_PASS_CONTINUE; wording legacy IW1 non può bypassarlo.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:CORE-WASM -->
## CORE-WASM

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** CORE  
**Dependencies / unlock requirements:** `G1_PASS_CONTINUE`  
**Upstream gate:** `G1_PASS_CONTINUE`  
**Semantic ownership:** LANE_LOCAL:CORE-WASM after gate/epoch  
**Source prompt refs:** `p286:CORE-WASM`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=CORE-WASM` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Build the Core candidate for WASM without changing canonical algorithms. Measure size/startup/memory and prove the same vector digests as native/JS. Keep browser glue non-canonical. Document direct-file embedding constraints and deterministic behavior with/without…

Guardia v4: L'espansione Core/native è post-G1_PASS_CONTINUE; wording legacy IW1 non può bypassarlo.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:CONF-CROSSLANG -->
## CONF-CROSSLANG

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** CORE  
**Dependencies / unlock requirements:** `G1_PASS_CONTINUE`  
**Upstream gate:** `G1_PASS_CONTINUE`  
**Semantic ownership:** LANE_LOCAL:CONF-CROSSLANG after gate/epoch  
**Source prompt refs:** `p286:CONF-CROSSLANG`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=CONF-CROSSLANG` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Run the same corpus independently through JS, Python and native implementations and compare canonical bytes, digests, values and rejection classes. Add minimization for mismatches. Exercise available OS/architecture/ compiler configurations without changing implementations…

Guardia v4: L'espansione Core/native è post-G1_PASS_CONTINUE; wording legacy IW1 non può bypassarlo.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

## D.6 — RUNTIME

<!-- MINI_PROMPT_ID:IND-RUNTIME -->
## IND-RUNTIME

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** RUNTIME  
**Dependencies / unlock requirements:** `G1_PASS_CONTINUE`  
**Upstream gate:** `G1_PASS_CONTINUE`  
**Semantic ownership:** RUNTIME_CORE  
**Source prompt refs:** `v3:IND-RUNTIME`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=IND-RUNTIME` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Build the smallest host-neutral bounded Runtime whose public semantics have already been discovered by the JS headless seam and external consumer. Language/implementation choice is decided from G1 evidence; do not presume native…

Guardia v4: Runtime extraction resta strettamente dietro G1_PASS_CONTINUE; PLATFORM_EXTRACTION_PREMATURE resta esito valido.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:RUNTIME-QUERY -->
## RUNTIME-QUERY

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** RUNTIME  
**Dependencies / unlock requirements:** `G1_PASS_CONTINUE`  
**Upstream gate:** `G1_PASS_CONTINUE`  
**Semantic ownership:** LANE_LOCAL:RUNTIME-QUERY after gate/epoch  
**Source prompt refs:** `p286:RUNTIME-QUERY`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=RUNTIME-QUERY` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Implement host-neutral async query canonicalization/admission/result status semantics. Inputs include universe, address/entity, temporal context, capability/property, regime/fidelity/resolution, budget and cancellation. Results must expose VALUE/UNKNOWN/UNSUPPORTED/DEFERRED/CANCELLED/BUDGETEXCEEDED/version/input failures plus authority/provenance/digests/usage. No renderer objects or implicit global state.…

Guardia v4: Runtime extraction resta strettamente dietro G1_PASS_CONTINUE; PLATFORM_EXTRACTION_PREMATURE resta esito valido.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:RUNTIME-PROVIDER -->
## RUNTIME-PROVIDER

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** RUNTIME  
**Dependencies / unlock requirements:** `G1_PASS_CONTINUE`  
**Upstream gate:** `G1_PASS_CONTINUE`  
**Semantic ownership:** LANE_LOCAL:RUNTIME-PROVIDER after gate/epoch  
**Source prompt refs:** `p286:RUNTIME-PROVIDER`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=RUNTIME-PROVIDER` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Implement deterministic provider descriptor admission, dependency validation, claim resolution and runtime binding behind the frozen provider metadata contract. Preserve unique claims, canonical-admission gates, authority non-escalation and cycle rejection. Runtime function bindings are…

Guardia v4: Runtime extraction resta strettamente dietro G1_PASS_CONTINUE; PLATFORM_EXTRACTION_PREMATURE resta esito valido.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:RUNTIME-SCHEDULER -->
## RUNTIME-SCHEDULER

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** RUNTIME  
**Dependencies / unlock requirements:** `G1_PASS_CONTINUE`  
**Upstream gate:** `G1_PASS_CONTINUE`  
**Semantic ownership:** LANE_LOCAL:RUNTIME-SCHEDULER after gate/epoch  
**Source prompt refs:** `p286:RUNTIME-SCHEDULER`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=RUNTIME-SCHEDULER` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Extract/implement the headless scheduling policy for task classes, priority, aging/fairness, starvation bounds, backpressure and cancellation. Scheduling may change latency only. Test worker completion permutations, latest-intent/stale rejection where applicable and bounded queues. Do…

Guardia v4: Runtime extraction resta strettamente dietro G1_PASS_CONTINUE; PLATFORM_EXTRACTION_PREMATURE resta esito valido.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:RUNTIME-RESOURCE -->
## RUNTIME-RESOURCE

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** RUNTIME  
**Dependencies / unlock requirements:** `G1_PASS_CONTINUE`  
**Upstream gate:** `G1_PASS_CONTINUE`  
**Semantic ownership:** LANE_LOCAL:RUNTIME-RESOURCE after gate/epoch  
**Source prompt refs:** `p286:RUNTIME-RESOURCE`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=RUNTIME-RESOURCE` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Implement explicit CPU/heap/GPU-estimate/entity/operation/transfer/materialization budgets with reservation, commit/release and hard ceilings. Prevent under-reporting and double release. Resource pressure can reject or defer work but cannot produce a different canonical value for an admitted…

Guardia v4: Runtime extraction resta strettamente dietro G1_PASS_CONTINUE; PLATFORM_EXTRACTION_PREMATURE resta esito valido.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:RUNTIME-CACHE -->
## RUNTIME-CACHE

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** RUNTIME  
**Dependencies / unlock requirements:** `G1_PASS_CONTINUE`  
**Upstream gate:** `G1_PASS_CONTINUE`  
**Semantic ownership:** LANE_LOCAL:RUNTIME-CACHE after gate/epoch  
**Source prompt refs:** `p286:RUNTIME-CACHE`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=RUNTIME-CACHE` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Implement bounded cache behavior keyed only by semantically sufficient identities: provider/version, canonical target, regime/property/fidelity as approved, commitment/history/semantic digests. Prove cache hit/ miss/eviction/rematerialization cannot alter canonical outcomes and that stale history/provider versions do…

Guardia v4: Runtime extraction resta strettamente dietro G1_PASS_CONTINUE; PLATFORM_EXTRACTION_PREMATURE resta esito valido.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:RUNTIME-MATERIALIZATION -->
## RUNTIME-MATERIALIZATION

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** RUNTIME  
**Dependencies / unlock requirements:** `G1_PASS_CONTINUE`  
**Upstream gate:** `G1_PASS_CONTINUE`  
**Semantic ownership:** LANE_LOCAL:RUNTIME-MATERIALIZATION after gate/epoch  
**Source prompt refs:** `p286:RUNTIME-MATERIALIZATION`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=RUNTIME-MATERIALIZATION` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Implement host-neutral materialization planning/execution with explicit dependencies, bounded residency, cancellation, stale-token rejection and complete-result publication. Preserve durable identity separately from resident representation. Test repeated refine/evict/recreate, reverse/cancel and resource pressure.

Guardia v4: Runtime extraction resta strettamente dietro G1_PASS_CONTINUE; PLATFORM_EXTRACTION_PREMATURE resta esito valido.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:RUNTIME-TEMPORAL -->
## RUNTIME-TEMPORAL

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** RUNTIME  
**Dependencies / unlock requirements:** `G1_PASS_CONTINUE`  
**Upstream gate:** `G1_PASS_CONTINUE`  
**Semantic ownership:** LANE_LOCAL:RUNTIME-TEMPORAL after gate/epoch  
**Source prompt refs:** `p286:RUNTIME-TEMPORAL`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=RUNTIME-TEMPORAL` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Adapt P4 event/replay/live-world/checkpoint/archive semantics into headless runtime interfaces without redefining P4 ordering or reducers. Separate historical reconstruction from live monotonic admission. Canonical state mutation must remain transactionally fail-closed. Add query-at-history/frontier tests and…

Guardia v4: Runtime extraction resta strettamente dietro G1_PASS_CONTINUE; PLATFORM_EXTRACTION_PREMATURE resta esito valido.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:RUNTIME-OBSERVABILITY -->
## RUNTIME-OBSERVABILITY

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** RUNTIME  
**Dependencies / unlock requirements:** `G1_PASS_CONTINUE`  
**Upstream gate:** `G1_PASS_CONTINUE`  
**Semantic ownership:** LANE_LOCAL:RUNTIME-OBSERVABILITY after gate/epoch  
**Source prompt refs:** `p286:RUNTIME-OBSERVABILITY`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=RUNTIME-OBSERVABILITY` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Implement non-canonical metrics/tracing for query phases, provider compute, scheduler delay, cache, materialization, persistence hooks, cancellation and resource usage. Instrumentation must not perturb canonical results or become identity material. Define stable diagnostic event…

Guardia v4: Runtime extraction resta strettamente dietro G1_PASS_CONTINUE; PLATFORM_EXTRACTION_PREMATURE resta esito valido.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:RUNTIME-CLI -->
## RUNTIME-CLI

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** RUNTIME  
**Dependencies / unlock requirements:** `G1_PASS_CONTINUE`  
**Upstream gate:** `G1_PASS_CONTINUE`  
**Semantic ownership:** LANE_LOCAL:RUNTIME-CLI after gate/epoch  
**Source prompt refs:** `p286:RUNTIME-CLI`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=RUNTIME-CLI` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Build a minimal headless CLI as an external consumer of the public runtime surface, not an internal bypass. It must create/open a universe, issue at least one meaningful bounded query, print authority/provenance…

Guardia v4: Runtime extraction resta strettamente dietro G1_PASS_CONTINUE; PLATFORM_EXTRACTION_PREMATURE resta esito valido.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:RUNTIME-SECURITY -->
## RUNTIME-SECURITY

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** RUNTIME  
**Dependencies / unlock requirements:** `G1_PASS_CONTINUE`  
**Upstream gate:** `G1_PASS_CONTINUE`  
**Semantic ownership:** LANE_LOCAL:RUNTIME-SECURITY after gate/epoch  
**Source prompt refs:** `p286:RUNTIME-SECURITY`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=RUNTIME-SECURITY` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Convert IW0 threat model into runtime-level abuse tests: query storms, cancellation races, provider budget lies, dependency/pathological graphs, oversized results, stale handles and lifecycle misuse. Harden only within granted paths. Security fixes must…

Guardia v4: Runtime extraction resta strettamente dietro G1_PASS_CONTINUE; PLATFORM_EXTRACTION_PREMATURE resta esito valido.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

## D.7 — PERSISTENCE_PROVIDER

<!-- MINI_PROMPT_ID:IND-PERSIST -->
## IND-PERSIST

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** PERSISTENCE_PROVIDER  
**Dependencies / unlock requirements:** `G2_HEADLESS_RUNTIME_PROOF`  
**Upstream gate:** `G2_HEADLESS_RUNTIME_PROOF`  
**Semantic ownership:** PERSISTENCE_LAYER  
**Source prompt refs:** `v3:IND-PERSIST`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=IND-PERSIST` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Map frozen P4 semantic durability/replay/checkpoint/archive invariants onto a host-neutral storage boundary with crash/restart recovery, migration rejection and no dependence on OFU UI snapshot shapes.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:IND-PROVIDER -->
## IND-PROVIDER

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** PERSISTENCE_PROVIDER  
**Dependencies / unlock requirements:** `G2_HEADLESS_RUNTIME_PROOF`  
**Upstream gate:** `G2_HEADLESS_RUNTIME_PROOF`  
**Semantic ownership:** PROVIDER_LAYER  
**Source prompt refs:** `v3:IND-PROVIDER`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=IND-PROVIDER` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Define and prove a provider descriptor/capability boundary only after real query consumers exist; providers declare dependencies, authority, provenance, fidelity, cost and supported hooks without being able to escalate authority or fork canonical…

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:PERSIST-EVENTLOG -->
## PERSIST-EVENTLOG

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** PERSISTENCE_PROVIDER  
**Dependencies / unlock requirements:** `G2_HEADLESS_RUNTIME_PROOF`  
**Upstream gate:** `G2_HEADLESS_RUNTIME_PROOF`  
**Semantic ownership:** LANE_LOCAL:PERSIST-EVENTLOG after gate/epoch  
**Source prompt refs:** `p286:PERSIST-EVENTLOG`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=PERSIST-EVENTLOG` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Implement an append/WAL-compatible storage adapter for accepted canonical events and required metadata. Define atomic commit boundary, fsync/durability policy, checksums/framing and recovery scan. Storage order must preserve P4 accepted order and reject corruption/truncation…

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:PERSIST-CHECKPOINT -->
## PERSIST-CHECKPOINT

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** PERSISTENCE_PROVIDER  
**Dependencies / unlock requirements:** `G2_HEADLESS_RUNTIME_PROOF`  
**Upstream gate:** `G2_HEADLESS_RUNTIME_PROOF`  
**Semantic ownership:** LANE_LOCAL:PERSIST-CHECKPOINT after gate/epoch  
**Source prompt refs:** `p286:PERSIST-CHECKPOINT`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=PERSIST-CHECKPOINT` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Persist verified P4 checkpoints atomically with universe/lineage/transition descriptor/history root/frontier/ state digest intact. Design temp/write/fsync/publish/recovery semantics and prove an interrupted publication cannot replace a valid checkpoint with an invalid one. Checkpoint is an…

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:PERSIST-ARCHIVE -->
## PERSIST-ARCHIVE

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** PERSISTENCE_PROVIDER  
**Dependencies / unlock requirements:** `G2_HEADLESS_RUNTIME_PROOF`  
**Upstream gate:** `G2_HEADLESS_RUNTIME_PROOF`  
**Semantic ownership:** LANE_LOCAL:PERSIST-ARCHIVE after gate/epoch  
**Source prompt refs:** `p286:PERSIST-ARCHIVE`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=PERSIST-ARCHIVE` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Implement/import/export the approved portable archive profile around P4 semantics with strict bounds, integrity, transition compatibility, checkpoint authority, universe/lineage equality and suffix ordering. Treat input as hostile. Clarify relation to legacy P1 JSON…

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:PERSIST-MIGRATION -->
## PERSIST-MIGRATION

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** PERSISTENCE_PROVIDER  
**Dependencies / unlock requirements:** `G2_HEADLESS_RUNTIME_PROOF`  
**Upstream gate:** `G2_HEADLESS_RUNTIME_PROOF`  
**Semantic ownership:** LANE_LOCAL:PERSIST-MIGRATION after gate/epoch  
**Source prompt refs:** `p286:PERSIST-MIGRATION`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=PERSIST-MIGRATION` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Define explicit storage/protocol version detection, exact-compatibility rejection and governed migration hooks. A migration must produce a new verifiable representation without pretending old semantics equal new semantics. Add upgrade/downgrade refusal cases, idempotence where…

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:PERSIST-CRASH -->
## PERSIST-CRASH

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** PERSISTENCE_PROVIDER  
**Dependencies / unlock requirements:** `G2_HEADLESS_RUNTIME_PROOF`  
**Upstream gate:** `G2_HEADLESS_RUNTIME_PROOF`  
**Semantic ownership:** LANE_LOCAL:PERSIST-CRASH after gate/epoch  
**Source prompt refs:** `p286:PERSIST-CRASH`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=PERSIST-CRASH` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Build deterministic fault injection around event append, checkpoint publication, compaction, archive write and migration: kill points, torn/truncated/corrupt bytes, stale files and disk errors where simulatable. Prove restart either recovers the last committed…

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:PROVIDER-ABI -->
## PROVIDER-ABI

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** PERSISTENCE_PROVIDER  
**Dependencies / unlock requirements:** `G2_HEADLESS_RUNTIME_PROOF`  
**Upstream gate:** `G2_HEADLESS_RUNTIME_PROOF`  
**Semantic ownership:** LANE_LOCAL:PROVIDER-ABI after gate/epoch  
**Source prompt refs:** `p286:PROVIDER-ABI`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=PROVIDER-ABI` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Implement the public provider ABI/SDK descriptor and lifecycle over the stable runtime boundary. Expose capabilities, regimes, authority, dependencies, schemas, fidelity/cost and allowed query/refine/project/ reconcile hooks. Transition proposals must still pass temporal authority.…

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:DOMAIN-PILOT -->
## DOMAIN-PILOT

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** PERSISTENCE_PROVIDER  
**Dependencies / unlock requirements:** `G3_PROVIDER_AND_DURABILITY_PROOF`  
**Upstream gate:** `G3_PROVIDER_AND_DURABILITY_PROOF`  
**Semantic ownership:** LANE_LOCAL:DOMAIN-PILOT after gate/epoch  
**Source prompt refs:** `p286:DOMAIN-PILOT`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=DOMAIN-PILOT` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Select the smallest high-value existing domain approved by control and expose it entirely through the public provider ABI without changing canonical outputs. Keep the old path available for differential shadow tests. Prove…

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

## D.8 — ADAPTER

<!-- MINI_PROMPT_ID:IND-WASM -->
## IND-WASM

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** ADAPTER  
**Dependencies / unlock requirements:** `G2_HEADLESS_RUNTIME_PROOF`  
**Upstream gate:** `G2_HEADLESS_RUNTIME_PROOF`  
**Semantic ownership:** WASM_ADAPTER  
**Source prompt refs:** `p286:ADAPTER-WASM`, `v3:IND-WASM`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=IND-WASM` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Demonstrate browser/WASM consumption of the same Core/Runtime semantics while preserving the OFU reference product's direct-file/offline requirements and avoiding a second browser-specific semantic fork.

Guardia v4: WASM resta dietro G2_HEADLESS_RUNTIME_PROOF e deve preservare i vincoli browser/direct-file.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:IND-UE -->
## IND-UE

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** ADAPTER  
**Dependencies / unlock requirements:** `G3_PROVIDER_AND_DURABILITY_PROOF`, `G-TARGET-CABI-STABLE`  
**Upstream gate:** `G3_PROVIDER_AND_DURABILITY_PROOF`, `G-TARGET-CABI-STABLE`  
**Semantic ownership:** UNREAL_ADAPTER  
**Source prompt refs:** `p286:ADAPTER-UE`, `v3:IND-UE`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=IND-UE` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Integrate OFU through the already-proven ABI/runtime into Unreal as a host/view only. Unreal objects, threading and large-world rendering may stress the integration but can never define canonical identity or truth.

Guardia v4: Gli engine adapter richiedono G3_PROVIDER_AND_DURABILITY_PROOF e G-TARGET-CABI-STABLE.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:IND-UNITY -->
## IND-UNITY

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** ADAPTER  
**Dependencies / unlock requirements:** `G3_PROVIDER_AND_DURABILITY_PROOF`, `G-TARGET-CABI-STABLE`  
**Upstream gate:** `G3_PROVIDER_AND_DURABILITY_PROOF`, `G-TARGET-CABI-STABLE`  
**Semantic ownership:** UNITY_ADAPTER  
**Source prompt refs:** `p286:ADAPTER-UNITY`, `v3:IND-UNITY`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=IND-UNITY` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Build a C Unity binding over the same proven ABI with no Unity-native semantic fork; test domain reload, lifecycle, ownership and canonical parity.

Guardia v4: Gli engine adapter richiedono G3_PROVIDER_AND_DURABILITY_PROOF e G-TARGET-CABI-STABLE.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:IND-GODOT -->
## IND-GODOT

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** ADAPTER  
**Dependencies / unlock requirements:** `G3_PROVIDER_AND_DURABILITY_PROOF`, `G-TARGET-CABI-STABLE`  
**Upstream gate:** `G3_PROVIDER_AND_DURABILITY_PROOF`, `G-TARGET-CABI-STABLE`  
**Semantic ownership:** GODOT_ADAPTER  
**Source prompt refs:** `p286:ADAPTER-GODOT`, `v3:IND-GODOT`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=IND-GODOT` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Build a Godot GDExtension binding over the same proven ABI with no host-specific semantic fork; verify extension lifecycle, ownership and canonical parity.

Guardia v4: Gli engine adapter richiedono G3_PROVIDER_AND_DURABILITY_PROOF e G-TARGET-CABI-STABLE.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

## D.9 — STANDARD_SDK

<!-- MINI_PROMPT_ID:IND-STD -->
## IND-STD

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** STANDARD_SDK  
**Dependencies / unlock requirements:** `G3_PROVIDER_AND_DURABILITY_PROOF`  
**Upstream gate:** `G3_PROVIDER_AND_DURABILITY_PROOF`  
**Semantic ownership:** OPEN_STANDARD_DRAFT  
**Source prompt refs:** `p286:STD-OMDRS`, `v3:IND-STD`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=IND-STD` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Turn only proven interoperability invariants into an implementable public draft with conformance vectors and version negotiation; keep unstable runtime/storage/engine shapes informative or private. Standard 1.0 is forbidden until materially independent conforming implementations…

Guardia v4: Lo standard non può ridefinire semantica OFU né diventare 1.0 senza conformance indipendente.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:IND-SDK -->
## IND-SDK

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** STANDARD_SDK  
**Dependencies / unlock requirements:** `G3_PROVIDER_AND_DURABILITY_PROOF`, `G-LICENSING-DISTRIBUTION-DECISION`  
**Upstream gate:** `G-LICENSING-DISTRIBUTION-DECISION`, `G3_PROVIDER_AND_DURABILITY_PROOF`  
**Semantic ownership:** SDK_SURFACE  
**Source prompt refs:** `v3:IND-SDK`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=IND-SDK` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Build integration-oriented developer experience only after stable runtime/query surfaces exist: headers/bindings, CLI inspector, conformance runner, profiler/tracing, sample providers, replay example, API reference, packaging diagnostics and supported-platform matrix.

Guardia v4: SDK/distribution non autorizza pubblicazione: licensing e release gates restano vincolanti.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:STD-EXTERNAL-CONFORMANCE -->
## STD-EXTERNAL-CONFORMANCE

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** STANDARD_SDK  
**Dependencies / unlock requirements:** `G4_STANDARD_DRAFT_READY`  
**Upstream gate:** `G4_STANDARD_DRAFT_READY`  
**Semantic ownership:** LANE_LOCAL:STD-EXTERNAL-CONFORMANCE after gate/epoch  
**Source prompt refs:** `p286:STD-EXTERNAL-CONFORMANCE`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=STD-EXTERNAL-CONFORMANCE` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Implement a materially independent conformance consumer from the published draft and vectors, deliberately avoiding reuse of OFU implementation internals beyond licensed normative vectors. Record ambiguities where the spec is insufficient. Standard readiness…

Guardia v4: Lo standard non può ridefinire semantica OFU né diventare 1.0 senza conformance indipendente.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:SDK-DOCS -->
## SDK-DOCS

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** STANDARD_SDK  
**Dependencies / unlock requirements:** `G2_HEADLESS_RUNTIME_PROOF`  
**Upstream gate:** `G2_HEADLESS_RUNTIME_PROOF`  
**Semantic ownership:** LANE_LOCAL:SDK-DOCS after gate/epoch  
**Source prompt refs:** `p286:SDK-DOCS`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=SDK-DOCS` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Build task-oriented SDK documentation and minimal examples for create/open universe, bounded query, provider registration, authority/provenance inspection, temporal replay, checkpoint/archive, cancellation, budgets and conformance diagnosis. Examples must use only public APIs and should…

Guardia v4: SDK/distribution non autorizza pubblicazione: licensing e release gates restano vincolanti.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:SDK-PACKAGING -->
## SDK-PACKAGING

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** STANDARD_SDK  
**Dependencies / unlock requirements:** `G4_DISTRIBUTION_READY`  
**Upstream gate:** `G4_DISTRIBUTION_READY`  
**Semantic ownership:** LANE_LOCAL:SDK-PACKAGING after gate/epoch  
**Source prompt refs:** `p286:SDK-PACKAGING`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=SDK-PACKAGING` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Produce reproducible package layouts for supported native platforms and bindings, including headers, libraries, symbols/debug policy, notices, version metadata and integrity manifests. Define install/upgrade/ uninstall behavior. Packaging metadata must never enter universe identity.…

Guardia v4: SDK/distribution non autorizza pubblicazione: licensing e release gates restano vincolanti.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:SDK-RELEASE-ENGINEERING -->
## SDK-RELEASE-ENGINEERING

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** STANDARD_SDK  
**Dependencies / unlock requirements:** `G4_DISTRIBUTION_READY`  
**Upstream gate:** `G4_DISTRIBUTION_READY`  
**Semantic ownership:** LANE_LOCAL:SDK-RELEASE-ENGINEERING after gate/epoch  
**Source prompt refs:** `p286:SDK-RELEASE-ENGINEERING`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=SDK-RELEASE-ENGINEERING` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Design/implement the governed SDK release transaction: reproducible build, conformance matrix, signing/ provenance as authorized, SBOM, notices, compatibility report, artifacts and rollback. This prompt may not publish a release unless explicit release authority…

Guardia v4: SDK/distribution non autorizza pubblicazione: licensing e release gates restano vincolanti.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

## D.10 — DOMAIN_RESEARCH

<!-- MINI_PROMPT_ID:PROD-W3-LIVING-HISTORY -->
## PROD-W3-LIVING-HISTORY

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE_PRODUCT  
**Program track:** DOMAIN_RESEARCH  
**Dependencies / unlock requirements:** `G-DOMAIN-RESEARCH-AUTHORITY`  
**Upstream gate:** `G-DOMAIN-RESEARCH-AUTHORITY`  
**Semantic ownership:** LANE_LOCAL:PROD-W3-LIVING-HISTORY after gate/epoch  
**Source prompt refs:** `v3:PROD-W3-LIVING-HISTORY`, `p275:R6-FUTURE-LIVING`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=PROD-W3-LIVING-HISTORY` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: When dependencies mature, research governed life/ecology/evolution/history/civilization model providers without treating deterministic plausibility as scientific certification. Until then this prompt is non-runnable except for explicitly authorized read-only research.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:DOMAIN-ASTRO -->
## DOMAIN-ASTRO

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** DOMAIN_RESEARCH  
**Dependencies / unlock requirements:** `G-DOMAIN-RESEARCH-AUTHORITY`  
**Upstream gate:** `G-DOMAIN-RESEARCH-AUTHORITY`  
**Semantic ownership:** LANE_LOCAL:DOMAIN-ASTRO after gate/epoch  
**Source prompt refs:** `p286:DOMAIN-ASTRO`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=DOMAIN-ASTRO` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Improve astronomy distributions/physics only under explicit model/research authority. Start from current P3 contracts and evidence, identify scientifically weak assumptions, add references/oracles/invariants and keep speculative results out of CANONICALPROVEN until separately promoted. If…

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:DOMAIN-PLANET -->
## DOMAIN-PLANET

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** DOMAIN_RESEARCH  
**Dependencies / unlock requirements:** `G-DOMAIN-RESEARCH-AUTHORITY`  
**Upstream gate:** `G-DOMAIN-RESEARCH-AUTHORITY`  
**Semantic ownership:** LANE_LOCAL:DOMAIN-PLANET after gate/epoch  
**Source prompt refs:** `p286:DOMAIN-PLANET`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=DOMAIN-PLANET` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Develop mass/radius/gravity/interior/orbit/forcing consistency under declared models, provenance and units. Add conservation/physical plausibility tests and explicit unsupported states. Do not make presentation terrain or visual family into canonical geography.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:DOMAIN-TERRAIN -->
## DOMAIN-TERRAIN

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** DOMAIN_RESEARCH  
**Dependencies / unlock requirements:** `G-DOMAIN-RESEARCH-AUTHORITY`  
**Upstream gate:** `G-DOMAIN-RESEARCH-AUTHORITY`  
**Semantic ownership:** LANE_LOCAL:DOMAIN-TERRAIN after gate/epoch  
**Source prompt refs:** `p286:DOMAIN-TERRAIN`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=DOMAIN-TERRAIN` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Research physical elevation/geology/surface-process models distinct from current presentation terrain. Define addresses, units, error/fidelity, upstream dependencies and refine/project/reconcile behavior. Fail closed where geology is unknown; do not promote visual LOD mesh heights into…

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:DOMAIN-ATMOS -->
## DOMAIN-ATMOS

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** DOMAIN_RESEARCH  
**Dependencies / unlock requirements:** `G-DOMAIN-RESEARCH-AUTHORITY`  
**Upstream gate:** `G-DOMAIN-RESEARCH-AUTHORITY`  
**Semantic ownership:** LANE_LOCAL:DOMAIN-ATMOS after gate/epoch  
**Source prompt refs:** `p286:DOMAIN-ATMOS`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=DOMAIN-ATMOS` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Develop atmosphere/volatile/energy/climate models with explicit applicability, units, uncertainty and provenance. Separate equilibrium proxies from time evolution. Cross-scale projections must not infer local weather without an owning model. Add conservation and boundary tests.

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:DOMAIN-HYDRO -->
## DOMAIN-HYDRO

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** DOMAIN_RESEARCH  
**Dependencies / unlock requirements:** `G-DOMAIN-RESEARCH-AUTHORITY`  
**Upstream gate:** `G-DOMAIN-RESEARCH-AUTHORITY`  
**Semantic ownership:** LANE_LOCAL:DOMAIN-HYDRO after gate/epoch  
**Source prompt refs:** `p286:DOMAIN-HYDRO`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=DOMAIN-HYDRO` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Research water/ice/volatile inventories and surface process projections under explicit conservation and climate/geology dependencies. Define what can be canonical/model-derived versus presentation. Reconcile coarse inventories with refined representations; never create water features only because…

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:DOMAIN-MATTER -->
## DOMAIN-MATTER

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** DOMAIN_RESEARCH  
**Dependencies / unlock requirements:** `G-DOMAIN-RESEARCH-AUTHORITY`  
**Upstream gate:** `G-DOMAIN-RESEARCH-AUTHORITY`  
**Semantic ownership:** LANE_LOCAL:DOMAIN-MATTER after gate/epoch  
**Source prompt refs:** `p286:DOMAIN-MATTER`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=DOMAIN-MATTER` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Develop material and microstructure models from source composition/phase/process constraints while avoiding fake exact molecules/particles. Define model ensembles, distributions, units, uncertainty and multiscale commitments. Presentation motifs remain presentation unless a scientific provider owns…

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:DOMAIN-BIO -->
## DOMAIN-BIO

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** DOMAIN_RESEARCH  
**Dependencies / unlock requirements:** `G-DOMAIN-RESEARCH-AUTHORITY`  
**Upstream gate:** `G-DOMAIN-RESEARCH-AUTHORITY`  
**Semantic ownership:** LANE_LOCAL:DOMAIN-BIO after gate/epoch  
**Source prompt refs:** `p286:DOMAIN-BIO`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=DOMAIN-BIO` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Extend the existing fail-closed biology posture into governed research only when environment/energy/chemistry prerequisites are explicit. Model viability/niches/populations/evolution without decorative life templates. Keep origin-of-life/species claims appropriately uncertain and do not promote through visual…

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:DOMAIN-HISTORY -->
## DOMAIN-HISTORY

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** DOMAIN_RESEARCH  
**Dependencies / unlock requirements:** `G-DOMAIN-RESEARCH-AUTHORITY`  
**Upstream gate:** `G-DOMAIN-RESEARCH-AUTHORITY`  
**Semantic ownership:** LANE_LOCAL:DOMAIN-HISTORY after gate/epoch  
**Source prompt refs:** `p286:DOMAIN-HISTORY`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=DOMAIN-HISTORY` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Design/implement bounded macro/meso history with late materialization so local detail can be reconstructed consistently without storing all history. Bind causes and model versions explicitly; ordinary P4 v1 commit semantics are not retroactive…

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:DOMAIN-CIV -->
## DOMAIN-CIV

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE  
**Program track:** DOMAIN_RESEARCH  
**Dependencies / unlock requirements:** `G-DOMAIN-RESEARCH-AUTHORITY`  
**Upstream gate:** `G-DOMAIN-RESEARCH-AUTHORITY`  
**Semantic ownership:** LANE_LOCAL:DOMAIN-CIV after gate/epoch  
**Source prompt refs:** `p286:DOMAIN-CIV`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere dependencies/gate live e runnable queue.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=DOMAIN-CIV` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Research causal population/settlement/institution/technology/trade/culture/economy models grounded in world resources, environment and history. Avoid decorative city templates disconnected from causal state. Use P4 for governed changes, bounded late materialization for detail and explicit model…

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

# Section E — Control / Convergence Successors

Sono control-plane successors, non implementation lanes. Sono BLOCKED finché il master/control state non ne soddisfa le condizioni.

<!-- MINI_PROMPT_ID:CTRL-WAVE-EPOCH -->
## CTRL-WAVE-EPOCH

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE_CONTROL  
**Program track:** CONTROL  
**Dependencies / unlock requirements:** `CTRL-WAVE0`  
**Upstream gate:** dependency-driven / no separate gate recorded  
**Semantic ownership:** CONTROL_PATHS_ONLY (resolved live)  
**Source prompt refs:** `p286:CTRL-WAVE-EPOCH`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere la condizione control/wave live.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=CTRL-WAVE-EPOCH` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Act as the sole control-plane activator for TARGETWAVE supplied in the user invocation or inferred from the requested lane dependency. Read the predecessor convergence record, all relevant handoffs and current live repository.…

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

<!-- MINI_PROMPT_ID:CTRL-CONVERGENCE -->
## CTRL-CONVERGENCE

**Status:** BLOCKED · DO_NOT_LAUNCH_YET  
**Mode:** WRITE_CONTROL  
**Program track:** CONTROL  
**Dependencies / unlock requirements:** `CTRL-WAVE0`  
**Upstream gate:** dependency-driven / no separate gate recorded  
**Semantic ownership:** CONTROL_PATHS_ONLY (resolved live)  
**Source prompt refs:** `p286:CTRL-CONVERGENCE`  
**When to launch:** DO_NOT_LAUNCH_YET — attendere la condizione control/wave live.

```text
Entra nella repository `VaX1989/One_File_Universe` ed esegui integralmente `PROMPT_ID=CTRL-CONVERGENCE` dal master canonico v4:

`docs/frontier/prompts/OFU_POST_M0_PARALLEL_DEVELOPMENT_PROMPT_MASTER_2026-09-17.json`

Il master live prevale su questo mini-prompt. Prima di qualsiasi azione: reautentica repository; risolvi alias; carica tutti gli `inherited_contracts` e integralmente tutti i `source_prompt_refs`; verifica active epoch, base SHA/tree, dependencies, gate, semantic ownership e l'eventuale branch/PR della stessa lane. Continua il lavoro legittimo più recente, senza duplicarlo.

**DO_NOT_LAUNCH_YET.** Se il gate non è soddisfatto, NON aggirarlo e NON implementare il lavoro bloccato. Fai solo preparatory work autorizzato e termina con lo stato previsto.

Specializzazione: Act as the sole convergence owner for the active wave. Load every lane handoff, Draft PR, audit packet, dependency head and integration patch request. Re-verify ownership before integrating. Reject or defer lanes…

Esegui autonomamente fino a uno stato terminale ammesso. Non chiedere al founder decisioni tecniche determinabili dalla repository. Non toccare superfici di altre lane; per cambi condivisi fuori scope usa `INTEGRATION_PATCH_REQUEST`.

Non modificare `main`, non fare merge di #274/#275/#287, non creare tag/release e non avviare R7 salvo autorizzazione esplicita. Produci execution state, evidence e terminal handoff richiesti dal master.
```

# Section F — Legacy Aliases

Gli alias non ricevono mini-prompt duplicati. Usare sempre il target canonico; il gate del target prevale e non può essere indebolito.

| Legacy alias | Canonical target / rule |
|---|---|
| `CTRL-IW0-EPOCH` | usare `CTRL-WAVE0` |
| `IND-GOV` | usare `IND-GOV-A` |
| `IND-CONF` | usare `IND-CONF-A` |
| `IND-LIC` | usare `IND-LIC-A` |
| `IND-BRIDGE` | usare `IND-BRIDGE-A` |
| `IND-NATIVE` | usare `IND-NATIVE-P2` |
| `ADAPTER-UE` | usare `IND-UE` |
| `ADAPTER-WASM` | usare `IND-WASM` |
| `ADAPTER-UNITY` | usare `IND-UNITY` |
| `ADAPTER-GODOT` | usare `IND-GODOT` |
| `STD-OMDRS` | usare `IND-STD` |
| `PRODUCT-TIME` | usare `PROD-W2-TIME` |
| `PRODUCT-ATLAS` | usare `PROD-W1-ATLAS-CORE` |
| `PRODUCT-QUALITY` | usare `QOBS-CROSS-PROGRAM` |
| `R6-W1-CONTRACTS` | usare `PROD-W1-CONTRACTS` |
| `R6-W1-QOBS` | usare `QOBS-CROSS-PROGRAM` |
| `R6-W1-PRODUCT-DEPTH` | usare `PROD-W1-PRODUCT-DEPTH` |
| `R6-W1-SCI-FP` | usare `PROD-W1-SCI-FP` |
| `R6-W1-SCI-WHY` | usare `PROD-W1-SCI-WHY` |
| `R6-W1-ATLAS-CORE` | usare `PROD-W1-ATLAS-CORE` |
| `R6-W1-INSTRUMENTS` | usare `PROD-W1-INSTRUMENTS` |
| `R6-W1-DEVICE-EVIDENCE` | usare `EVID-PHYSICAL-DEVICE` |
| `R6-W2-TIME` | usare `PROD-W2-TIME` |
| `R6-W2-SEARCH` | usare `PROD-W2-SEARCH` |
| `R6-W2-COMPARE` | usare `PROD-W2-COMPARE` |
| `R6-W2-DIRECTOR` | usare `PROD-W2-DIRECTOR` |
| `R6-FUTURE-LIVING` | usare `PROD-W3-LIVING-HISTORY` |
| `IND-SEC` | phased: `BEFORE_G0A` → `IND-SEC-A`; `AFTER_G0A` → `IND-SEC-B`. Nessuna fase WRITE prima del proprio gate. |
| `PRODUCT-SCIENTIST` | split: usare `PROD-W1-SCI-WHY` + `PROD-W1-INSTRUMENTS` secondo i rispettivi gate; nessuna lane canonica unica. |

# Section G — Current Recommended Launch Order

## 1. START NOW

- `CTRL-WAVE0` è **START_HERE** se manca un active Wave0 epoch/control state valido.

## 2. START AFTER CTRL-WAVE0

- `PROD-W1-CONTRACTS` — solo se epoch/base/ownership sono materializzati e la lane resta runnable.
- `QOBS-CROSS-PROGRAM` — solo se epoch/base/ownership sono materializzati e la lane resta runnable.
- `IND-GOV-A` — solo se epoch/base/ownership sono materializzati e la lane resta runnable.
- `IND-CONF-A` — solo se epoch/base/ownership sono materializzati e la lane resta runnable.
- `IND-LIC-A` — solo se epoch/base/ownership sono materializzati e la lane resta runnable.
- `IND-BRIDGE-A` — solo se epoch/base/ownership sono materializzati e la lane resta runnable.

## 3. MAY RUN IN PARALLEL

- I READY_WRITER possono procedere in parallelo solo entro ownership disgiunta e dopo `CTRL-WAVE0`.
- `IND-SEC-A` — read-only; può svolgere ricerca/audit autorizzati in parallelo, rispettando eventuali target prerequisite.
- `ARCH-RUNTIME` — read-only; può svolgere ricerca/audit autorizzati in parallelo, rispettando eventuali target prerequisite.
- `ARCH-PERSIST` — read-only; può svolgere ricerca/audit autorizzati in parallelo, rispettando eventuali target prerequisite.
- `ARCH-PROVIDER` — read-only; può svolgere ricerca/audit autorizzati in parallelo, rispettando eventuali target prerequisite.
- `ARCH-UE` — read-only; può svolgere ricerca/audit autorizzati in parallelo, rispettando eventuali target prerequisite.
- `ARCH-WASM` — read-only; può svolgere ricerca/audit autorizzati in parallelo, rispettando eventuali target prerequisite.
- `AUDIT-DETERMINISM` — read-only; può svolgere ricerca/audit autorizzati in parallelo, rispettando eventuali target prerequisite.
- `AUDIT-AUTHORITY` — read-only; può svolgere ricerca/audit autorizzati in parallelo, rispettando eventuali target prerequisite.
- `AUDIT-SCIENCE` — read-only; può svolgere ricerca/audit autorizzati in parallelo, rispettando eventuali target prerequisite.
- `AUDIT-SECURITY` — read-only; può svolgere ricerca/audit autorizzati in parallelo, rispettando eventuali target prerequisite.
- `AUDIT-PERFORMANCE` — read-only; può svolgere ricerca/audit autorizzati in parallelo, rispettando eventuali target prerequisite.
- `AUDIT-PORTABILITY` — read-only; può svolgere ricerca/audit autorizzati in parallelo, rispettando eventuali target prerequisite.
- `AUDIT-ABI` — read-only; può svolgere ricerca/audit autorizzati in parallelo, rispettando eventuali target prerequisite.
- `AUDIT-PERSISTENCE` — read-only; può svolgere ricerca/audit autorizzati in parallelo, rispettando eventuali target prerequisite.
- `AUDIT-PRODUCT` — read-only; può svolgere ricerca/audit autorizzati in parallelo, rispettando eventuali target prerequisite.

## 4. WAIT FOR GATE

- Tutti gli altri 74 canonical prompt sono `BLOCKED`: usarli solo quando master live e control plane confermano dependencies/gate soddisfatti.
- Sequenza industrialization vincolante: `G0A_MINIMUM_NORMATIVE_SLICE -> IND-JS-HEADLESS -> IND-EXT-CONSUMER -> GATE-G0B-AUDIT -> G0B_EXTERNAL_CONSUMER_SEAM_PROOF -> IND-NATIVE-P2 -> IND-CABI-MICROHOST -> GATE-G1-AUDIT -> G1_MINIMUM_PLATFORM_PROOF -> G1_PASS_CONTINUE -> IND-RUNTIME`.

## 5. NEVER BYPASS

- `IND-NATIVE-P2` non parte prima di `G0B_EXTERNAL_CONSUMER_SEAM_PROOF`.
- `IND-RUNTIME` e `RUNTIME-*` non partono prima di `G1_PASS_CONTINUE`.
- `IND-UE`, `IND-UNITY`, `IND-GODOT` richiedono i gate v4 incluso target C ABI stabile.
- Gli alias legacy non abbassano i gate; `IND-SEC` risolve la fase A/B corretta.
- Nessun mini-prompt autorizza merge di #274/#275/#287, `main`, tag, release o R7.

## Generation Validation

MASTER_SCHEMA_VERSION=4  
MASTER_HEAD_AT_GENERATION=c2cab6d6e914b918432432fdc69825e0a1000509  
CANONICAL_PROMPTS=96  
MINI_PROMPTS_GENERATED=96  
CONTROL_READY=1  
READY_WRITERS=6  
READY_READONLY_AUDIT=15  
BLOCKED=74  
ALIASES_DOCUMENTED=29  
MISSING_PROMPT_IDS=NONE  
DUPLICATE_PROMPT_IDS=NONE  
STATUS_MISMATCHES=NONE  
VALIDATION=PASS
