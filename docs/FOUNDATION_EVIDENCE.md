# P0 Foundation Evidence

**Checked:** 2026-09-01

This document records external platform facts that materially influenced P0 architecture. It is evidence for decisions, not a permanent substitute for re-testing real browsers in P1.

## WebGL2 portability direction

MDN currently classifies `WebGL2RenderingContext` as Baseline / Widely available and notes broad availability across browsers since September 2021. This supports using WebGL2 as the current portable graphics baseline candidate rather than making WebGPU mandatory.

Source: https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext

## WebGPU is an optional acceleration path

MDN currently classifies WebGPU as Limited availability and states that the API is available only in secure contexts in supporting browsers. A strict direct-open `file://` profile therefore cannot constitutionally require WebGPU.

Source: https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API

## SharedArrayBuffer / cross-origin isolation

MDN documents that access to `SharedArrayBuffer` with reduced restrictions depends on a cross-origin-isolated document, normally established using COOP/COEP HTTP response headers (plus applicable permissions policy). A local single-file profile cannot assume such HTTP headers are present.

Sources:
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy
- https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated

## `localStorage` under `file:` is not a portable authority

MDN explicitly states that requirements for `localStorage` behavior for documents loaded from `file:` URLs are undefined and may vary between browsers. OFU therefore treats portable save/export state as authoritative and local browser storage as optional convenience/cache.

Source: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage

## Native transcendental math cannot be presumed D3

The ECMAScript specification defines `Math.sin` (and several related transcendental functions) as returning an `implementation-approximated` Number value. Canonical bit-exact OFU semantics therefore cannot rely on an untested assumption that native transcendental results are identical across engines.

Source: https://tc39.es/ecma262/2025/multipage/numbers-and-dates.html#sec-math.sin

## Evidence policy

These references justify conservative P0 architecture only. P1/P2 MUST measure actual behavior on the declared browser/OS/architecture matrix. If standards or implementations evolve, capability policy can evolve without changing canonical universe semantics.