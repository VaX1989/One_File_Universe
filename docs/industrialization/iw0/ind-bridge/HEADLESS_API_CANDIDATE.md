# IND-BRIDGE-A — Candidate JS headless seam

Status: NON-NORMATIVE G0A CANDIDATE
Authority: HEADLESS_BRIDGE_DESIGN
Implementation status: NOT IMPLEMENTED BY THIS LANE

## Purpose

Define the smallest facade that an external JavaScript host could use without importing product state. Every operation below is a direct grouping of behavior that already exists in P2/P4. This document does not grant new canonical authority.

## Candidate v0 shape

    HeadlessKernel.open({
      masterSeed,
      semanticManifest,
      archiveBytes?
    }) -> session

    session.identity() -> {
      semanticManifestHash,
      universeIdentity,
      p2Protocol,
      p4Protocol,
      transitionContractDigest,
      historyStateDigest,
      eventRoot
    }

    session.address(segments) -> Uint8Array

    session.derive({
      addressBytes,
      domain,
      property,
      counter
    }) -> Uint8Array

    session.history() -> {
      stateDigest,
      eventRoot
    }

    session.exportArchive() -> Uint8Array

    session.close() -> void

Names are candidate facade names only. The semantic operations map to existing P2/P4 functions and must not redefine their bytes.

## Existing operation mapping

| Candidate call | Existing authority |
| --- | --- |
| open seed + manifest | P2 semanticManifestHash + universeIdentity |
| identity manifest/universe | P2 |
| address | P2 address + strict address guard |
| derive | P2 derive |
| open archive | P4 importArchive |
| history state digest | P4 replayLiveWorld / state digest |
| event root | P4 eventRoot |
| export archive | P4 exportArchive |
| transition contract provenance | P4 transitionContractDigest |
| close | facade/runtime lifecycle only; no semantic effect |

## Deliberately absent from v0

No generic query(provider, operation, ...) method is frozen at G0A.

Reason: the current PX request envelope requires selection, pxProduct builds the request from captured product state, and V1 query bindings verify selection against pxProduct and use the released preview context. A generic API copied from that surface would publish product leakage.

IND-JS-HEADLESS may add a generic query only after it can express context explicitly without UI selection. A future request may need fields such as provider, operation, canonical address, temporal/history context, payload and budget. The exact schema is intentionally unfrozen here.

Also absent:
- renderer;
- scene;
- camera;
- input routing;
- selection service;
- viewport visibility;
- adaptive materialization state;
- scheduler priority;
- worker API;
- browser storage API;
- product readiness;
- product snapshot;
- performance telemetry.

## Opaque state boundary

The session may cache decoded manifest/archive state, but cache/materialization is not part of identity.

The caller may discard the session at any time. Reopening from the same master seed, semantic manifest and archive must reproduce the same canonical address bytes, P2 derived bytes, P4 state digest and P4 event root.

The facade must not expose globalThis.OFU as its state model. Packaging may initially adapt the current IIFEs internally, but the public contract is explicit arguments/results only.

## Provenance result

The minimum provenance witness should be derivable without product state:

- P2 protocol/profile version;
- semantic manifest hash;
- universe identity;
- canonical address bytes or digest;
- domain/property/counter used for derivation;
- P4 temporal protocol version;
- P4 transition contract digest;
- P4 state digest/event root when history exists.

Authority metadata must describe the operation that produced a value. Runtime measurements are not scientific provenance.

## Failure behavior

G0A freezes behavior, not a new error taxonomy:
- invalid input fails closed;
- unsupported version fails closed;
- archive integrity/lineage mismatch fails closed;
- no partial result is promoted;
- closing a session invalidates that session only and changes no semantic bytes.

The future facade may map internal failures to stable public codes, but the mapping must be evidence-led and backward-compatible. This lane intentionally does not invent those codes.

## Async and cancellation

P2/P4 v0 methods are synchronous and bounded by their existing limits.

Future provider/domain queries may be asynchronous. If introduced:
- accept an AbortSignal or equivalent host-neutral cancellation token;
- an aborted query yields no successful result;
- partial work is discarded;
- canonical/P4 state changes still require the existing admitted P4 path;
- scheduling, worker choice and cancellation timing cannot affect semantic result bytes.

## External consumer contract

A tiny consumer must be able to:

1. open the Golden Universe Corpus master seed + semantic manifest;
2. obtain the pinned manifest hash and universe identity;
3. encode Golden Universe Corpus address case 0;
4. derive its pinned property bytes using the existing domain/property/counter fixture;
5. create or restore a P4 history and obtain state/event digests;
6. export archive bytes;
7. destroy all facade state;
8. reopen from the same semantic inputs/archive;
9. reproduce the exact P2 address/property bytes and P4 digests;
10. do all of the above with no DOM, Babylon, renderer, camera or UI selection.

The current additive probe performs the same behavior by direct source loading. IND-JS-HEADLESS must make it pass through the public facade without source-internal bypass before G0B can be considered.

## Shipping product as conformance consumer

The existing single-file/offline browser product remains first-class. It does not need to migrate during G0A.

After a facade exists, shadow-mode comparison is preferred:
- compute a witness through existing shipping paths;
- compute the equivalent semantic witness through the facade from explicit context;
- require equality;
- keep rendering/camera/selection translation on the product side.

No facade mismatch may be repaired by changing canonical bytes merely to make the wrapper convenient.

## Abandon condition

Set PLATFORM_EXTRACTION_PREMATURE if a useful independent consumer cannot use this seam without:
- product globals;
- camera/selection/viewport state as semantic inputs;
- renderer/Babylon types;
- semantic reinterpretation of P2/P4;
- product-source migration before equivalence is established.

That condition is not met by the present G0A evidence; public implementation remains intentionally deferred.
