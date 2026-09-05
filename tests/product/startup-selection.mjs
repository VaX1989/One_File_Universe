import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Execute the real bootstrap against a minimal DOM, independent of browser form
// restoration policy. Canonical resolvers are test doubles: this certifies startup
// ownership, not astronomy. Existing P1-P6 conformance covers the scientific code.
const source = fs.readFileSync('src/bootstrap/ofu-inspector.js', 'utf8');
const types = ['Region', 'Galaxy', 'Sector', 'System', 'Star', 'Planet', 'Moon'];
const preview = {galaxyX:'48',galaxyY:'-50',galaxyZ:'-1',sectorX:'0',sectorY:'0',sectorZ:'0',siteX:'61',siteY:'0',siteZ:'0',orbitSlot:'0'};
function fixture(restored, {rendering = true, malformed = false, wrongIdentity = false} = {}) {
  const nodes = new Map(), documentListeners = [], windowListeners = [];
  class Element {
    constructor(id = '') { this.id = id; this.value = ''; this.options = []; this.listeners = {}; this.children = []; this.textContent = ''; }
    append(...children) { for (const child of children) { this.children.push(child); if (child.id) nodes.set(child.id, child); for (const nested of child.children) if (nested.id) nodes.set(nested.id, nested); } }
    addEventListener(name, callback) { this.listeners[name] = callback; }
  }
  const node = id => { if (!nodes.has(id)) nodes.set(id, new Element(id)); return nodes.get(id); };
  const selector = node('entity-type');
  selector.options = types.map(value => ({value, defaultSelected: value === 'System'}));
  selector.value = restored;
  const O = {
    BASELINE_BUILD: {sourceCommit:'test-source', componentManifestHash:'test-components', ...(rendering ? {rendering:{previewPlanetKey:{...preview, ...(malformed ? {siteX:'not-an-integer'} : {})}, previewPlanetId:wrongIdentity?'wrong':'Planet:61'}} : {})},
    BASELINE_EMBEDDED_COMPONENTS: [],
    p2: {hex: value => String(value), universeIdentity: () => ({digest:'universe'})},
    sha256: {hex: () => 'test-hash'},
    p3Astronomy: {VERSION:'test-double', SCHEMA_VERSION:1, BASELINE_EPOCH:'T0', semanticManifestHash:()=>'manifest', digestFact: r=>r.id, canonicalEnvelope:r=>r},
    p4: {VERSION:'test-double', CORE_TRANSITION_DESCRIPTOR:{semanticVersion:'test-version'}}
  };
  for (const type of types) O.p3Astronomy['resolve'+type] = (_ctx,key) => ({status:'PRESENT', id:type+':'+String(key.siteX??0n), facts:{}});
  const sandbox = {OFU:O, TextEncoder, Uint8Array, document:{getElementById:node, createElement:()=>new Element(), addEventListener:(_name,callback)=>documentListeners.push(callback)}, addEventListener:(_name,callback)=>windowListeners.push(callback)};
  sandbox.globalThis = sandbox;
  vm.runInNewContext(source, sandbox, {filename:'ofu-inspector.js'});
  assert.equal(windowListeners.length, 0, 'bootstrap cannot run after document-level preview listeners');
  assert.equal(documentListeners.length, 1);
  return {sandbox, O, node, start:()=>documentListeners[0]()};
}
for (const restored of types) {
  for (const rendering of [true,false]) {
    const f=fixture(restored,{rendering});f.start();
    assert.equal(f.sandbox.__OFU_BASELINE_REPORT__.status,'READY');
    const current=f.O.inspectorTest.state.current;
    assert.equal(current.type,rendering?'Planet':'System');
    assert.equal(current.key.siteX,rendering?61n:8n);
    if(rendering)assert.deepEqual(Object.fromEntries(Object.entries(current.key).map(([k,v])=>[k,String(v)])),preview);
    // The deterministic boot selection is not a lock on subsequent user queries.
    f.node('entity-type').value='Planet';f.node('entity-type').listeners.change();f.node('f-siteX').value='98';
    f.O.inspectorTest.query();assert.equal(f.O.inspectorTest.state.current.key.siteX,98n);
  }
}
for(const options of [{malformed:true},{wrongIdentity:true}]){
 const f=fixture('Planet',options);assert.throws(f.start,/startup planet/);
 assert.equal(f.sandbox.__OFU_BASELINE_REPORT__.status,'FAIL');
}
console.log(JSON.stringify({status:'PASS',oracle:'STARTUP_SELECTION_OWNER',restoredEntityTypes:types.length,renderingAndInspectorOnly:true,userQueryNotOverridden:true,invalidManifestFailsClosed:true,bootstrapOrder:'DOCUMENT_BEFORE_PREVIEW',canonicalScienceClaim:false}));
