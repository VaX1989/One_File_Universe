# V2X-16 bounds and complexity

Research engineering bounds, not measured shipping performance.

| Subsystem | Hard working-set bound | Dominant work |
|---|---:|---|
| life resources / guilds / links / patches / lineages | 16 / 32 / 128 / 64 / 64 | O(G log G + links) |
| demographic age bins | 256 | O(A) |
| materialized persons / kinship links | 512 / 1024 | bounded O(P+K) |
| commodities / sectors / routes | 64 / 32 / 128 | O(S*inputs + shipments) |
| technologies / institutions / conventions | 128 / 32 / 64 | O(nodes+edges) |
| matter species / reactions | 64 / 128 | O(reactions*stoichiometric terms) |
| compartments / transport edges | 32 / 128 | O(edges) |
| microstructure grains / interfaces | 256 / 512 | O(G+I) |
| atom sites / bonds | 256 / 512 | O(A+B) |

Integer products use BigInt before safe-integer conversion. Overflow, negative stock and invalid graphs fail closed. No byte-level memory or browser-performance claim is fabricated; promotion consumers must measure their shipping representation against central runtime budgets.

Adaptive resolution is mandatory: no universe-wide store of persons, organisms, atom sites, reactions, routes or kinship. Coarse aggregate/representative state is retained and finite working sets are refined only when requested. Promotion must bind this through the convergence-owned `REFINE/PROJECT/RECONCILE` seam.
