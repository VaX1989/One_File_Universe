import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
const ROOT=path.resolve(import.meta.dirname,'../..');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const lex=(a,b)=>a<b?-1:a>b?1:0;
const kinds=new Set(['code','style','glsl','wgsl','worker','html','table','data','compressed','image','audio']);
const authorities=new Set(['CANONICAL_PROVEN','DERIVED','MODEL_DERIVED_SIMULATION','PRESENTATION_ONLY','MEASURED_RUNTIME_EVIDENCE']);
const fields=['id','version','owner','kind','stage','placement','source','dependencies','authority','provenance','provides'];
function check(ok,message){if(!ok)throw new Error('PX component: '+message);}
function identifier(v){return typeof v==='string'&&/^[a-z][a-z0-9._:/-]{0,127}$/.test(v);}
function ownerAllows(owner,source){if(!/^[a-z][a-z0-9_-]{0,63}$/.test(owner))return false;const prefixes=owner==='px'?['src/extensions/','config/extensions/','config/conformance/']:owner==='product'?['src/bootstrap/product/','src/rendering/']:['src/domains/'+owner+'/','src/providers/'+owner+'/','src/'+owner+'/','assets/'+owner+'/','data/'+owner+'/','config/extensions/'+owner+'/'];return prefixes.some(p=>source.startsWith(p))||source==='config/extensions/'+owner+'.json';}
function relative(v){return typeof v==='string'&&v.length<=256&&/^[A-Za-z0-9_./-]+$/.test(v)&&!v.startsWith('/')&&!v.split('/').some(s=>s==='..'||s==='.'||s==='');}
export function planComponents(inputs,{root=ROOT,read=rel=>fs.readFileSync(path.join(root,rel)),maxBytes=64*1024*1024}={}) {
  check(Array.isArray(inputs)&&inputs.length>0&&inputs.length<=512,'bounded component list required');
  const entries=new Map(),claims=new Map(),outputIds=new Set();let totalBytes=0;
  for(const input of inputs){
    check(input&&typeof input==='object'&&!Array.isArray(input),'component object');
    check(Object.keys(input).length===fields.length&&fields.every(k=>Object.hasOwn(input,k)),'exact component schema');
    const d=JSON.parse(JSON.stringify(input));
    check(identifier(d.id)&&identifier(d.owner)&&typeof d.version==='string'&&/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.test(d.version),'identity/version/owner');
    check(kinds.has(d.kind)&&['foundation','full'].includes(d.stage)&&authorities.has(d.authority),'kind/stage/authority');
    check(relative(d.source),'unsafe source path');check(ownerAllows(d.owner,d.source),'owner/source mismatch');
    check(['src/','config/','assets/','data/'].some(p=>d.source.startsWith(p)),'source outside component roots');
    check(typeof d.provenance==='string'&&d.provenance.length>0&&d.provenance.length<=2048,'provenance');
    check(['script','style','resource','body','fragment:workspace-nav','fragment:viewport','fragment:explore-panel','fragment:inspect-panel','fragment:lab-panel'].includes(d.placement),'placement');
    check(d.kind==='code'?d.placement==='script':d.kind==='style'?d.placement==='style':d.kind==='html'?d.placement==='body'||d.placement.startsWith('fragment:'):d.placement==='resource','kind/placement mismatch');
    if(['style','glsl','wgsl','image','audio'].includes(d.kind))check(d.authority==='PRESENTATION_ONLY','rendering asset authority');
    // Canonical kernels remain in the frozen baseline composer, not self-promoted additions.
    check(d.authority!=='CANONICAL_PROVEN','canonical additions require a separate governed promotion');
    check(!entries.has(d.id),'duplicate component '+d.id);
    check(Array.isArray(d.dependencies)&&d.dependencies.length<=128&&d.dependencies.every(identifier)&&new Set(d.dependencies).size===d.dependencies.length,'dependencies');
    check(Array.isArray(d.provides)&&d.provides.length<=128&&d.provides.every(identifier),'provides');
    for(const claim of d.provides){check(!claims.has(claim),'capability collision '+claim);claims.set(claim,d.id);}
    if(d.placement.startsWith('fragment:')){check(!outputIds.has(d.placement),'fragment collision '+d.placement);outputIds.add(d.placement);}
    let inputBytes=Buffer.from(read(d.source));if(!['compressed','image','audio'].includes(d.kind))inputBytes=Buffer.from(new TextDecoder('utf-8',{fatal:true}).decode(inputBytes).replace(/\r\n?/g,'\n'));check(inputBytes.length<=4*1024*1024,'component too large');totalBytes+=inputBytes.length;check(totalBytes<=maxBytes,'total byte budget');
    const binary=['compressed','image','audio'].includes(d.kind);
    let content=binary?inputBytes.toString('base64'):new TextDecoder('utf-8',{fatal:true}).decode(inputBytes).replace(/\r\n?/g,'\n').trimEnd();
    if(d.kind==='code'||d.kind==='worker')new vm.Script(content,{filename:d.source});
    if(d.kind==='data'||d.kind==='table')content=JSON.stringify(JSON.parse(content));
    if(d.kind==='style')check(!/<\/style/i.test(content),'style terminator');
    if(d.kind==='html')check(!/<script\b|\son[a-z]+\s*=|(?:src|href)\s*=\s*["']?\s*(?:https?:|javascript:|\/\/)/i.test(content),'unsafe fragment');
    entries.set(d.id,{...d,dependencies:[...d.dependencies].sort(lex),provides:[...d.provides].sort(lex),sourceSha256:sha(inputBytes),inputBytes:inputBytes.length,content,encoding:binary?'base64':'utf-8'});
  }
  const bootstrap=entries.get('ofu.extensions.product-bindings');if(bootstrap)for(const d of entries.values())if((d.id.startsWith('px.providers.')||d.id.startsWith('px.regimes.'))&&!bootstrap.dependencies.includes(d.id))bootstrap.dependencies.push(d.id);if(bootstrap)bootstrap.dependencies.sort(lex);
  const marks=new Map(),order=[];
  function visit(id){check(entries.has(id),'missing dependency '+id);check(marks.get(id)!==1,'dependency cycle '+id);if(marks.get(id)===2)return;marks.set(id,1);const d=entries.get(id);for(const dep of d.dependencies){check(entries.has(dep),'missing dependency '+dep);check(!(d.stage==='foundation'&&entries.get(dep).stage==='full'),'future-stage dependency');visit(dep);}marks.set(id,2);order.push(d);}
  for(const id of [...entries.keys()].sort(lex))visit(id);
  for(const d of order){d.dependencies=Object.freeze(d.dependencies);d.provides=Object.freeze(d.provides);Object.freeze(d);}
  return Object.freeze(order);
}
export function loadComponents(root=ROOT){
 const dir=path.join(root,'config/components'),files=fs.readdirSync(dir).filter(f=>f.endsWith('.json')).sort(lex);
 check(files.length<=128,'manifest file budget');const inputs=[];
 for(const file of files){const full=path.join(dir,file),stat=fs.lstatSync(full);check(stat.isFile()&&!stat.isSymbolicLink()&&stat.size<=1048576,'manifest bounds');const value=JSON.parse(fs.readFileSync(full,'utf8'));check(value.schema==='ofu-components-1'&&Array.isArray(value.components),'manifest schema');inputs.push(...value.components);}
 return planComponents(inputs,{root,read(rel){const rootReal=fs.realpathSync(root),target=fs.realpathSync(path.join(root,rel));check(target===path.join(rootReal,rel),'symlink or canonical source path mismatch');return fs.readFileSync(target);}});
}
const escapeJson=s=>s.replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
export function emittedComponent(c){
 if(c.placement==='script')return '<script data-ofu-component="'+c.id+'">'+c.content.replace(/<\/script/gi,'<\\/script')+'</script>';
 if(c.placement==='style'||c.kind==='html')return c.content;
 return '<script type="application/json" id="ofu-resource-'+c.id+'">'+escapeJson(JSON.stringify({id:c.id,kind:c.kind,encoding:c.encoding,sourceSha256:c.sourceSha256,contentSha256:sha(c.encoding==='base64'?Buffer.from(c.content,'base64'):Buffer.from(c.content)),content:c.content}))+'</script>';
}
export function manifestOf(plan){return plan.map(c=>{const {content,...d}=c;return {...d,emittedSha256:sha(emittedComponent(c)),emittedBytes:Buffer.byteLength(emittedComponent(c))};});}
export function addComponents(html,plan,stage){
 const components=plan.filter(c=>c.stage===stage&&!c.placement.startsWith('fragment:'));
 // Fixed insertion locations are checked, never guessed.
 check(html.split('</body>').length===2&&html.split('</style>').length>=2,'output slots');
 const css=components.filter(c=>c.placement==='style').map(emittedComponent).join('\n');
 if(css)html=html.replace('</style>',css+'\n</style>');
 const resources=components.filter(c=>c.placement==='resource').map(emittedComponent).join('');if(resources){check(html.split('</head>').length===2,'resource head slot');html=html.replace('</head>',resources+'</head>');}
 const body=components.filter(c=>c.placement!=='style'&&c.placement!=='resource').map(emittedComponent).join('');
 return html.replace('</body>',body+'</body>');
}
export function attachManifest(manifest,plan){
 for(const c of plan)check(!manifest.components.some(b=>b.componentId===c.source),'frozen baseline component cannot be re-embedded');
 const descriptors=manifestOf(plan),full={version:'ofu-additive-components-1',frozenBaseline:manifest.components,extensions:descriptors};
 manifest.additiveComponents=full;manifest.componentCompositionSha256=sha(JSON.stringify(full));
 const sandbox={TextEncoder,TextDecoder,Uint8Array};vm.createContext(sandbox);
 for(const file of ['src/kernel/sha256.js','src/extensions/contracts.js','src/extensions/registry.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,file),'utf8'),sandbox,{filename:file});
 sandbox.catalogJSON=JSON.stringify(plan.filter(c=>c.id.startsWith('px.providers.')).map(c=>JSON.parse(c.content)));
 const result=vm.runInContext(`(()=>{const all=JSON.parse(catalogJSON);if(all.some(c=>c.canonicalAdmissions.length))throw new Error('Canonical admissions are governed outside additive catalogs');const policy={owners:all.flatMap(c=>c.owners),canonicalAdmissions:all.flatMap(c=>c.canonicalAdmissions),maxEntries:512},r=OFU.pxRegistry.create(policy);for(const d of all.flatMap(c=>c.providers))r.register(d);return JSON.stringify({manifest:r.seal(),digest:r.snapshot().manifestDigest});})()`,sandbox);
 const registry=JSON.parse(result);manifest.px={...(manifest.px||{}),registryManifest:registry.manifest,registryDigest:registry.digest,regimes:plan.filter(c=>c.id.startsWith('px.regimes.')).flatMap(c=>JSON.parse(c.content).regimes).sort((a,b)=>a.order-b.order)};
 return manifest;
}
