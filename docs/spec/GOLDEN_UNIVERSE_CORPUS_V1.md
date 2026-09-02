# Golden Universe Corpus v1

The committed corpus descriptor is `tests/vectors/golden-universe-corpus-v1.json`. The independent Python oracle deterministically expands it to 279 cases: 20 canonical values, 3 explicit boundary addresses and 256 generated address/derivation cases.

Coverage includes null/booleans, positive/negative integers, 2^53 boundaries, i64/u64 boundaries, empty/binary byte strings, NFC/NFD equivalence, combining text, NUL, zero-width text, astral emoji, arrays/maps, negative coordinates, domain/property/counter separation and deterministic generated cases.

`corpusDigest` commits the independently generated oracle payload. `kernelDigest` commits the 256 generated derivation outputs using OFU-CBV-1 plus SHA-256. Mutation fuzzing uses seed `0x5eed1234` and records 5,000 deterministic iterations in the Node suite. Future semantic changes require explicit corpus/protocol version evolution.
