# V2X-16 bounds and complexity

Research engineering bounds, not measured shipping performance.

| Subsystem | Hard working-set bound | Dominant work |
|---|---:|---|
| life resources / guilds / links / patches / lineages | 16 / 32 / 128 / 64 / 64 | O(G log G + links log links) |
| demographic age bins | 256 | O(A) |
| materialized persons / kinship links | 512 / 1024 | bounded O(P+K) |
| commodities / sectors / routes | 64 / 32 / 128 | O(S*inputs + shipments log shipments) |
| technologies / institutions / conventions | 128 / 32 / 64 | O(nodes+edges) |
| matter species / reactions | 64 / 128 | O(reactions*stoichiometric terms) |
| compartments / transport edges | 32 / 128 | O(edges log edges) |
| microstructure grains / interfaces | 256 / 512 | O(G + I log I) |
| atom sites / bonds | 256 / 512 | O(A+B) |
| reference validity fields / fingerprint fields | 16 / 64 | bounded O(fields) |

Integer products use BigInt before safe-integer conversion where multiplication can exceed IEEE-754 exact range. Checked addition/summation is used at aggregate boundaries. Overflow, negative stock, invalid graphs, destination-cap overflow, and malformed bounded metadata fail closed.

Contention where order has no scientific authority uses opening-state requests followed by deterministic proportional allocation and stable identifier residual assignment. This gives deterministic permutation-invariant results for the declared bounded input set. Reaction application is the explicit exception: it is a sequential scenario operator and does not claim physical order invariance.

Research fingerprints are 64-bit noncryptographic lookup hints over bounded length-prefixed ASCII fields. They are not collision-proof identifiers and require metadata verification on apparent equality.

No byte-level memory, browser-performance, or real-world calibration claim is fabricated. Promotion consumers must measure their shipping representation against central runtime budgets.

Adaptive resolution is mandatory: no universe-wide store of persons, organisms, atom sites, reactions, routes, or kinship. Coarse aggregate/representative state is retained and finite working sets are refined only when requested. Promotion must bind this through the convergence-owned `REFINE/PROJECT/RECONCILE` seam.
