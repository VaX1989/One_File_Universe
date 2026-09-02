# Deterministic Derivation v1

P2 selects HMAC-SHA-256 rather than the P1 framed raw-SHA candidate. HMAC is a standardized keyed PRF construction; OFU uses the 32-byte master seed as key even though secrecy is not required for reproducibility.

Message = OFU-CBV-1 of `["OFU-DERIVE-v1", semanticManifestHash, domain, canonicalAddressBytes, property, counter]`.

Domain, property and counter are explicit separation dimensions. There is no global RNG state and no call-order dependency. Random access is therefore native. Changing semantic manifest identity changes derivation lineage. Native/WebCrypto hashing may accelerate a conforming implementation only if output bytes equal the reference oracle.
