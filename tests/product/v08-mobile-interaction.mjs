import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8').replace(/\r\n?/g,'\n');
const css=read('src/bootstrap/product/mobile.css');
const js=read('src/bootstrap/product/mobile-interaction.js');
const requirePattern=(source,pattern,label)=>{if(!pattern.test(source))throw new Error('Lane D missing '+label)};

for(const [pattern,label] of [
 [/safe-area-inset-top/,'safe-area top handling'],
 [/safe-area-inset-bottom/,'safe-area bottom handling'],
 [/100dvh/,'dynamic viewport units'],
 [/touch-action:\s*pan-y pinch-zoom/,'legacy fallback scroll and pinch arbitration'],
 [/data-ofu-touch-owner="wave-iv-input-router".*touch-action:none/,'application-owned canvas gesture boundary'],
 [/max-width:1100px/,'1024-class composition'],
 [/max-width:820px/,'768-class composition'],
 [/max-width:700px/,'390-class mobile composition'],
 [/max-width:390px/,'390 narrow refinement'],
 [/max-width:360px/,'360-class refinement'],
 [/max-width:340px/,'320-class refinement'],
 [/mobile-sheet-body/,'bottom-sheet composition'],
 [/overscroll-behavior/,'nested scroll containment']
])requirePattern(css,pattern,label);

for(const [pattern,label] of [
 [/seamVersion:3/,'Lane D seam version'],
 [/visualViewport/,'visual viewport adaptation'],
 [/orientationchange/,'orientation handling'],
 [/pointercancel/,'touch cancellation diagnostics'],
 [/aria-expanded/,'bottom-sheet accessibility state'],
 [/\binert\b/,'collapsed-sheet focus suppression'],
 [/content:/,'content URI classification'],
 [/file:/,'file URI classification'],
 [/__OFU_MOBILE_INTERACTION__/,'founder diagnostic seam'],
 [/O\.productUI/,'shared product compatibility API usage'],
 [/mobile-device-diagnostics/,'physical-device retest diagnostics'],
 [/const wasActive=state\.active/,'mobile-mode entry transition tracking'],
 [/if\(focusedInside\)toggle\?\.focus/,'focus-safe collapse on mobile entry']
])requirePattern(js,pattern,label);

if(/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\b/.test(js))throw new Error('Lane D introduced a network API');
if(/O\.(?:p3|p4|p5|p6)|p3Astronomy|p5Planetology|p6Biosphere/.test(js))throw new Error('Lane D crossed scientific authority boundaries');
if(/navigateToRadii\s*\(|retarget\s*\(/.test(js))throw new Error('Lane D must not implement independent target navigation');
if(!/Physical-device status is browser-reported only/.test(js))throw new Error('Lane D diagnostics must not claim physical-device certification');

console.log(JSON.stringify({status:'PASS',lane:'D',mobileArchitecture:'VIEWPORT_FIRST_BOTTOM_SHEET',touchModel:'APPLICATION_CANVAS_ROTATE_AND_PINCH_NATIVE_PANEL_SCROLL',responsiveModeEntry:'FOCUS_SAFE_PEEK',offline:true,scientificAuthorityWrites:0,physicalDeviceClaim:false}));
