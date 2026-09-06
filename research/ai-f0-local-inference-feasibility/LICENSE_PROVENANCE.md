# AI-F0 license and provenance record

**Date:** 2026-09-06  
**Authority:** research metadata only  
**Third-party model weights committed:** **none**  
**Third-party runtime binaries committed:** **none**

AI-F0 records candidate metadata so later experiments can be reproduced without silently acquiring or redistributing assets. The presence of a candidate here is not redistribution approval.

## Candidate disposition

| Candidate | Upstream license observed | AI-F0 redistribution disposition |
|---|---|---|
| SmolLM2-135M-Instruct | Apache-2.0 | Not committed. Before embedding, freeze exact converted artifact, checksum, notices, tokenizer provenance and repository artifact policy. |
| SmolLM2-360M-Instruct | Apache-2.0 | Same: not committed; converted artifact provenance and notices still require review. |
| Gemma 3 270M IT | Gemma Terms | **Do not redistribute from AI-F0.** Gated access/terms and redistribution obligations require explicit review. |
| Qwen2.5-0.5B-Instruct | Apache-2.0 | Not committed. Freeze exact converted artifact/checksum/notices before any embedding decision. |

Runtime candidates are also metadata-only. ONNX Runtime is observed under MIT; WebLLM is observed under Apache-2.0. AI-F0 does not use those observations as permission to ship a particular bundled build. Transformers.js licensing and all transitive runtime/WASM/tokenizer dependencies must be captured from an exact frozen dependency graph before any AI-F1 artifact is distributable.

The machine-readable source list and URLs are in `source-provenance.json` and `model-candidates.json`.
