import assert from 'node:assert/strict';
import {planComponents,loadComponents,emittedComponent,manifestOf,addComponents} from '../../tools/extensions/components.mjs';
let cases=0;
const fixture=(id,overrides={})=>({id,version:'1.0.0',owner:'test',kind:'code',stage:'foundation',placement:'script',source:'src/test/'+id+'.js',dependencies:[],authority:'DERIVED',provenance:'synthetic fixture',provides:[id],...overrides});
const read=()=>Buffer.from('globalThis.fixture=1;');
const a=fixture('test.a'),b=fixture('test.b',{dependencies:['test.a']}),opts={read};
const first=planComponents([b,a],opts),second=planComponents([a,b],opts);assert.deepEqual(manifestOf(first),manifestOf(second));cases++;
const bad=(ds,pattern)=>{assert.throws(()=>planComponents(ds,opts),pattern);cases++;};
bad([a,a],/duplicate/);bad([b],/missing dependency/);bad([{...a,dependencies:['test.b']},b],/cycle/);bad([a,{...b,provides:['test.a']}],/collision/);
bad([{...a,source:'../bad'}],/unsafe/);bad([{...a,authority:'CANONICAL_PROVEN'}],/promotion/);bad([{...a,authority:'UNKNOWN'}],/authority/);
bad([{...a,stage:'full'},b],/future-stage/);bad([{...a,placement:'style'}],/mismatch/);bad([{...a,extra:true}],/schema/);
for(const kind of ['code','style','glsl','wgsl','worker','html','table','data','compressed','image','audio']) {
 const binary=['compressed','image','audio'].includes(kind),placement=kind==='code'?'script':kind==='style'?'style':kind==='html'?'body':'resource',text=kind==='data'||kind==='table'?'{"x":"</script>"}':kind==='code'||kind==='worker'?'const x="</script>";':kind==='html'?'<p>Test</p>':'x';
 const plan=planComponents([fixture('test.resource',{kind,placement,authority:'PRESENTATION_ONLY'})],{read:()=>Buffer.from(text)}),rendered=emittedComponent(plan[0]);
 assert(rendered.length>0);if(placement==='resource'){assert(!rendered.includes('"</script>"'));assert.equal(plan[0].encoding,binary?'base64':'utf-8');}cases++;
}
assert.throws(()=>planComponents([a],{read:()=>Buffer.from('broken{')}),SyntaxError);cases++;
assert.throws(()=>planComponents([a],{read,maxBytes:1}),/byte budget/);cases++;
{
 const replacementTokens="globalThis.tokens={root:'$',suffix:\"$'\",match:'$&',prefix:'$`'};";
 const component=planComponents([fixture('test.replace-tokens')],{read:()=>Buffer.from(replacementTokens)})[0];
 const baseHtml='<!doctype html><html><head><style>base</style></head><body><main>fixture</main></body></html>';
 const composed=addComponents(baseHtml,[component],'foundation');
 assert(composed.includes(replacementTokens),'component source containing String.replace tokens must be emitted byte-for-byte');
 assert.equal((composed.match(/<\/html>/g)||[]).length,1,'component injection must not duplicate document suffix');
 cases+=2;
}
const integrated=loadComponents();assert(integrated.length>0,'live component manifests must compose');assert.equal(new Set(integrated.map(component=>component.id)).size,integrated.length,'live component ids must remain unique');cases+=2;
console.log(JSON.stringify({status:'PASS',suite:'px-components',cases,integratedComponents:integrated.length}));
