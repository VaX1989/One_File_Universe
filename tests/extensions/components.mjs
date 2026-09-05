import assert from 'node:assert/strict';
import {planComponents,emittedComponent,manifestOf} from '../../tools/extensions/components.mjs';
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
console.log(JSON.stringify({status:'PASS',suite:'px-components',cases}));
