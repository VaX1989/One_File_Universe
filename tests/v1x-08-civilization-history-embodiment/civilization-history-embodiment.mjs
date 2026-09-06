import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../../src/v1x-08-civilization-history-embodiment/index.js',import.meta.url),'utf8');
const context=vm.createContext({console});
vm.runInContext(source,context,{filename:'index.js'});
const API=context.OFU.v1x08CivilizationHistoryEmbodiment;
assert.ok(API);
assert.equal(API.VERSION,'ofu-v1x-08-civilization-history-embodiment-1');
assert.equal(API.AUTHORITY.PRESENTATION_ONLY,'PRESENTATION_ONLY');

const fixtures=JSON.parse(fs.readFileSync(new URL('../../data/v1x-08-civilization-history-embodiment/causal-states.json',import.meta.url),'utf8'));
assert.equal(fixtures.fixtureOnly,true);
assert.equal(fixtures.claims.canonical,false);
const baseState=fixtures.before;
const afterState=fixtures.after;

const absent=API.project({civilization:{state:'NO_CIVILIZATION_MODEL',authority:{class:'MODEL_DERIVED_SIMULATION'}},scale:'CIVILIZATION'});
assert.equal(absent.status,'ABSENT_OR_UNSUPPORTED');
assert.equal(absent.civilizationVisible,false);
assert.equal(absent.objects.length,0);
assert.equal(absent.historyTraces.length,0);

const localMissing=API.project({civilization:baseState,scale:'LOCAL_SURFACE'});
assert.equal(localMissing.status,'ABSENT_OR_UNSUPPORTED');
assert.equal(localMissing.reason,'LOCAL_CONTEXT_REQUIRED');

const current=API.project({civilization:baseState,scale:'CIVILIZATION'});
assert.equal(current.status,'PROJECTED');
assert.equal(current.civilizationVisible,true);
assert.equal(current.objects.filter(x=>x.sourceEntityKind==='SETTLEMENT').length,2);
assert.equal(current.links.length,1);
assert.equal(current.historyTraces.length,4);
assert.equal(current.historyTraces.some(x=>x.sourceEventProposalId==='fake-flat-event'),false,'flat c.events must not masquerade as structured history');
assert.ok(current.historyTraces.every(x=>x.temporalLayer==='HISTORICAL_PROJECTION'));
assert.ok(current.objects.every(x=>x.temporalLayer==='CURRENT_STATE'));

const alpha=current.objects.find(x=>x.sourceEntityId==='s-alpha');
assert.equal(alpha.kind,'SETTLEMENT');
assert.equal(alpha.visual.landUse.kind,'SETTLEMENT_LAND_USE_PROXY');
assert.equal(alpha.visual.landUse.canonicalLandUse,false);
assert.equal(alpha.placement.physicalPositionClaim,false);
assert.equal(alpha.claims.screenGeometryCanonical,false);
assert.equal(alpha.sourceEventProposalIds.includes('ev-found-alpha'),true);
assert.equal(alpha.reverseNavigation.mutationPerformed,false);

const infra=current.objects.find(x=>x.sourceEntityId==='infra-alpha-beta');
assert.equal(infra.kind,'INFRASTRUCTURE');
assert.equal(infra.sourceEventProposalIds.includes('ev-infra'),true);
assert.equal(infra.claims.pathGeometryCanonical,false);

const currentOnly=API.project({civilization:baseState,scale:'CIVILIZATION',temporalMode:'CURRENT_ONLY'});
assert.equal(currentOnly.historyTraces.length,0);
const historyOnly=API.project({civilization:baseState,scale:'CIVILIZATION',temporalMode:'HISTORY_ONLY'});
assert.equal(historyOnly.objects.length,0);
assert.equal(historyOnly.links.length,0);
assert.equal(historyOnly.historyTraces.length,4);

const local=API.project({civilization:baseState,scale:'LOCAL_SURFACE',context:{regionId:'region-a'}});
assert.equal(local.objects.filter(x=>x.sourceEntityKind==='SETTLEMENT').length,1);
assert.equal(local.objects.find(x=>x.sourceEntityKind==='SETTLEMENT').sourceEntityId,'s-alpha');
assert.equal(local.historyTraces.some(x=>x.sourceTargetIds.includes('s-beta')&&!x.sourceTargetIds.includes('s-alpha')),false);

const humanExact=API.project({civilization:baseState,scale:'HUMAN',context:{settlementId:'s-alpha'}});
assert.equal(humanExact.objects.filter(x=>x.sourceEntityKind==='SETTLEMENT').length,1);
assert.equal(humanExact.objects.find(x=>x.sourceEntityKind==='SETTLEMENT').sourceEntityId,'s-alpha');

const many={...baseState,settlements:Array.from({length:60},(_,i)=>({settlementId:'s-'+String(i).padStart(3,'0'),regionId:'region-a',population:100+i,type:'VILLAGE',status:'ACTIVE',infrastructurePpm:100000}))};
const bounded=API.project({civilization:many,scale:'HUMAN',context:{regionId:'region-a'},temporalMode:'CURRENT_ONLY'});
assert.equal(bounded.objects.filter(x=>x.sourceEntityKind==='SETTLEMENT').length,API.SCALE_LIMITS.HUMAN.settlements);
assert.ok(bounded.resourceWitness.objects<=API.SCALE_LIMITS.HUMAN.settlements+API.SCALE_LIMITS.HUMAN.infrastructure);

const sharedBudget=API.project({civilization:many,scale:'CIVILIZATION',temporalMode:'CURRENT_ONLY',budget:{SETTLEMENT:{objects:10}}});
assert.ok(sharedBudget.objects.length<=10,'injected shared SETTLEMENT object limit must never be exceeded');
assert.equal(sharedBudget.limits.sharedSettlementObjectLimit,10);

const after=API.project({civilization:afterState,scale:'CIVILIZATION'});
const alphaAfter=after.objects.find(x=>x.sourceEntityId==='s-alpha');
const infraAfter=after.objects.find(x=>x.sourceEntityId==='infra-alpha-beta');
assert.equal(alphaAfter.kind,'RUIN');
assert.equal(infraAfter.kind,'INFRASTRUCTURE_RUIN');
assert.ok(after.historyTraces.some(x=>x.visualGrammar==='MIGRATION_TRACE'&&x.sourceEventProposalId==='ev-migration'));
assert.ok(after.historyTraces.some(x=>x.visualGrammar==='DAMAGE_TRACE'&&x.sourceEventProposalId==='ev-conflict'));
assert.ok(after.historyTraces.some(x=>x.visualGrammar==='ABANDONMENT_TRACE'&&x.sourceEventProposalId==='ev-abandon'));
assert.ok(after.historyTraces.every(x=>x.claims.freeFormNarrativeGenerated===false));
assert.ok(after.historyTraces.every(x=>x.sourceCanonical===false));

const comparison=API.compare({before:baseState,after:afterState,scale:'CIVILIZATION'});
assert.equal(comparison.authority,'DERIVED');
assert.ok(comparison.delta.changedSourceEntityIds.includes('s-alpha'));
assert.ok(comparison.delta.changedSourceEntityIds.includes('infra-alpha-beta'));
assert.ok(comparison.delta.addedVisualIds.includes('v1x08:history:ev-abandon'));

const selection=API.select(after,'s-alpha');
assert.equal(selection.status,'SELECTION_REQUEST');
assert.equal(selection.selectionContract,'ofu-wave-iv-selection-1');
assert.equal(selection.mutationPerformed,false);
assert.equal(selection.requiresConvergenceOwnerBridge,true);

const overlay=API.localSceneOverlay({civilization:afterState,scale:'LOCAL_SURFACE',context:{regionId:'region-a'}});
assert.equal(overlay.contract,'ofu-v1x-08-local-overlay-handoff-1');
assert.equal(overlay.requiresIntegrationOwner,true);
assert.equal(overlay.sharedSceneMutationPerformed,false);
assert.ok(overlay.objects.length>0);
assert.ok(overlay.historyTraces.length>0);

const hooks=API.handoffCapabilities();
assert.equal(hooks.hooks.length,2);
assert.ok(hooks.hooks.every(x=>x.status==='HOOK_ONLY'&&x.canonicalMutation===false));
assert.equal(hooks.claims.gameplayImplemented,false);
assert.equal(hooks.claims.individualSimulationImplemented,false);

const emptyModeled=API.project({civilization:{state:'MODELED_CIVILIZATION',authority:{class:'MODEL_DERIVED_SIMULATION'},settlements:[],tradeEdges:[],infrastructure:[],history:{proposals:[]}},scale:'CIVILIZATION'});
assert.equal(emptyModeled.status,'NO_SUPPORTED_CIVILIZATION_VISUALS');
assert.equal(emptyModeled.civilizationVisible,false);

assert.throws(()=>API.project({civilization:baseState,scale:'ATOMIC'}),/unsupported shared scale/);
const deterministicA=JSON.stringify(API.project({civilization:afterState,scale:'LOCAL_SURFACE',context:{regionId:'region-a'},selectedId:'s-alpha'}));
const deterministicB=JSON.stringify(API.project({civilization:afterState,scale:'LOCAL_SURFACE',context:{regionId:'region-a'},selectedId:'s-alpha'}));
assert.equal(deterministicA,deterministicB);

const witness={
  schema:'ofu-v1x-08-test-witness-1',
  status:'PASS',
  cases:22,
  absent:{status:absent.status,objects:absent.objects.length,traces:absent.historyTraces.length},
  before:{objects:current.objects.length,links:current.links.length,traces:current.historyTraces.length,alphaKind:alpha.kind,infraKind:infra.kind},
  after:{objects:after.objects.length,links:after.links.length,traces:after.historyTraces.length,alphaKind:alphaAfter.kind,infraKind:infraAfter.kind,traceGrammar:[...new Set(after.historyTraces.map(x=>x.visualGrammar))].sort()},
  local:{objects:overlay.objects.length,links:overlay.links.length,traces:overlay.historyTraces.length},
  comparison:comparison.delta,
  authority:{projection:after.authority,source:after.sourceAuthority,historyCanonical:after.historyTraces.some(x=>x.sourceCanonical)},
  deterministic:true
};
console.log(JSON.stringify(witness));
