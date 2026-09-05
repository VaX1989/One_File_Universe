# Wave IV globe / surface GPU state ownership repair

## Reproduction and classification

Rendering Production run `33957889955`, exact source
`4fc4f270faccdf253f381f38688ed4091f246e04`, passed the integrated journeys
and Firefox startup. Windows Chromium artifact `9966998674` and Linux WebKit
artifact `9966984988` failed the subsequent full-product visual closure with
WebGL error `1282` (`INVALID_OPERATION`) when returning from Human terrain to
the historical near-globe probes. Classification: `RENDERING_DEFECT`, shared
vertex-input state ownership, not a stale framebuffer oracle.

The local instanced pass enabled attribute 1 on the shared default vertex array.
Disposal deleted its instance buffer without disabling that attribute. The globe
pass configured attribute 0 only. An enabled attribute without a buffer makes a
draw invalid even when the active shader does not consume it. The relevant rule
is WebGL 1.0, "Enabled Vertex Attributes and Range Checking"; vertex array state
in WebGL 2 includes enabled attributes, buffer bindings and instancing divisors.
Reference: https://registry.khronos.org/webgl/specs/latest/1.0/

## Correct owner repair

The globe owns one private vertex array. Terrain and instanced microdetail each
own a separate private vertex array. Passes bind only their own arrays and release
them in `finally`. No pass alters the default array's enabled slots or divisors.
Disposal explicitly destroys arrays before buffers. Context loss invalidates the
arrays and auxiliary buffers; restoration creates a fresh accounted generation.
Allocation failure rolls back arrays, programs and auxiliary buffers. Retained
instance storage remains counted even in a frame that does not draw instances.
The surface adapter accepts both the historical TerrainCache and current Map
cache shapes, without relying on the bootstrap compatibility wrapper.

The independent Node state-machine oracle reproduces the old invalid draw, then
executes eight globe / instanced Human / Regional / Human / globe cycles through
the actual renderer functions. It also checks poisoned foreign default state,
context restoration, exact deletion/invalidation accounting and failed allocation
cleanup. This is specification-level state evidence, NOT a GPU measurement.

## Browser acceptance

The full-product visual campaign retains every globe and local mesh/framebuffer
coverage assertion, historical probe, repeated scale cycle, platform and witness
check. It additionally measures private/default vertex state and exercises local
context loss/restoration wherever the extension is available. Restored local
terrain must again pass independent CPU-triangle versus framebuffer coverage.
The seal rejects absent recovery records, missing recovered terrain and leaked
instance attributes. Schema fixtures are explicitly non-runtime evidence.

Local targeted Node checks and two working-tree builds passed before commit.
They do not certify the final commit, direct-file execution, GPU pixels or a
physical device. Exact-head hosted tests remain the promotion evidence. No
scientific model, protected status, required browser or historical release is
changed by this repair.
