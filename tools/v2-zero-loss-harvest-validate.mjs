import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const SHA40 = /^[0-9a-f]{40}$/;
const RELATIONS = new Set(['BEHIND','AHEAD','DIVERGED','IDENTICAL']);
const EXPECTED = Array.from({length:16},(_,i)=>`V2X-${String(i+1).padStart(2,'0')}`);
const COMPLETION = new Set(['SOURCE','SHIPPING_MANIFEST','ONE_FILE_HTML','RUNTIME_EXPORT','ACTUAL_CONSUMER','LIVING_VIEWPORT_OR_USER_ACTION','VISIBLE_OR_AUDIBLE_CONSEQUENCE','PERSISTENCE_OR_REVISIT_WHEN_APPLICABLE','EXACT_ARTIFACT_BROWSER_EVIDENCE']);
const SHIPPING = new Set(EXPECTED.slice(0,14));
const RESEARCH = new Set(['V2X-15','V2X-16']);
function fail(m){throw new Error(`V2 zero-loss harvest: ${m}`)}
function ok(v,m){if(!v)fail(m)}
function matches(file,pattern){if(pattern.endsWith('/**'))return file.startsWith(pattern.slice(0,-3));if(pattern.includes('*')){const e=pattern.replace(/[.+?^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*');return new RegExp(`^${e}$`).test(file)}return file===pattern}
function laneSet(records,label){ok(Array.isArray(records)&&records.length===16,`${label} must contain exactly 16 lanes`);const ids=records.map(x=>x.lane);ok(new Set(ids).size===16,`${label} duplicate lane`);ok(EXPECTED.every(id=>ids.includes(id)),`${label} V2X-01..16 coverage incomplete`)}
function validateRecord(r,relationField){ok(EXPECTED.includes(r.lane),`unknown lane ${r.lane}`);ok(typeof r.branch==='string'&&r.branch.length>0,`${r.lane} branch required`);ok(SHA40.test(r.headSha),`${r.lane} head SHA invalid`);ok(RELATIONS.has(r[relationField]),`${r.lane} relation invalid`);ok(Number.isInteger(r.aheadBy)&&r.aheadBy>=0,`${r.lane} aheadBy invalid`);ok(Number.isInteger(r.behindBy)&&r.behindBy>=0,`${r.lane} behindBy invalid`)}

export function validateLedgerObject(x){
 ok(x&&typeof x==='object'&&!Array.isArray(x),'ledger object required');
 ok(x.schema==='ofu-v2-zero-loss-harvest-ledger-2','unexpected schema');
 ok(x.version==='2026-09-08.2','unexpected version');
 ok(x.lane?.branch==='parallel/v2.0-00-zero-loss-harvest-2026-09-07','lane branch changed');
 ok(x.lane?.status==='COMPLETE','lane must be COMPLETE');
 ok(Array.isArray(x.lane?.remainingOwnedBlockers)&&x.lane.remainingOwnedBlockers.length===0,'remaining owned blockers must be empty');
 ok(x.authorizedBase?.sha==='2977c11a0ac97eba8fd7b6b7df9c958ea1a2d9a7','authorized base SHA changed');
 ok(x.authorizedBase?.tree==='99e6b5ff6229d9c34d381e778c5689bf2367d256','authorized base tree changed');
 ok(x.authorizedBase?.parallelLaunchStatus==='FULL','parallel launch not FULL');
 ok(SHA40.test(x.centralSyncBase?.sha||''),'central sync SHA invalid');
 ok(SHA40.test(x.centralSyncBase?.tree||''),'central sync tree invalid');
 ok(x.centralSyncBase?.policy==='CENTRAL_BYTES_IMPORTED_UNCHANGED_AS_MERGE_PARENT_NO_DIRECT_CENTRAL_WRITES','central sync policy weakened');
 const b=x.authorityBoundary;ok(b?.precedence==='DENY_BEFORE_ALLOW','authority precedence weakened');ok(b?.runtimeCompositionDecision==='NO_NEW_RUNTIME_COMPONENT','unbound runtime component introduced');
 ok(Array.isArray(b.centralOwnerOnlyPatterns)&&b.centralOwnerOnlyPatterns.length>0,'central deny patterns required');ok(Array.isArray(b.ownedPaths)&&b.ownedPaths.length===4,'exact owned path set required');ok(new Set(b.ownedPaths).size===4,'duplicate owned path');
 for(const p of b.ownedPaths)for(const d of b.centralOwnerOnlyPatterns)ok(!matches(p,d),`owned path crosses central boundary: ${p} matches ${d}`);
 ok(Array.isArray(x.completionLaw)&&x.completionLaw.length===COMPLETION.size,'completion law size mismatch');ok(new Set(x.completionLaw).size===COMPLETION.size,'completion law duplicate');for(const s of x.completionLaw)ok(COMPLETION.has(s),`unknown completion stage ${s}`);
 laneSet(x.historicalBaseHarvest,'historical harvest');
 for(const r of x.historicalBaseHarvest){validateRecord(r,'relationToAuthorizedBase');if(r.aheadBy===0)ok(r.disposition==='ALREADY_HARVESTED_IN_AUTHORIZED_BASE',`${r.lane} zero-ahead historical disposition invalid`);else ok(['SEMANTIC_REVIEW_NO_BLIND_CHERRYPICK','RESEARCH_ONLY_PRESERVE'].includes(r.disposition),`${r.lane} unique historical disposition invalid`)}
 laneSet(x.currentCheckpointHarvest,'current checkpoint harvest');
 for(const r of x.currentCheckpointHarvest){validateRecord(r,'relationToCentralSyncBase');ok(r.aheadBy>0,`${r.lane} current checkpoint must preserve observed unique history`);ok(r.relationToCentralSyncBase==='DIVERGED'||r.relationToCentralSyncBase==='AHEAD',`${r.lane} current checkpoint relation inconsistent`);if(SHIPPING.has(r.lane))ok(r.disposition==='CENTRAL_INTEGRATION_REQUIRED',`${r.lane} shipping checkpoint disposition invalid`);if(RESEARCH.has(r.lane)){ok(r.disposition==='RESEARCH_ONLY_PRESERVE',`${r.lane} research disposition invalid`);ok(r.authority==='RESEARCH_ONLY',`${r.lane} research authority escalated`);ok(r.shippingPromotionPerformed===false,`${r.lane} shipping promotion falsely claimed`)}}
 const c05=x.currentCheckpointHarvest.find(r=>r.lane==='V2X-05'),c16=x.currentCheckpointHarvest.find(r=>r.lane==='V2X-16');ok(c05?.namespace==='LEGACY_FALLBACK_NO_V2_0_REF','V2X-05 namespace fallback must remain explicit');ok(c16?.namespace==='LEGACY_FALLBACK_NO_V2_0_REF','V2X-16 namespace fallback must remain explicit');
 ok(x.researchAuthority?.['V2X-15']?.authority==='RESEARCH_ONLY','V2X-15 authority escalated');ok(x.researchAuthority?.['V2X-16']?.authority==='RESEARCH_ONLY','V2X-16 authority escalated');ok(x.researchAuthority['V2X-15'].canonicalPromotionPerformed===false,'V2X-15 canonical promotion falsely claimed');ok(x.researchAuthority['V2X-16'].canonicalPromotionPerformed===false,'V2X-16 canonical promotion falsely claimed');
 const life=x.forensicSignals?.['V2X-08'];ok(life?.richHistoricalModuleBytes===71209,'V2X-08 rich byte evidence changed');ok(life?.authorizedBaseFacadeBytes===6397,'V2X-08 facade byte evidence changed');ok(/does not prove/i.test(life?.interpretation||''),'V2X-08 byte evidence must remain non-probative');
 const ind=x.forensicSignals?.['V2X-10'];ok(ind?.authorizedBaseIdentityPersistentAcrossRevisit===true,'V2X-10 revisit evidence changed');ok(ind?.authorizedBaseRetainedMemoryPersistence===false,'V2X-10 memory falsely promoted');ok(ind?.authorizedBaseMortalityAwareRefinement===false,'V2X-10 mortality falsely promoted');
 ok(Array.isArray(x.externalDependencies)&&x.externalDependencies.length===2,'exact external dependency set required');for(const d of x.externalDependencies){ok(d.outsideLaneAuthority===true,`${d.id} must be outside lane authority`);ok(typeof d.owner==='string'&&d.owner.length>0,`${d.id} owner required`);ok(typeof d.reason==='string'&&d.reason.length>0,`${d.id} reason required`)}
 ok(x.evidence?.previousHostedExactHead?.repositorySuitesPassed===9,'hosted pass count changed');ok(x.evidence?.previousHostedExactHead?.repositorySuitesFailed===1,'hosted failure count changed');ok(x.evidence?.previousHostedExactHead?.failureClassification==='STALE_CENTRAL_SYNC_PATH_MISMATCH','hosted failure misclassified');
 return {schema:x.schema,historicalLanes:x.historicalBaseHarvest.length,currentLanes:x.currentCheckpointHarvest.length,currentUniqueCommits:x.currentCheckpointHarvest.reduce((n,r)=>n+r.aheadBy,0),externalDependencies:x.externalDependencies.map(d=>d.id)};
}
export function validateLedgerFile(file){const bytes=fs.readFileSync(file);const summary=validateLedgerObject(JSON.parse(bytes));return {...summary,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length}}
const isMain=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);if(isMain){const f=path.resolve(process.argv[2]||'docs/parallel/v2.0-00-zero-loss-harvest/ZERO_LOSS_HARVEST_LEDGER.json');const r=validateLedgerFile(f);console.log('V2 zero-loss harvest validator: PASS');console.log(JSON.stringify(r))}
