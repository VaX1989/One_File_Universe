(function(root){
'use strict';
const O=root.OFU=root.OFU||{};
const P=O.p2,A=O.p3Astronomy;
if(!P||!A)throw new Error('OFU P5 requires frozen P2 and canonical P3');

const VERSION='p5-planet-physical-1';
const SCHEMA_VERSION=1n;
const P3_INPUT_CONTRACT='ofu-p3-p5-planetary-input-v1';
const PHYSICAL_CONTRACT='ofu-p5-planet-physical-v1';
const P6_ENV_CONTRACT='ofu-p5-p6-environment-v1';
const BASELINE_EPOCH='P4_T0';
const TERRAIN_TOPOLOGY_VERSION='p5-cube-sphere-topology-1';
const TERRAIN_PATCH_SEGMENTS=4n;
const TERRAIN_MAX_LEVEL=14n;
const CUBE_FACES=Object.freeze(['PX','NX','PY','NY','PZ','NZ']);
const BULK_PRIORS=Object.freeze(['TERRESTRIAL','VOLATILE_RICH','ICE_GIANT','GAS_GIANT']);
const MANIFEST=Object.freeze({
  semanticManifestVersion:1n,canonicalProtocolVersion:'ofu-cbv-1',canonicalAddressVersion:1n,
  unicodeProfileVersion:'ofu-unicode-15.1.0-v1',numericContractVersion:1n,
  generatorSuite:'p5-planetology',generatorSuiteVersion:1n,
  subsystems:Object.freeze({planetology:1n,terrain:1n}),domains:Object.freeze({planetology:1n,terrain:1n}),
  dependencies:Object.freeze({kernel:'p2',astronomy:'p3-astronomy-1',temporal:'ofu-p4-temporal-v1'}),
  lawProfile:'p5-bounded-rocky-topology-v1',
  genesis:Object.freeze({baselineEpoch:BASELINE_EPOCH,schemaVersion:SCHEMA_VERSION,modelVersion:VERSION})
});
const EVIDENCE=Object.freeze({
  p3Boundary:Object.freeze({evidenceClass:'ESTABLISHED',modelFidelity:'FORMAL'}),
  rockyCompositionRefinement:Object.freeze({evidenceClass:'HYPOTHETICAL',modelFidelity:'STYLIZED'}),
  rockyMassRadius:Object.freeze({evidenceClass:'EMPIRICALLY_CONSTRAINED',modelFidelity:'APPROXIMATE'}),
  sphericalGravityDensity:Object.freeze({evidenceClass:'ESTABLISHED',modelFidelity:'APPROXIMATE'}),
  terrainTopology:Object.freeze({evidenceClass:'ESTABLISHED',modelFidelity:'FORMAL'}),
  terrainElevationSignal:Object.freeze({evidenceClass:'FICTIONAL',modelFidelity:'STYLIZED'})
});
const EARTH_MASS_KG=5972200000000000000000000n;
const G_NUM=667430n,G_DEN=10000000000000000n,PI_NUM=355n,PI_DEN=113n;

function fail(m){throw new Error('OFU P5: '+m)}
function map(v,n){if(!v||typeof v!=='object'||Array.isArray(v))fail(n+' must be a map');return v}
function bytes32(v,n){if(!(v instanceof Uint8Array)||v.length!==32)fail(n+' must be 32 bytes');return new Uint8Array(v)}
function bigint(v,n){if(typeof v!=='bigint')fail(n+' must preserve canonical BigInt representation');P.encode(v);return v}
function enumValue(v,allowed,n){if(!allowed.includes(v))fail(n+' invalid');return v}
function safeNumber(v,n){if(typeof v!=='bigint'||v<BigInt(Number.MIN_SAFE_INTEGER)||v>BigInt(Number.MAX_SAFE_INTEGER))fail(n+' cannot enter non-canonical Number view');return Number(v)}
function sameBytes(a,b){return a instanceof Uint8Array&&b instanceof Uint8Array&&P.hex(a)===P.hex(b)}
function roundHalfEvenRatio(n,d){n=BigInt(n);d=BigInt(d);if(d<=0n)fail('denominator must be positive');const neg=n<0n;if(neg)n=-n;let q=n/d;const r=n%d,t=2n*r;if(t>d||(t===d&&(q&1n)===1n))q++;return neg?-q:q}
function powBig(a,e){let r=1n;for(let i=0;i<e;i++)r*=a;return r}
function integerRootFloor(n,k){if(n<0n)fail('negative root input');if(n<2n)return n;let lo=1n,hi=2n;while(powBig(hi,k)<=n)hi*=2n;while(lo+1n<hi){const mid=(lo+hi)>>1n;if(powBig(mid,k)<=n)lo=mid;else hi=mid}return lo}
function massKgFromMilliEarth(m){return roundHalfEvenRatio(EARTH_MASS_KG*m,1000n)}
function semanticManifest(){return MANIFEST}
function semanticManifestHash(){return P.semanticManifestHash(MANIFEST)}

function adaptP3PlanetaryInputSnapshot(snapshot){
  map(snapshot,'snapshot');
  if(snapshot.status==='ABSENT')return Object.freeze({adapterVersion:'p5-p3-v1-adapter-1',sourceContractId:P3_INPUT_CONTRACT,status:'ABSENT',reason:snapshot.reason||'ABSENT'});
  if(snapshot.contractId!==P3_INPUT_CONTRACT)fail('unsupported P3->P5 contract');
  if(snapshot.p3SchemaVersion!==1n)fail('P3 schema version must be 1n');
  if(snapshot.baselineEpoch!==BASELINE_EPOCH)fail('P3 baseline epoch must be P4_T0');
  const s=map(snapshot.system,'snapshot.system'),h=map(snapshot.host,'snapshot.host'),o=map(snapshot.orbit,'snapshot.orbit'),f=map(snapshot.formation,'snapshot.formation');
  const planetId=bytes32(snapshot.planetId,'planetId'),systemId=bytes32(s.systemId,'systemId'),starId=bytes32(h.starId,'starId');
  const upstreamBaseline=Object.freeze({
    system:Object.freeze({systemId,baselineAgeMyr:bigint(s.baselineAgeMyr,'system.baselineAgeMyr'),baselineMetallicityMilliDex:bigint(s.baselineMetallicityMilliDex,'system.baselineMetallicityMilliDex'),planetArchitecture:s.planetArchitecture}),
    host:Object.freeze({starId,baselineMassMilliSolar:bigint(h.baselineMassMilliSolar,'host.baselineMassMilliSolar'),baselineEvolutionaryClass:h.baselineEvolutionaryClass,baselineTemperatureK:bigint(h.baselineTemperatureK,'host.baselineTemperatureK'),baselineLuminosityMilliSolar:bigint(h.baselineLuminosityMilliSolar,'host.baselineLuminosityMilliSolar')}),
    orbit:Object.freeze({orbitSlot:bigint(o.orbitSlot,'orbit.orbitSlot'),orbitCenter:o.orbitCenter,baselineSemiMajorAxisMicroAu:bigint(o.baselineSemiMajorAxisMicroAu,'orbit.baselineSemiMajorAxisMicroAu'),baselineEccentricityPpm:bigint(o.baselineEccentricityPpm,'orbit.baselineEccentricityPpm'),baselineInclinationMilliDeg:bigint(o.baselineInclinationMilliDeg,'orbit.baselineInclinationMilliDeg'),baselineInsolationPpm:bigint(o.baselineInsolationPpm,'orbit.baselineInsolationPpm')}),
    formation:Object.freeze({baselineMassMilliEarth:bigint(f.baselineMassMilliEarth,'formation.baselineMassMilliEarth'),bulkPriorClass:enumValue(f.bulkPriorClass,BULK_PRIORS,'formation.bulkPriorClass'),protoplanetarySolidBudgetPermille:bigint(f.protoplanetarySolidBudgetPermille,'formation.protoplanetarySolidBudgetPermille')})
  });
  return Object.freeze({adapterVersion:'p5-p3-v1-adapter-1',sourceContractId:snapshot.contractId,sourceSchemaVersion:1n,baselineEpoch:BASELINE_EPOCH,status:'PRESENT',planetId,upstreamBaseline,authority:Object.freeze({p3Owned:Object.freeze(['identity','host/system relations','orbit','insolation','baseline mass','bulk prior','solid budget']),p5MayReroll:false})});
}
function assertP3BaselinePreserved(snapshot,adapted){
  if(!adapted||adapted.status!=='PRESENT')return false;const u=adapted.upstreamBaseline;
  return sameBytes(snapshot.planetId,adapted.planetId)&&sameBytes(snapshot.system.systemId,u.system.systemId)&&sameBytes(snapshot.host.starId,u.host.starId)&&
    snapshot.p3SchemaVersion===adapted.sourceSchemaVersion&&snapshot.baselineEpoch===adapted.baselineEpoch&&
    snapshot.system.baselineAgeMyr===u.system.baselineAgeMyr&&snapshot.system.baselineMetallicityMilliDex===u.system.baselineMetallicityMilliDex&&snapshot.system.planetArchitecture===u.system.planetArchitecture&&
    snapshot.host.baselineMassMilliSolar===u.host.baselineMassMilliSolar&&snapshot.host.baselineEvolutionaryClass===u.host.baselineEvolutionaryClass&&snapshot.host.baselineTemperatureK===u.host.baselineTemperatureK&&snapshot.host.baselineLuminosityMilliSolar===u.host.baselineLuminosityMilliSolar&&
    snapshot.orbit.orbitSlot===u.orbit.orbitSlot&&snapshot.orbit.orbitCenter===u.orbit.orbitCenter&&snapshot.orbit.baselineSemiMajorAxisMicroAu===u.orbit.baselineSemiMajorAxisMicroAu&&snapshot.orbit.baselineEccentricityPpm===u.orbit.baselineEccentricityPpm&&snapshot.orbit.baselineInclinationMilliDeg===u.orbit.baselineInclinationMilliDeg&&snapshot.orbit.baselineInsolationPpm===u.orbit.baselineInsolationPpm&&
    snapshot.formation.baselineMassMilliEarth===u.formation.baselineMassMilliEarth&&snapshot.formation.bulkPriorClass===u.formation.bulkPriorClass&&snapshot.formation.protoplanetarySolidBudgetPermille===u.formation.protoplanetarySolidBudgetPermille;
}
function nonCanonicalNumberView(adapted){if(!adapted||adapted.status!=='PRESENT')fail('present adapted snapshot required');const u=adapted.upstreamBaseline;return Object.freeze({authority:'NON_CANONICAL_PRESENTATION_ONLY',systemAgeGyr:safeNumber(u.system.baselineAgeMyr,'age')/1000,stellarMassSolar:safeNumber(u.host.baselineMassMilliSolar,'stellar mass')/1000,stellarLuminositySolar:safeNumber(u.host.baselineLuminosityMilliSolar,'luminosity')/1000,semiMajorAxisAu:safeNumber(u.orbit.baselineSemiMajorAxisMicroAu,'semi-major axis')/1e6,insolationEarth:safeNumber(u.orbit.baselineInsolationPpm,'insolation')/1e6,baselineMassEarth:safeNumber(u.formation.baselineMassMilliEarth,'planet mass')/1000});}

function deriveBytes(ctx,planetId,scope,property,counter=0n,extra=[]){
  if(!ctx||!(ctx.masterSeed instanceof Uint8Array)||ctx.masterSeed.length!==32)fail('P5 derivation requires P2 32-byte masterSeed');
  const segments=[{kind:'namespace',value:'p5.planet.v1'},{kind:'bytes',value:planetId},{kind:'namespace',value:scope},...extra];
  return P.derive({masterSeed:ctx.masterSeed,semanticManifestHash:semanticManifestHash(),domain:'ofu.p5.planetology.v1',addressBytes:P.address(segments),property,counter});
}
function u32(bytes){return ((bytes[0]<<24)>>>0)+(bytes[1]<<16)+(bytes[2]<<8)+bytes[3]}
function rockyRadiusMeters(massMilliEarth,coreMassFractionPermille){
  const m=bigint(massMilliEarth,'massMilliEarth'),c=bigint(coreMassFractionPermille,'coreMassFractionPermille');
  if(m<1000n||m>8000n)return Object.freeze({status:'OUT_OF_DOMAIN',reason:'MASS',validMassMilliEarth:Object.freeze([1000n,8000n]),validCoreMassFractionPermille:Object.freeze([0n,400n])});
  if(c<0n||c>400n)return Object.freeze({status:'OUT_OF_DOMAIN',reason:'COMPOSITION',validMassMilliEarth:Object.freeze([1000n,8000n]),validCoreMassFractionPermille:Object.freeze([0n,400n])});
  const Q=1000000n,x=m*Q/1000n,n=powBig(x,10)*powBig(Q,27),massPowerQ=integerRootFloor(n,37),factorQ=1070000n-210n*c;
  return Object.freeze({status:'IN_DOMAIN',radiusM:roundHalfEvenRatio(6371000n*massPowerQ*factorQ,Q*Q),model:'P5_ROCKY_10_37_FIXED_V1'});
}
function gravityMicroMs2(massMilliEarth,radiusM){const m=bigint(massMilliEarth,'massMilliEarth'),r=bigint(radiusM,'radiusM');if(m<=0n||r<=0n)fail('invalid gravity input');return roundHalfEvenRatio(G_NUM*massKgFromMilliEarth(m)*1000000n,G_DEN*r*r)}
function densityKgM3(massMilliEarth,radiusM){const m=bigint(massMilliEarth,'massMilliEarth'),r=bigint(radiusM,'radiusM');if(m<=0n||r<=0n)fail('invalid density input');return roundHalfEvenRatio(massKgFromMilliEarth(m)*3n*PI_DEN,4n*PI_NUM*r*r*r)}
function realizePhysicalPlanet(ctx,snapshotOrAdapted){
  const a=snapshotOrAdapted&&snapshotOrAdapted.adapterVersion? snapshotOrAdapted:adaptP3PlanetaryInputSnapshot(snapshotOrAdapted);
  if(a.status!=='PRESENT')return Object.freeze({contractId:PHYSICAL_CONTRACT,p5SchemaVersion:SCHEMA_VERSION,modelVersion:VERSION,status:'UNSUPPORTED',reason:'P3_ABSENT'});
  const f=a.upstreamBaseline.formation,m=f.baselineMassMilliEarth;
  if(f.bulkPriorClass!=='TERRESTRIAL')return Object.freeze({contractId:PHYSICAL_CONTRACT,p5SchemaVersion:SCHEMA_VERSION,modelVersion:VERSION,baselineEpoch:BASELINE_EPOCH,planetId:new Uint8Array(a.planetId),status:'UNSUPPORTED',reason:'BULK_PRIOR',bulkPriorClass:f.bulkPriorClass,supportedBulkPriorClass:'TERRESTRIAL'});
  if(m<1000n||m>8000n)return Object.freeze({contractId:PHYSICAL_CONTRACT,p5SchemaVersion:SCHEMA_VERSION,modelVersion:VERSION,baselineEpoch:BASELINE_EPOCH,planetId:new Uint8Array(a.planetId),status:'UNSUPPORTED',reason:'MASS_DOMAIN',baselineMassMilliEarth:m,validMassMilliEarth:Object.freeze([1000n,8000n])});
  const draw=deriveBytes(ctx,a.planetId,'rocky-composition','core-mass-fraction-permille'),cmf=200n+BigInt(u32(draw)%201),mantle=1000000n-cmf*1000n;
  const rr=rockyRadiusMeters(m,cmf);if(rr.status!=='IN_DOMAIN')fail('validated rocky radius unexpectedly unsupported');
  const physical=Object.freeze({composition:Object.freeze({model:'P5_TERRESTRIAL_REFINEMENT_V1',coreMassFractionPermille:cmf,coreFractionPpm:cmf*1000n,mantleFractionPpm:mantle,sumPpm:1000000n}),meanRadiusM:rr.radiusM,surfaceGravityMicroMs2:gravityMicroMs2(m,rr.radiusM),meanDensityKgM3:densityKgM3(m,rr.radiusM),massAuthority:'P3_BASELINE'});
  return Object.freeze({contractId:PHYSICAL_CONTRACT,p5SchemaVersion:SCHEMA_VERSION,modelVersion:VERSION,baselineEpoch:BASELINE_EPOCH,planetId:new Uint8Array(a.planetId),sourceP3ContractId:a.sourceContractId,sourceP3SchemaVersion:a.sourceSchemaVersion,status:'SUPPORTED',upstreamBaseline:a.upstreamBaseline,physical,temporalBinding:Object.freeze({canonicalTimeOwner:'P4',persistentMutableP5StatePromoted:false,transitionContract:null}),evidence:Object.freeze({composition:EVIDENCE.rockyCompositionRefinement,massRadius:EVIDENCE.rockyMassRadius,gravityDensity:EVIDENCE.sphericalGravityDensity})});
}
function physicalDigest(planet){return O.sha256.digest(P.encode(planet))}

function absBig(x){return x<0n?-x:x}
function gcd(a,b){a=absBig(a);b=absBig(b);while(b){const t=a%b;a=b;b=t}return a}
function gcd3(a,b,c){const g=gcd(gcd(a,b),c);return g||1n}
function toLevel(v){if(typeof v==='number'&&Number.isSafeInteger(v))v=BigInt(v);if(typeof v!=='bigint'||v<0n||v>TERRAIN_MAX_LEVEL)fail('terrain level invalid');return v}
function toIndex(v,n){if(typeof v==='number'&&Number.isSafeInteger(v))v=BigInt(v);if(typeof v!=='bigint'||v<0n||v>=n)fail('terrain patch index invalid');return v}
function primitiveCubeVector(face,i,j,d){
  if(!CUBE_FACES.includes(face)||typeof d!=='bigint'||d<=0n||typeof i!=='bigint'||typeof j!=='bigint'||i<0n||j<0n||i>d||j>d)fail('invalid cube coordinate');
  const u=-d+2n*i,v=-d+2n*j;let x,y,z;
  if(face==='PX')[x,y,z]=[d,v,-u];else if(face==='NX')[x,y,z]=[-d,v,u];else if(face==='PY')[x,y,z]=[u,d,-v];else if(face==='NY')[x,y,z]=[u,-d,v];else if(face==='PZ')[x,y,z]=[u,v,d];else[x,y,z]=[-u,v,-d];
  const g=gcd3(x,y,z);return Object.freeze({x:x/g,y:y/g,z:z/g});
}
function validatePatchKey(k){map(k,'patch key');if(!CUBE_FACES.includes(k.face))fail('terrain face invalid');const level=toLevel(k.level),axis=1n<<level,x=toIndex(k.x,axis),y=toIndex(k.y,axis);return Object.freeze({face:k.face,level,x,y});}
function vertexAddress(planetId,v){return P.address([{kind:'namespace',value:'p5.terrain.vertex.v1'},{kind:'bytes',value:planetId},{kind:'i64',value:v.x},{kind:'i64',value:v.y},{kind:'i64',value:v.z}])}
function elevationCode(ctx,planetId,v){const b=deriveBytes(ctx,planetId,'terrain','elevation-code',0n,[{kind:'i64',value:v.x},{kind:'i64',value:v.y},{kind:'i64',value:v.z}]);return BigInt((b[0]<<8|b[1])-32768)}
function createTerrainTopology(planet){if(!planet||planet.status!=='SUPPORTED'||!(planet.planetId instanceof Uint8Array))fail('supported P5 planet required');return Object.freeze({version:TERRAIN_TOPOLOGY_VERSION,planetId:new Uint8Array(planet.planetId),patchSegments:TERRAIN_PATCH_SEGMENTS,maxLevel:TERRAIN_MAX_LEVEL,heightSemantic:'DIMENSIONLESS_STYLIZED_ELEVATION_CODE_I16',materializesGlobalHeightmap:false,evidence:EVIDENCE.terrainTopology});}
function generateTerrainPatch(ctx,topology,key){const k=validatePatchKey(key);if(!topology||topology.version!==TERRAIN_TOPOLOGY_VERSION)fail('terrain topology version mismatch');const s=TERRAIN_PATCH_SEGMENTS,d=(1n<<k.level)*s,vertices=[];for(let j=0n;j<=s;j++)for(let i=0n;i<=s;i++){const v=primitiveCubeVector(k.face,k.x*s+i,k.y*s+j,d),address=vertexAddress(topology.planetId,v);vertices.push(Object.freeze({address,primitive:v,elevationCode:elevationCode(ctx,topology.planetId,v)}));}return Object.freeze({topologyVersion:topology.version,key:k,vertexCount:BigInt(vertices.length),vertices:Object.freeze(vertices),materializedVertexCount:BigInt(vertices.length),materializesGlobalHeightmap:false});}
function refinePatchKey(key){const p=validatePatchKey(key);if(p.level>=TERRAIN_MAX_LEVEL)fail('terrain max level');const level=p.level+1n,x=p.x*2n,y=p.y*2n;return Object.freeze([{face:p.face,level,x,y},{face:p.face,level,x:x+1n,y},{face:p.face,level,x,y:y+1n},{face:p.face,level,x:x+1n,y:y+1n}].map(Object.freeze));}
function addressKey(a){return P.hex(a)}
function commonSeam(a,b){const m=new Map(a.vertices.map(v=>[addressKey(v.address),v.elevationCode]));let count=0n,maxDelta=0n;for(const v of b.vertices){const old=m.get(addressKey(v.address));if(old!==undefined){count++;const d=absBig(old-v.elevationCode);if(d>maxDelta)maxDelta=d;}}return Object.freeze({commonVertexCount:count,maxElevationCodeDelta:maxDelta});}
function projectRefinedChildren(ctx,topology,parentKey,children){const expected=new Set(refinePatchKey(parentKey).map(k=>k.face+'/'+k.level+'/'+k.x+'/'+k.y)),m=new Map();for(const c of children){const id=c.key.face+'/'+c.key.level+'/'+c.key.x+'/'+c.key.y;if(!expected.delete(id))fail('unexpected refined child');for(const v of c.vertices){const k=addressKey(v.address),old=m.get(k);if(old!==undefined&&old!==v.elevationCode)fail('child seam contradiction');m.set(k,v.elevationCode);}}if(expected.size)fail('missing refined child');const parent=generateTerrainPatch(ctx,topology,parentKey);let missing=0n,maxDelta=0n;for(const v of parent.vertices){const h=m.get(addressKey(v.address));if(h===undefined)missing++;else{const d=absBig(h-v.elevationCode);if(d>maxDelta)maxDelta=d;}}return Object.freeze({operation:'PROJECT',missingParentVertices:missing,maxParentElevationCodeDelta:maxDelta,parentVertexCount:parent.vertexCount,childUniqueVertexCount:BigInt(m.size)});}
function auditCubeFaceContinuityAtLevel(ctx,topology,levelInput){const level=toLevel(levelInput);if(level>5n)fail('continuity audit is bounded to level <= 5');const axis=1n<<level,records=new Map();for(const face of CUBE_FACES){const ids=new Set();for(let q=0n;q<axis;q++){ids.add('0,'+q);ids.add((axis-1n)+','+q);ids.add(q+',0');ids.add(q+','+(axis-1n));}for(const id of ids){const [x,y]=id.split(',').map(BigInt),patch=generateTerrainPatch(ctx,topology,{face,level,x,y});for(const v of patch.vertices){const d=[absBig(v.primitive.x),absBig(v.primitive.y),absBig(v.primitive.z)],mx=d.reduce((a,b)=>a>b?a:b),boundary=d.filter(n=>n===mx).length>=2;if(!boundary)continue;const k=addressKey(v.address);let r=records.get(k);if(!r){r={height:v.elevationCode,faces:new Set(),bad:false,primitive:v.primitive};records.set(k,r)}else if(r.height!==v.elevationCode)r.bad=true;r.faces.add(face);}}}let unshared=0n,corners=0n,bad=0n;for(const r of records.values()){if(r.faces.size<2)unshared++;if(r.faces.size>=3)corners++;if(r.bad)bad++;}return Object.freeze({level,uniqueBoundaryVertices:BigInt(records.size),unsharedBoundaryVertices:unshared,cornerVertices:corners,elevationContradictions:bad,status:unshared===0n&&bad===0n?'PASS':'FAIL'});}
function reconcileTerrain(ctx,topology,parentKey){const children=refinePatchKey(parentKey).map(k=>generateTerrainPatch(ctx,topology,k)),projection=projectRefinedChildren(ctx,topology,parentKey,children),faceAudit=auditCubeFaceContinuityAtLevel(ctx,topology,toLevel(parentKey.level)>5n?5n:toLevel(parentKey.level));const pass=projection.missingParentVertices===0n&&projection.maxParentElevationCodeDelta===0n&&faceAudit.status==='PASS';return Object.freeze({operation:'RECONCILE',status:pass?'PASS':'FAIL',projection,faceAudit,materializedVertexCount:25n+BigInt(children.length)*25n});}
function p6EnvironmentalProjection(planet,topology=null){if(!planet||planet.contractId!==PHYSICAL_CONTRACT)fail('P5 physical planet required');if(planet.status!=='SUPPORTED')return Object.freeze({contractId:P6_ENV_CONTRACT,version:1n,planetId:planet.planetId,status:'UNSUPPORTED',reason:planet.reason});return Object.freeze({contractId:P6_ENV_CONTRACT,version:1n,planetId:new Uint8Array(planet.planetId),status:'PARTIAL',gravityMicroMs2:planet.physical.surfaceGravityMicroMs2,meanDensityKgM3:planet.physical.meanDensityKgM3,meanRadiusM:planet.physical.meanRadiusM,pressurePa:null,temperatureEnvelopeK:null,waterVolatileRegime:'UNSUPPORTED',radiationEscapeDiagnostics:'UNSUPPORTED',terrain:Object.freeze({topologyVersion:topology?topology.version:null,physicalElevationScale:'UNSUPPORTED',oceanMacroConstraints:'UNSUPPORTED'}),geologicalActivity:'UNSUPPORTED'});}

O.p5Planetology=Object.freeze({VERSION,SCHEMA_VERSION,P3_INPUT_CONTRACT,PHYSICAL_CONTRACT,P6_ENV_CONTRACT,BASELINE_EPOCH,TERRAIN_TOPOLOGY_VERSION,TERRAIN_PATCH_SEGMENTS,TERRAIN_MAX_LEVEL,CUBE_FACES,MANIFEST,EVIDENCE,semanticManifest,semanticManifestHash,adaptP3PlanetaryInputSnapshot,assertP3BaselinePreserved,nonCanonicalNumberView,rockyRadiusMeters,gravityMicroMs2,densityKgM3,realizePhysicalPlanet,physicalDigest,primitiveCubeVector,validatePatchKey,createTerrainTopology,generateTerrainPatch,refinePatchKey,commonSeam,projectRefinedChildren,auditCubeFaceContinuityAtLevel,reconcileTerrain,p6EnvironmentalProjection});
})(typeof globalThis!=='undefined'?globalThis:this);
