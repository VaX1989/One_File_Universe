# ADR-009 — Semantic Simulation LOD

**Status:** Accepted

## Decision
OFU MUST NOT simulate the entire theoretical universe at individual-agent resolution. Simulation fidelity is semantic and relevance-driven.

Baseline levels:
- `COLD`: macroscopic/statistical state;
- `WARM`: aggregate populations/ecosystems/economies/factions;
- `HOT`: local regions, settlements and concrete processes;
- `IMMEDIATE`: directly interactive agents/physics/gameplay.

Transitions between levels MUST preserve canonical facts and respect explicit cost budgets.

## Consequences
Address-space size and simultaneously simulated state are intentionally decoupled.