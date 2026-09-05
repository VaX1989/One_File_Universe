"""Wave A visible-controls journey against the actual production single-file build.

FILE_DIRECT is the default and is required for release/convergence evidence.
LOCAL_CONTENT is an explicitly labelled diagnostic mode for managed browsers that
block file URLs; it is never counted as direct-open or GPU evidence.
"""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path
import time
from typing import Any
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[3]
HTML = ROOT / 'dist' / 'One_File_Universe.html'
OUT = ROOT / 'reports' / 'wave-a' / 'browser'
OUT.mkdir(parents=True, exist_ok=True)
MODE = os.environ.get('OFU_BROWSER_MODE', 'FILE_DIRECT')
REQUIRE_GPU = os.environ.get('OFU_REQUIRE_GPU', '1' if MODE == 'FILE_DIRECT' else '0') == '1'
EXE = os.environ.get('OFU_CHROMIUM_EXECUTABLE')
errors: list[str] = []
console_errors: list[str] = []
requests: list[str] = []
checks: list[dict[str, Any]] = []
journeys: list[dict[str, Any]] = []


def check(value: Any, message: str) -> None:
    assert value, message
    checks.append({'assertion': message, 'status': 'PASS'})
    print('PASS:', message, flush=True)


def js(page, expression: str) -> Any:
    return page.evaluate('()=>{const p=OFU.v1LivingProduct,r=p.runtime,s=r.snapshot();return (' + expression + ');}')


def ready(page, stage: str | None = None) -> None:
    page.wait_for_function('!!window.OFU?.v1LivingProduct', timeout=60000)
    page.evaluate('async()=>{await OFU.v1LivingProduct.ready();}')
    page.wait_for_function('()=>{const p=OFU.v1LivingProduct;return p.snapshot().uiError||p.snapshot().render.readyRevision===p.runtime.snapshot().revision}', timeout=60000)
    error = js(page, 'p.snapshot().uiError')
    check(error is None, 'UI remains error-free' + (': ' + str(error) if error else ''))
    if stage:
        check(js(page, 's.stage') == stage, 'Visible stage is ' + stage)


def click_action(page, name: str, stage: str | None = None) -> None:
    page.locator('[data-living-action="' + name + '"]').click()
    ready(page, stage)


def scale(page, name: str) -> None:
    page.locator('#living-rail [data-living-scale="' + name + '"]').click()
    ready(page, name)


def entity(page, entity_id: str, stage: str | None = None) -> None:
    page.locator('#living-panel [data-living-entity="' + entity_id + '"]').first.click()
    ready(page, stage)


def picture(page, name: str) -> None:
    page.locator('#living-stage').screenshot(path=str(OUT / (name + '.png')))


def info(page) -> dict[str, Any]:
    return js(page, '''({stage:s.stage,world:s.world?.planetIdentity,galaxy:s.galaxy?.canonicalId,
      system:s.system?.canonicalId,point:s.point,selected:s.selectedObjectId,
      worldClass:s.world?.planetology.bulkPriorClass,life:s.world?.biology.occupancy.biosphereEstablished,
      civilization:s.world?.civilization.state,settlements:s.world?.civilization.settlements.length,
      historyDepth:s.historyDepth,objects:s.local?.objects.map(x=>({id:x.entityId,kind:x.kind})),
      micro:s.micro?{regime:s.micro.current.regime,sourceId:s.micro.current.sourceEntityId,atomCount:s.micro.current.atomCount}:null})''')


def coordinates(page, lat: float, lon: float, target: str | None = None) -> None:
    page.locator('#living-lat').fill(str(lat))
    page.locator('#living-lon').fill(str(lon))
    click_action(page, 'go-coordinates', target)


def choose_first_system(page) -> dict[str, Any]:
    for _ in range(8):
        row = js(page, "s.rows.filter(n=>n.kind==='system'&&Number(n.metadata.facts.planetCount)>0).map(n=>({id:n.canonicalId,count:Number(n.metadata.facts.planetCount)}))[0]||null")
        if row:
            entity(page, row['id'], 'SYSTEM')
            return row
        next_exists = js(page, 's.page?.nextCursor!=null')
        click_action(page, 'next-page' if next_exists else 'next-window')
    raise AssertionError('No planet-bearing system in eight bounded pages')


def micro_roundtrip(page, kind: str, screenshot: str | None = None) -> None:
    source = js(page, "s.local.objects.filter(x=>x.kind===" + json.dumps(kind) + ").map(x=>({id:x.entityId,point:x.location.locationIdentity}))[0]||null")
    check(source is not None, 'Actual local ' + kind + ' exists')
    entity(page, source['id'])
    before = info(page)
    click_action(page, 'inspect-material', 'MATERIAL')
    for target in ['MICROSTRUCTURE', 'MOLECULAR', 'ATOMIC']:
        click_action(page, 'deeper', target)
    current = js(page, 's.micro.current')
    # All contexts are source-bound, including honestly unknown chemistry.
    check(js(page, 's.selectedObjectId') == source['id'], kind + ' source identity survives every micro regime')
    check(js(page, 's.point.locationIdentity') == source['point'], kind + ' location survives every micro regime')
    check(current.get('atomCount', 0) <= 96, kind + ' atomic representation is bounded')
    if kind == 'WATER':
        check(current.get('atomCount', 0) > 0, 'Actual water yields nonempty modeled H2O representation')
    if screenshot:
        picture(page, screenshot)
    for _ in range(4):
        click_action(page, 'back')
    after = info(page)
    check(after['stage'] == before['stage'] and after['world'] == before['world'] and after['point'] == before['point'] and after['selected'] == before['selected'], kind + ' exact outward context restored')
    journeys.append({'journey': kind + ' material-to-atomic roundtrip', 'source': source['id'], 'world': before['world'], 'point': before['point'], 'atomCount': current.get('atomCount', 0)})


def attach(page) -> None:
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: console_errors.append(m.text) if m.type == 'error' else None)
    def route_handler(route):
        requests.append(route.request.url)
        route.abort()
    page.route('http://**/*', route_handler)
    page.route('https://**/*', route_handler)
    if MODE == 'LOCAL_CONTENT':
        page.set_content(HTML.read_text(encoding='utf-8'), wait_until='load')
    else:
        page.goto(HTML.as_uri(), wait_until='load')
    ready(page, 'UNIVERSE')


start = time.monotonic()
result: dict[str, Any] = {'status': 'RUNNING', 'mode': MODE, 'directOpenEvidence': MODE == 'FILE_DIRECT', 'artifactSha256': hashlib.sha256(HTML.read_bytes()).hexdigest()}
try:
    with sync_playwright() as pw:
        launch = {'headless': True, 'args': ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']}
        if EXE:
            launch['executable_path'] = EXE
        browser = pw.chromium.launch(**launch)
        context = browser.new_context(viewport={'width': 1440, 'height': 960}, offline=True)
        page = context.new_page()
        attach(page)
        roots = js(page, 's.rows.map(n=>({id:n.canonicalId,kind:n.kind}))')
        check(len(roots) >= 3, 'Multiple real galaxies visible at launch')
        picture(page, '01-universe')
        selected_galaxy = roots[2]['id']
        entity(page, selected_galaxy, 'GALAXY')
        first_region = js(page, 's.rows[0].entityId')
        entity(page, first_region, 'REGION')
        scale(page, 'NEIGHBORHOOD')
        choose_first_system(page)
        first_planet = js(page, "s.rows.filter(n=>n.kind==='planet')[0].canonicalId")
        entity(page, first_planet, 'ORBIT')
        baseline = info(page)
        check(baseline['galaxy'] == selected_galaxy, 'Non-bootstrap galaxy context reaches actual planet')
        picture(page, '02-first-world')
        for _ in range(3):
            page.locator('#living-search-goal').select_option('CIVILIZATION')
            page.locator('[data-living-action="survey"]').click()
            page.wait_for_function('!OFU.v1LivingProduct.snapshot().search.running', timeout=180000)
            ready(page)
            if js(page, 'p.snapshot().search.results'):
                break
        survey = js(page, 'p.snapshot().search')
        check(survey['results'] > 0, 'Actual bounded non-bootstrap survey finds civilization-bearing world')
        page.locator('#living-search-results [data-living-entity]').first.click()
        ready(page, 'ORBIT')
        positive = info(page)
        check(positive['galaxy'] == selected_galaxy and positive['life'] and positive['settlements'] > 0, 'Survey result has real local life and terrain-backed civilization in chosen galaxy')
        picture(page, '03-living-orbit')
        scale(page, 'APPROACH')
        scale(page, 'GLOBAL_SURFACE')
        coordinates(page, 12.345678, -45.678901, 'GLOBAL_SURFACE')
        anchor = info(page)['point']
        for band in ['REGIONAL_SURFACE', 'LOCAL_SURFACE', 'HUMAN']:
            scale(page, band)
            check(info(page)['point'] == anchor, band + ' keeps arbitrary exact surface coordinates')
        settlement = js(page, 's.world.civilization.settlements[0].settlementId')
        entity(page, settlement, 'HUMAN')
        local = info(page)
        check(any(x['kind'] == 'ORGANISM' for x in local['objects']), 'Visible settlement context includes environmentally eligible organisms')
        check(any(x['kind'] == 'ARTIFACT' for x in local['objects']), 'Manufactured material comes from actual settlement technology')
        picture(page, '04-terrain-life-civilization')
        for kind in ['ROCK', 'ORGANISM', 'ARTIFACT']:
            micro_roundtrip(page, kind, '05-' + kind.lower() + '-atomic')
        # A real hydrology sample, not a supplied water fixture, supplies the selected water location.
        wet = js(page, '''(()=>{const W=OFU.v1WorldContext,w=s.world;for(let la=-60000000;la<=60000000;la+=15000000)for(let lo=-180000000;lo<180000000;lo+=20000000){const p=W.location(w.planetIdentity,la,lo);if(W.sample(w.planetology,p).hydrology.surfaceLiquid)return p;}return null;})()''')
        check(wet is not None, 'Hydrology exposes actual liquid water on living world')
        coordinates(page, wet['latMicroDeg'] / 1e6, wet['lonMicroDeg'] / 1e6, 'HUMAN')
        micro_roundtrip(page, 'WATER', '06-water-atomic')
        original_identity = info(page)['world']
        p4_history = js(page, 'OFU.pxProduct.captured(s.body.canonicalKey).selection.time.historyDigest')
        for epoch in [0, 60, 12]:
            page.locator('#living-history').evaluate('(e,n)=>{e.value=String(n);e.dispatchEvent(new Event("change",{bubbles:true}));}', epoch)
            ready(page)
            check(info(page)['world'] == original_identity, 'Historical projection preserves planet identity at epoch ' + str(epoch))
            check(js(page, 's.world.civilization.epoch') == epoch, 'Requested history epoch is rendered')
            check(js(page, 'OFU.pxProduct.captured(s.body.canonicalKey).selection.time.historyDigest') == p4_history, 'Model history controls do not write P4 history')
        picture(page, '07-model-history')
        scale(page, 'SYSTEM')
        positive_system = info(page)['system']
        scale(page, 'GALAXY')
        check(info(page)['galaxy'] == selected_galaxy, 'Deep journey returns to original non-bootstrap galaxy')
        journeys.append({'journey': 'visible non-bootstrap founder journey', 'galaxy': selected_galaxy, 'world': positive['world'], 'system': positive_system, 'boundedSurvey': survey})
        # A second genuinely different branch, with no assumed biosphere or civilization.
        scale(page, 'UNIVERSE')
        entity(page, roots[1]['id'], 'GALAXY')
        entity(page, js(page, 's.rows[0].entityId'), 'REGION')
        scale(page, 'NEIGHBORHOOD')
        choose_first_system(page)
        bodies = js(page, "s.rows.filter(n=>n.kind==='planet').map(n=>({id:n.canonicalId,worldClass:n.metadata.facts.bulkPriorClass}))")
        observed_classes = {positive['worldClass'], baseline['worldClass']}
        sterile = None
        for body in bodies[:6]:
            entity(page, body['id'], 'ORBIT')
            sample = info(page)
            observed_classes.add(sample['worldClass'])
            if not sample['life']:
                sterile = sample
                break
            scale(page, 'SYSTEM')
        if sterile is None:
            page.locator('#living-search-goal').select_option('STERILE')
            page.locator('[data-living-action="survey"]').click()
            page.wait_for_function('!OFU.v1LivingProduct.snapshot().search.running', timeout=180000)
            page.locator('#living-search-results [data-living-entity]').first.click()
            ready(page, 'ORBIT')
            sterile = info(page)
            observed_classes.add(sterile['worldClass'])
        check(not sterile['life'] and sterile['settlements'] == 0, 'Actual sterile branch has neither life nor civilization')
        if sterile['worldClass'] in ['GAS_GIANT', 'ICE_GIANT']:
            check(page.locator('[data-living-scale="GLOBAL_SURFACE"]').is_disabled(), 'Gas world rejects solid-surface descent')
            scale(page, 'APPROACH')
            click_action(page, 'deeper', 'LOCAL_SURFACE')
            check(all(x['kind'] == 'ATMOSPHERE' for x in info(page)['objects']), 'Gas inspection uses atmosphere only')
        else:
            scale(page, 'HUMAN')
            check(not any(x['kind'] in ['ORGANISM', 'SETTLEMENT', 'ARTIFACT'] for x in info(page)['objects']), 'Sterile local view does not fabricate inhabitants')
            rock = next((x for x in info(page)['objects'] if x['kind'] in ['ROCK', 'ICE']), None)
            check(rock is not None, 'Sterile world still has inspectable actual material')
            micro_roundtrip(page, rock['kind'])
        picture(page, '08-sterile-world')
        journeys.append({'journey': 'alternative sterile galaxy branch', **sterile})
        # Repeated restoration uses actual runtime bounds; no whole-world or atom enumeration.
        state = js(page, 'p.snapshot().render')
        check(state['mapCacheEntries'] <= 2 and state['metrics']['maxMapCells'] <= 4608, 'Visible world texture cache and samples bounded')
        check(state['metrics']['maxTerrainCells'] <= 192, 'Visible terrain samples bounded')
        check(js(page, 's.historyDepth<=64&&s.discoveryCacheEntries<=12&&s.traversal.indexedNodes<=256'), 'Navigation history, discovery cache, entity index bounded')
        gpu = state['gpu']
        if REQUIRE_GPU:
            check(gpu is not None and state['gpuError'] is None, 'WebGL2 compiles and renders actual world without fallback')
            check(gpu['allocatedPrograms']==2 and gpu['allocatedBuffers']==1 and gpu['allocatedTextures']==1, 'Measured renderer allocations remain bounded at two programs, one buffer, one texture')
        result['gpuEvidence'] = gpu is not None and state['gpuError'] is None
        result['gpu'] = gpu
        result['gpuFallbackReason'] = state['gpuError']
        result['renderMetrics'] = state['metrics']
        result['worldClassesObserved'] = sorted(observed_classes)
        picture(page, '09-final-desktop')
        # Touch-sized product, actual viewport pick and keyboard path, not an API navigation fixture.
        mobile_context = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1, is_mobile=True, has_touch=True, offline=True)
        mobile = mobile_context.new_page()
        attach(mobile)
        mobile_roots = js(mobile, 's.rows.map(x=>x.canonicalId)')
        mobile.locator('.mobile-sheet-toggle').tap()
        check(mobile.locator('.mobile-sheet-toggle').get_attribute('aria-expanded') == 'true', 'Touch expands the actual mobile exploration sheet')
        entity(mobile, mobile_roots[1], 'GALAXY')
        check(js(mobile, 'document.documentElement.scrollWidth<=window.innerWidth+2'), 'Mobile page has no horizontal overflow')
        mobile.locator('.mobile-sheet-toggle').tap()
        mobile.locator('#living-view').focus()
        mobile.keyboard.press('Home')
        ready(mobile, 'UNIVERSE')
        check(js(mobile, 's.galaxy===null'), 'Keyboard Home restores universe root without stale selection')
        picture(mobile, '10-mobile-universe')
        journeys.append({'journey': 'mobile visible controls and keyboard root return', 'viewport': [390, 844], 'physicalDevice': False})
        check(not errors, 'No uncaught browser script errors')
        check(not console_errors, 'No browser console errors')
        check(not requests, 'Single-file execution makes no HTTP or HTTPS requests')
        result['status'] = 'PASS'
        browser.close()
except Exception as exc:
    result['status'] = 'FAIL'
    result['failure'] = str(exc)
    raise
finally:
    result.update({'seconds': round(time.monotonic() - start, 3), 'checks': checks, 'journeys': journeys, 'pageErrors': errors, 'consoleErrors': console_errors, 'networkRequests': requests})
    (OUT / 'journey.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k: v for k, v in result.items() if k not in ['checks', 'journeys']}, indent=2))
