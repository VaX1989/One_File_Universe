import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.cwd(),dist=path.join(root,'dist');fs.mkdirSync(dist,{recursive:true});
const read=r=>fs.readFileSync(path.join(root,r),'utf8').replace(/\r\n/g,'\n');
const sha=v=>crypto.createHash('sha256').update(v).digest('hex');
const bytes=s=>Buffer.byteLength(s,'utf8');
const sourceCommit=process.env.OFU_SOURCE_SHA||'LOCAL-UNPINNED';
const p2=JSON.parse(read('tests/vectors/golden-universe-corpus-v1.json'));
const p3=JSON.parse(read('tests/vectors/golden-p3-corpus-v1.json'));
const specs=[
 ['src/kernel/sha256.js','P1','bootstrap-integrity','D3','sha256-v1'],
 ['src/kernel/canonical.js','P1','bootstrap-canonical','D3','ofu-canonical-v1'],
 ['src/kernel/p2-unicode.js','P2','unicode-profile','D3','ofu-unicode-15.1.0-v1'],
 ['src/kernel/p2-canonical.js','P2','canonical-kernel','D3','OFU-CBV-1'],
 ['src/kernel/p2-address-parser.js','P2','canonical-address','D3','canonical-address-v1'],
 ['src/generators/micro-universe.js','P1','bootstrap-generator','D3','p1'],
 ['src/persistence/save.js','P1','bootstrap-persistence','D1','p1'],
 ['src/rendering/renderer.js','P1','presentation','D0','p1'],
 ['src/experimental/wasm.js','P1','runtime-experiment','D0','p1'],
 ['src/workers/worker-source.js','P1','worker-runtime','D1','p1'],
 ['src/diagnostics/numeric-experiment.js','P1','diagnostic','D0','p1'],
 ['src/diagnostics/selftest.js','P1','diagnostic','D0','p1'],
 ['src/domains/astronomy/p3-skeleton.js','P3','universe-skeleton','D3','p3-prototype-engine'],
 ['src/domains/astronomy/p3-canonical.js','P3','canonical-astronomy','D3','p3-astronomy-1/schema-1'],
 ['src/temporal/p4-temporal.js','P4','temporal-kernel','D3','ofu-p4-temporal-v1'],
 ['src/bootstrap/ofu-inspector.js','Integration','canonical-inspector','D0','p1-p4-preview-1']
];
const components=specs.map(([componentId,phase,feature,determinismClass,version])=>{const source=read(componentId);return{componentId,phase,feature,version,determinismClass,hashAlgorithm:'SHA-256',hash:sha(source),embeddedBytes:bytes(source),source}});
const publicComponents=components.map(({source,...x})=>x),componentManifestHash=sha(JSON.stringify(publicComponents));
const buildPublic={baselineSchemaVersion:1,releaseLine:'v0.4.0-preview',sourceCommit,artifact:'One_File_Universe.html',phases:['P1','P2','P3','P4'],componentManifestHash,p2:{canonicalBytes:'OFU-CBV-1',corpusDigest:p2.corpusDigest,kernelDigest:p2.kernelDigest,semanticManifestHash:p2.semanticManifestHash,universeIdentity:p2.universeIdentity,unicodeProfile:p2.unicodeProfile},p3:{schemaVersion:p3.schemaVersion,modelVersion:p3.modelVersion,baselineEpoch:p3.baselineEpoch,corpusDigest:p3.expectedDigest,semanticManifestHash:p3.manifestHash},p4:{protocol:'ofu-p4-temporal-v1',transitionContract:'ofu.p4.core-transition@1.0.0',eventSchemaVersion:1,checkpointSchemaVersion:2,archiveSchemaVersion:2},runtime:{strictSingleFile:true,directFile:true,offline:true,networkRequired:false},knownLimitations:['P5 planetology is not canonical in this preview','No production multiscale renderer','Real Safari/iOS not verified; Playwright WebKit is reported as WebKit only']};
const loader=`(function(){'use strict';const O=globalThis.OFU=globalThis.OFU||{};const seed=${JSON.stringify(buildPublic)};O.BASELINE_BUILD=seed;O.BASELINE_EMBEDDED_COMPONENTS=${JSON.stringify(components.map(c=>({componentId:c.componentId,phase:c.phase,hash:c.hash,source:c.source})))};for(const c of O.BASELINE_EMBEDDED_COMPONENTS){if(c.componentId==='src/kernel/sha256.js'){(0,eval)(c.source+'\\n//# sourceURL=ofu://'+c.componentId);break;}}for(const c of O.BASELINE_EMBEDDED_COMPONENTS){if(c.componentId==='src/kernel/sha256.js')continue;const actual=O.sha256.hex(new TextEncoder().encode(c.source));if(actual!==c.hash)throw new Error('component integrity mismatch before load: '+c.componentId);(0,eval)(c.source+'\\n//# sourceURL=ofu://'+c.componentId);}})();`;
const template=read('src/bootstrap/ofu-template.html');if(!template.includes('__SCRIPT__'))throw new Error('OFU template script marker missing');
const html=template.replace('__SCRIPT__',loader),out=path.join(dist,'One_File_Universe.html');fs.writeFileSync(out,html,'utf8');
const artifact=fs.readFileSync(out),manifest={...buildPublic,status:'PASS',artifactBytes:artifact.length,artifactSha256:sha(artifact),components:publicComponents};
fs.writeFileSync(path.join(dist,'p1-p4-build-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest,null,2));
