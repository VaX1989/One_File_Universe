# Universe Identity and Manifest Semantics v1

The **Semantic Generator Manifest** defines universe meaning: canonical protocol version, generator-suite identity, subsystem versions, address schema, numeric contract, domain/dependency declarations and semantic genesis/law configuration. Its identity is SHA-256 over OFU-CBV-1 manifest bytes.

The **Implementation Manifest** binds concrete source/components/toolchain/build metadata. It does not define semantic world identity merely because bytes differ.

The **Conformance Manifest** binds corpus version, vector/digest identities, supported determinism classes and executed runtime evidence.

Universe Identity descriptor is OFU-CBV-1 of `{canonicalProtocolVersion:"ofu-cbv-1", masterSeed:<32 bytes>, semanticManifestHash:<32 bytes>}`. The public Universe Identity digest is SHA-256 of ASCII `OFU-UNIVERSE-v1\\0` followed by that descriptor.

Genesis/law-profile changes alter semantic manifest bytes and therefore Universe Identity. P2 deliberately does not add a redundant independent GenesisParametersHash.
