# OFU Canonical Binary Value v1

OFU-CBV-1 is a small purpose-built deterministic TLV encoding selected over deterministic CBOR for P2 because its admitted domain and parser can be completely specified and independently implemented without an external dependency. This choice is versioned and does not claim general CBOR interoperability.

Tags: `00` null, `01` false, `02` true, `10` negative signed integer, `11` non-negative unsigned integer, `20` byte string, `21` UTF-8 text, `30` array, `31` text-key map. Lengths and integer magnitudes use minimal unsigned LEB128. Negative integers encode `(-n*2)-1`; the signed tag therefore admits only odd encoded magnitudes and cannot encode zero or a positive value. Unsigned integers are bounded to u64; signed negative integers are bounded to i64 minimum through -1. JavaScript safe non-negative/signed Numbers are normalized into the corresponding integer value. Floating point is not admitted.

Text must be well-formed Unicode and NFC. Decoders reject invalid UTF-8 and non-NFC encoded text. Map keys are text, sorted by their complete encoded key bytes, strictly increasing. Duplicate keys and keys colliding after NFC normalization fail closed. Arrays preserve order.

Primary limits: depth 32, 100,000 nodes, 1 MiB imported byte buffer/value byte string, 65,536 array/map items, 262,144 UTF-8 bytes per text value. Implementations may reject earlier for resource safety but may not accept a non-canonical representation as canonical.

Malformed lengths, truncated values, non-minimal varints, out-of-range integers, non-canonical signed tags, unknown tags, trailing bytes, unsupported in-memory values, cycles and invalid Unicode fail closed. The encoding is injective over its admitted canonical value domain.
