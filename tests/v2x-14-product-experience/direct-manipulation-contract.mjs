import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../../src/product/v2x14/product-experience.js',import.meta.url),'utf8');
const raf=[];
const sandbox={console,Math,Number,Object,Array,Set,Map,Promise,JSON,PointerEvent:function PointerEvent(){},navigator:{maxTouchPoints:5},requestAnimationFrame:fn=>{raf.push(fn);return raf.length;},setTimeout:fn=>{raf.push(fn);return raf.length;}};sandbox.globalThis=sandbox;sandbox.OFU={v2x02LivingCameraComposition:{VERSION:'central'}};vm.createContext(sandbox);vm.runInContext(source,sandbox,{filename:'product-experience.js'});
const ux=sandbox.OFU.v2x14ProductExperience;
assert.equal(ux.AUTHORITY,'PRESENTATION_ONLY');
let productInput={activePointers:2,pinchActive:true,lastGesture:'pinch',cancellations:3};
const product={snapshot:()=>({input:productInput}),runtime:{snapshot:()=>({stage:'HUMAN'})}};
let input=ux.directManipulation(product);
assert.equal(input.inputRouterOwner,'CONVERGENCE_OWNER');
assert.equal(input.centralInputStateObserved,true);
assert.equal(input.centralCameraBindingObserved,true);
assert.equal(input.activePointers,2);assert.equal(input.pinchActive,true);assert.equal(input.lastGesture,'pinch');assert.equal(input.touchPoints,5);
assert.equal(input.observesOnly,true);assert.equal(input.routesNativeInput,false);assert.equal(input.callsTravelApi,false);assert.equal(input.callsRendererInput,false);assert.equal(input.preventsDefault,false);assert.equal(input.stopsPropagation,false);assert.equal(input.resourceBounds.continuousPolling,false);assert.equal(input.resourceBounds.eventObserverCount,7);
productInput={activePointers:999,pinchActive:false,lastGesture:'invented',cancellations:-4};input=ux.directManipulation(product);assert.equal(input.activePointers,8);assert.equal(input.lastGesture,null);assert.equal(input.cancellations,0);
function element({attrs={},dataset={},children=[]}={}){const a=new Map(Object.entries(attrs).map(([k,v])=>[k,String(v)])),listeners=new Map();return{dataset,isConnected:true,textContent:'',getAttribute:n=>a.has(n)?a.get(n):null,setAttribute(n,v){a.set(n,String(v));},removeAttribute:n=>a.delete(n),hasAttribute:n=>a.has(n),querySelectorAll:()=>children,addEventListener(type,fn,opts){listeners.set(type,{fn,opts});},removeEventListener(type,fn){const x=listeners.get(type);if(x?.fn===fn)listeners.delete(type);},emit(type){listeners.get(type)?.fn({type});},listeners,attrs:a};}
const scale=element({dataset:{livingScale:'HUMAN'}}),viewport=element({attrs:{'aria-label':'Interactive living universe'}}),rail=element({children:[scale]}),crumbs=element({children:[]});
const doc={getElementById:id=>id==='living-view'?viewport:id==='living-rail'?rail:id==='living-breadcrumbs'?crumbs:null};
productInput={activePointers:0,pinchActive:false,lastGesture:null,cancellations:0};const mounted=ux.mount({document:doc,product});assert(mounted);assert.equal(viewport.getAttribute('data-v2x14-input-owner'),'convergence');assert.equal(viewport.getAttribute('data-v2x14-gesture'),'idle');assert.equal(viewport.getAttribute('data-v2x14-active-pointers'),'0');assert.equal(viewport.getAttribute('data-v2x14-pinch'),'false');assert.equal(viewport.listeners.size,7);for(const {opts} of viewport.listeners.values()){assert.equal(opts.capture,true);assert.equal(opts.passive,true);}
productInput={activePointers:1,pinchActive:false,lastGesture:'drag',cancellations:0};viewport.emit('pointermove');while(raf.length)raf.shift()();assert.equal(viewport.getAttribute('data-v2x14-gesture'),'drag');assert.equal(viewport.getAttribute('data-v2x14-active-pointers'),'1');
productInput={activePointers:1,pinchActive:true,lastGesture:'pinch',cancellations:0};viewport.emit('pointerup');productInput={activePointers:0,pinchActive:false,lastGesture:'pointer-up',cancellations:0};while(raf.length)raf.shift()();assert.equal(viewport.getAttribute('data-v2x14-gesture'),'pointer-up','capture-phase observation must publish state after the central input owner finishes the event');assert.equal(viewport.getAttribute('data-v2x14-active-pointers'),'0');assert.equal(viewport.getAttribute('data-v2x14-pinch'),'false');
viewport.setAttribute('data-v2x14-gesture','external-owner');mounted.dispose();assert.equal(viewport.getAttribute('data-v2x14-gesture'),'external-owner','compare-before-restore must preserve later external mutation');assert.equal(viewport.listeners.size,0,'all passive observers must be removed');
const text=source;for(const forbidden of ['preventDefault(','.travelBy(','.setNavigationCoordinate(','.rotate(','.keyboard('])assert.equal(text.includes(forbidden),false,'V2X-14 observer must not route central input: '+forbidden);
console.log(JSON.stringify({status:'PASS',oracle:'V2X14_DIRECT_MANIPULATION_OBSERVER',eventObserverCount:7,maxObservedPointers:8,continuousPolling:false,centralInputAuthorityPreserved:true}));
