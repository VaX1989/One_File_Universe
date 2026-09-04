import assert from 'node:assert/strict';
import {SOURCE_RECORD_CONTRACT,geochemicalFreeEnergySupply} from '../../research/p5-environment-next-science/geochemical-energy-wave4.mjs';
const src=id=>({contractId:SOURCE_RECORD_CONTRACT,sourceId:id,sourceVersion:'v1',validityDomain:'explicit reaction fixture'});
const out=geochemicalFreeEnergySupply([{reactionId:'R1',availableFreeEnergyMicroJPerMol:50000n,reactionExtentNanoMolPerStep:2000n,thermodynamicSource:src('thermo'),extentSource:src('extent')}]);
assert.equal(out.freeEnergySupplyFemtoJPerStep,100000000n);assert.equal(out.biologicallyUsableEnergyEstablished,false);assert.equal(out.nutrientAvailabilityEstablished,false);assert.equal(out.geologicalProcessEstablished,false);
assert.throws(()=>geochemicalFreeEnergySupply([]),/bounded non-empty/);assert.throws(()=>geochemicalFreeEnergySupply([{reactionId:'R1',availableFreeEnergyMicroJPerMol:(1n<<64n)-1n,reactionExtentNanoMolPerStep:2n,thermodynamicSource:src('thermo'),extentSource:src('extent')}]),/overflow/);
console.log('P5 Wave IV geochemical energy tests PASS',String(out.freeEnergySupplyFemtoJPerStep));
