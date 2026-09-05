import assert from 'node:assert/strict';

/**
 * Exercise input ownership, not a historical CSS value in isolation.
 * Portable PointerEvents certify routing; Chromium additionally drives trusted
 * touch input through the browser. Neither is physical-device certification.
 */
export async function assertApplicationTouchOwnership(page, {browserName, context}) {
  const read = () => page.evaluate(() => {
    const P = globalThis.__OFU_PLANET_PREVIEW__, R = OFU.waveIVScaleRuntime;
    const I = OFU.waveIVInputRouter.snapshot(), canvas = document.getElementById('planet-view');
    const mobile = globalThis.__OFU_MOBILE_INTERACTION__?.snapshot();
    return {
      installed: I.initialized && I.touchOwnedByApplication,
      owner: canvas.dataset.ofuTouchOwner,
      touchAction: getComputedStyle(canvas).touchAction,
      activePointers: I.activePointers, pointerActive: I.pointerActive,
      previewPointerActive: P.pointerActive,
      drags: I.pointerIntents, pinches: I.pinchIntents,
      cancels: I.pointerCancels, lostCaptures: I.lostPointerCaptures, resets: I.pointerResets,
      distance: R.snapshot().distanceIntentRadii, stage: R.snapshot().semanticScale,
      commands: R.snapshot().cameraCommandCount, direction: [...P.camera.targetDirection],
      planetId: P.provider.planetId,
      environmentDigest: P.snapshot().environment.digest,
      eligibilityDigest: P.snapshot().p6.witnessDigest,
      visualScale: visualViewport?.scale || 1, scroll: [scrollX, scrollY],
      mobileOwner: mobile?.input.gestureOwner, mobileCancels: mobile?.input.canvasPointerCancels
    };
  });
  const initial = await read();
  assert(initial.installed, 'application input owner must be installed');
  assert.equal(initial.owner, 'wave-iv-input-router');
  assert.equal(initial.mobileOwner, 'wave-iv-input-router');
  assert.equal(initial.touchAction, 'none', 'native canvas pinch would steal scale travel');
  assert.equal(initial.activePointers, 0, 'gesture must start idle');
  assert(['orbit', 'approach'].includes(initial.stage), 'test requires a planet stage');
  const point = async (type, id, x, y) => page.evaluate(({type, id, x, y}) => {
    const canvas = document.getElementById('planet-view'), r = canvas.getBoundingClientRect();
    const e = new PointerEvent(type, {pointerId: id, pointerType: 'touch', isPrimary: id === 7001,
      clientX: r.left + r.width / 2 + x, clientY: r.top + r.height / 2 + y,
      bubbles: true, cancelable: true, button: 0,
      buttons: type === 'pointerup' || type === 'pointercancel' ? 0 : 1});
    canvas.dispatchEvent(e);
    return {defaultPrevented: e.defaultPrevented};
  }, {type, id, x, y});
  const idle = async label => {
    const s = await read();
    assert.equal(s.activePointers, 0, label + ': no stale pointers');
    assert.equal(s.pointerActive, false, label + ': router idle');
    assert.equal(s.previewPointerActive, false, label + ': preview idle');
    return s;
  };
  let native = {status: 'NOT_MEASURED', reason: 'ENGINE_HAS_NO_CDP_TOUCH_INJECTION'};
  try {
    assert((await point('pointerdown', 7001, -50, 0)).defaultPrevented);
    let s = await read();
    assert.equal(s.activePointers, 1); assert(s.previewPointerActive);
    const beforeDrag = s;
    assert((await point('pointermove', 7001, -26, 8)).defaultPrevented);
    s = await read();
    assert.notDeepEqual(s.direction, beforeDrag.direction, 'drag must rotate the camera');
    assert.equal(s.drags, beforeDrag.drags + 1, 'one drag routed exactly once');
    assert.equal(s.commands, beforeDrag.commands + 1, 'one camera owner per drag');
    await point('pointerdown', 7002, 50, 0);
    const beforePinch = await read(); assert.equal(beforePinch.activePointers, 2);
    await point('pointermove', 7002, 60, 0);
    s = await read();
    assert.equal(s.pinches, beforePinch.pinches + 1, 'pinch routed exactly once');
    assert.equal(s.drags, beforePinch.drags, 'pinch must not also rotate');
    assert(s.distance < beforePinch.distance, 'spreading fingers travels toward the planet: '+JSON.stringify({before:beforePinch,after:s}));
    await point('pointercancel', 7002, 60, 0);
    s = await read();
    assert.equal(s.activePointers, 1, 'cancelling one finger preserves the remaining finger');
    assert.equal(s.cancels, initial.cancels + 1);
    assert.equal(s.mobileCancels, s.cancels, 'diagnostics must follow the actual input owner');
    await point('lostpointercapture', 7002, 60, 0);
    assert.equal((await read()).previewPointerActive, true, 'late lost capture must not clear the other finger');
    const resume = s;
    await point('pointermove', 7001, -22, 9);
    s = await read();
    assert.equal(s.drags, resume.drags + 1, 'remaining finger resumes a single drag');
    assert.notDeepEqual(s.direction, resume.direction);
    await point('lostpointercapture', 7001, -22, 9);
    const lost = await idle('lost capture');
    assert.equal(lost.lostCaptures, initial.lostCaptures + 1);
    await point('pointermove', 7001, 90, 60);
    assert.deepEqual((await read()).direction, lost.direction, 'lost finger must not keep rotating');
    await point('pointerdown', 7001, -40, 0);
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    const blurred = await idle('window blur');
    assert.equal(blurred.resets, initial.resets + 1);
    await point('pointerdown', 7001, -40, 0);
    await point('pointerup', 7001, -40, 0);
    await idle('normal release');

    if (browserName === 'chromium') {
      const session = await context.newCDPSession(page);
      await page.evaluate(() => {
        const counts = {down: 0, move: 0, up: 0, cancel: 0};
        const listener = e => {
          if (e.target.id !== 'planet-view' || !e.isTrusted || e.pointerType !== 'touch') return;
          counts[({pointerdown: 'down', pointermove: 'move', pointerup: 'up', pointercancel: 'cancel'})[e.type]]++;
        };
        for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'])
          document.addEventListener(type, listener, true);
        globalThis.__OFU_TOUCH_ORACLE__ = {counts, listener};
      });
      try {
        const box = await page.locator('#planet-view').boundingBox(); assert(box);
        const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
        const points = span => [{x: cx - span, y: cy, id: 1}, {x: cx + span, y: cy, id: 2}];
        const before = await read();
        await session.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: points(50)});
        for (const span of [52, 54, 56, 58, 60])
          await session.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: points(span)});
        await session.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
        const after = await idle('trusted browser touch');
        const counts = await page.evaluate(() => globalThis.__OFU_TOUCH_ORACLE__.counts);
        assert.equal(counts.down, 2); assert(counts.move > 0); assert.equal(counts.up, 2);
        assert.equal(counts.cancel, 0, 'browser must not steal application-owned canvas gestures');
        assert(after.pinches > before.pinches && after.distance < before.distance);
        assert.equal(after.visualScale, before.visualScale, 'canvas pinch must not zoom the document');
        assert.deepEqual(after.scroll, before.scroll, 'canvas pinch must not scroll the document');
        native = {status: 'PASS', method: 'TRUSTED_CHROMIUM_CDP_TOUCH', counts};
      } finally {
        await session.send('Input.dispatchTouchEvent', {type: 'touchCancel', touchPoints: []}).catch(() => {});
        await session.detach();
        await page.evaluate(() => {
          const oracle = globalThis.__OFU_TOUCH_ORACLE__;
          for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'])
            document.removeEventListener(type, oracle.listener, true);
          delete globalThis.__OFU_TOUCH_ORACLE__;
        });
      }
    }
    const final = await idle('completed conformance');
    for (const k of ['planetId', 'environmentDigest', 'eligibilityDigest'])
      assert.equal(final[k], initial[k], k + ' must not change during gestures');
    const panelPolicy = await page.evaluate(() => ({
      touchAction: getComputedStyle(document.querySelector('.mobile-sheet-body')).touchAction,
      overflowY: getComputedStyle(document.querySelector('.mobile-sheet-body')).overflowY,
      bodyTouchAction: getComputedStyle(document.body).touchAction
    }));
    assert.notEqual(panelPolicy.touchAction, 'none', 'panel retains native gesture access');
    assert.notEqual(panelPolicy.bodyTouchAction, 'none', 'ownership must not disable gestures document-wide');
    return {status: 'PASS', owner: initial.owner, touchAction: initial.touchAction,
      portableMethod: 'POINTER_EVENT_ROUTING_CONFORMANCE',
      rotate: true, pinch: true, singleOwner: true, cancel: true, lostCapture: true,
      blurCleanup: true, canonicalNonInterference: true, panelPolicy, native,
      physicalDevice: 'NOT_VERIFIED'};
  } finally {
    await page.evaluate(({stage, direction}) => {
      window.dispatchEvent(new Event('blur'));
      OFU.waveIVScaleRuntime.requestStage(stage, {source: 'touch-oracle-restore', transition: false});
      OFU.waveIVScaleRuntime.dispatchCameraIntent({kind: 'rotate-drag', baseDirection: direction, dx: 0, dy: 0},
        {source: 'touch-oracle-restore'});
    }, {stage: initial.stage, direction: initial.direction});
  }
}
