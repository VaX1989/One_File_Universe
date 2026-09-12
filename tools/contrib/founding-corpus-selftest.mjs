#!/usr/bin/env node
import { readJson } from './lib/control-plane.mjs';

const record = readJson('config/governance/founding-corpus.json');
const failures = [];
let checks = 0;
const check = (condition, message) => { checks += 1; if (!condition) failures.push(message); };

check(record.recordKind === 'PRE_COMMUNITY_SCALE_FOUNDING_CORPUS_BOUNDARY', 'unexpected founding corpus record kind');
check(record.boundary?.repository === 'VaX1989/One_File_Universe', 'founding repository changed');
check(record.boundary?.commit === 'ae406dbc8ac64fbd9161566ac1367bfacf2496f9', 'founding boundary commit changed');
check(record.boundary?.tree === 'e62971a10f3f54912197bc3904ac2f64e6c525cc', 'founding boundary tree changed');
check(record.publishedHistoricalRelease?.tag === 'v1.0.0', 'historical release tag changed');
check(record.publishedHistoricalRelease?.commit === '38dd0d7c0ccc4a100dc3b75d3d159c6933bc4c16', 'historical release commit changed');
check(record.publishedHistoricalRelease?.tree === 'b7576ebe21b3448b69e35c9cd8d279f51e4332fb', 'historical release tree changed');
check(record.publishedHistoricalRelease?.artifactSha256 === '013d4277da9acebcbb739275c27f6e05ccbc838840738cd2f9b03bb8f5def61a', 'historical release artifact hash changed');
check(record.claims?.exclusiveCopyrightOwnershipOfEveryPath === 'NOT_ASSERTED_PENDING_IP_AUDIT', 'founding record must not overclaim exclusive ownership before audit');
check(record.claims?.completeCommercialRelicensingChainOfTitle === 'NOT_ASSERTED_PENDING_IP_AUDIT', 'founding record must not overclaim commercial chain of title');
check(record.auditStatus === 'IP_AND_PROVENANCE_AUDIT_REQUIRED', 'founding corpus audit must remain explicitly pending until separately completed');

const result = { status: failures.length ? 'FAIL' : 'PASS', suite: 'ofu-founding-corpus-boundary-1', checks, failures };
console.log(JSON.stringify(result));
if (failures.length) process.exit(1);
