# IND-CABI-MICROHOST boundary

This lane is a feasibility capsule around the already-proven frozen Native P2/Core slice. It is **not** the Runtime ABI, provider ABI, engine ABI, or a promise of long-term binary compatibility.

## Surface

- ABI version: `1`
- entry point: `ofu_p2_call_v1`
- request and output lengths are explicit 64-bit counts
- output storage is caller-owned
- no heap allocation ownership crosses the ABI
- no opaque handles are required
- no C++ exception may cross the C boundary
- malformed canonical/native inputs are returned as structured rejection classes
- insufficient output capacity produces no partial write and returns the required byte count
- unsupported ABI versions fail closed

The request grammar is intentionally the same neutral one-line command protocol used only by the frozen Native P2 parity experiment. This keeps the feasibility proof attached to the already-tested algorithms rather than inventing a second semantic model.

## Authority and non-goals

The C ABI owns no canonical semantics. `native/p2-core/ofu_p2_native.cpp` remains the experiment implementation used by both the native CLI proof and this wrapper. The wrapper includes that source into one translation unit and only duplicates the narrow command dispatch needed to expose results through C-shaped buffers.

This lane does not port Runtime, P4, product rendering, providers, persistence, or platform adapters. It does not authorize `G1_PASS_CONTINUE`.

## Evidence

Verification PR #344 registers the focused oracle without merging control-owned `package.json`. On exact verification head `0eded91d5d104e2f32a5e1f18e2bc88161102a54`, Foundation run `35527644242` executed 139 frozen-core requests through both direct Native P2 and the C ABI under GCC/G++ and Clang/Clang++. The transcripts were identical across boundary and compiler families; 45 rejection paths were mapped to structured C rejection classes; buffer misuse and exception-containment self-tests passed.
