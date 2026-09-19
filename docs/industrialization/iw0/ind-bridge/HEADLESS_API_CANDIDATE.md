# IND-BRIDGE-A — Candidate JS headless seam

Status: NON-NORMATIVE G0A CANDIDATE
Authority: HEADLESS_BRIDGE_DESIGN
Implementation status: NOT IMPLEMENTED BY THIS LANE

## Purpose

Define the smallest facade that an external JavaScript host could use without importing product state. Every operation below is a direct grouping of behavior that already exists in P2/P4. This document does not grant new canonical authority.

## Candidate v0 shape

    HeadlessKernel.open({
      masterSeed,
      semanticManifest
    }) -> session

    session.identity() -> {
      semanticManifestHash,
      universeIdentity,
      p2Protocol,
      p4Protocol,
      transitionContractDigest
    }

    session.address(segments) -> Uint8Array

    session.derive({
      addressBytes,
      domain,
      property,
      counter
    }) -> Uint8Array

    session.canonicalEvent(eventInput) -> CanonicalEvent

    session.compareEvents(a, b) -> -1 | 0 | 1

    session.lineageId(parentLineageId, branchReason) -> Uint8Array

    session.close() -> void

Names are candidate facade names only. The semantic operations map to existing P2/P4 functions and must not redefine their bytes.

## Existing operation mapping

| Candidate call | Existing authority |
| --- | --- |
| open seed + manifest | P2 semanticManifestHash + universeIdentity |
| identity manifest/universe | P2 |
| address | P2 address + strict address guard |
| derive | P2 derive |
| canonical event / total order | P4 canonicalEvent + canonical comparator |
| lineage/live-frontier inputs | P4 lineageId + live admission semantics |
| transition contract provenance | P4 transitionContractDigest |
| close | facade/runtime lifecycle only; no semantic effect |

## POST_G0A_PRIVATE_CANDIDATE — archive/persistence

P4 archive import/export and checkpoint/compaction remain useful private implementation candidates, but they are **excluded from the G0A minimum facade and from the G0A/external-consumer proof**. No `archiveBytes` input and no public `exportArchive()` method belong to the G0A candidate. Any later exposure requires separate trust/authentication/provenance and persistence evidence; current integrity/self-consistency is not treated as authenticated history.

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

The session may cache decoded manifest state, but cache/materialization is not part of identity.

The caller may discard the session at any time. Reopening from the same master seed and semantic manifest must reproduce the same canonical address bytes, P2 derived bytes, canonical P4 event identity/order, lineage and transition-contract digest.

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
- canonical P4 event identity/order and lineage/live-frontier witness where exercised.

Authority metadata must describe the operation that produced a value. Runtime measurements are not scientific provenance.

## Failure behavior

G0A freezes behavior, not a new error taxonomy:
- invalid input fails closed;
- unsupported version fails closed;
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
5. create canonical P4 events and verify deterministic total order, lineage identity and exact transition binding;
6. destroy all facade state;
7. reopen from the same semantic inputs;
8. reproduce the exact P2 address/property bytes and narrow P4 witnesses;
9. do all of the above with no DOM, Babylon, renderer, camera or UI selection.

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
