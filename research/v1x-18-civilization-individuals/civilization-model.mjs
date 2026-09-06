export const MODEL_FAMILY = Object.freeze({
  family: 'ofu-r18-civilization-family',
  stockFlow: 'ofu-r18-civ-stockflow-1',
  population: 'ofu-r18-civ-cohort-slices-1',
  exchange: 'ofu-r18-civ-gravity-exchange-1',
  institutions: 'ofu-r18-civ-institution-stock-1',
  culture: 'ofu-r18-civ-cultural-diffusion-1',
  history: 'ofu-r18-civ-history-legacy-1',
  authority: 'RESEARCH_ONLY'
});

export const LIMITS = Object.freeze({
  maxSettlements: 64,
  maxSlicesPerSettlement: 256,
  maxBirthLedgerEntries: 8192,
  maxHistoryEvents: 1024,
  maxYearsPerRun: 10000,
  maxPopulationPerSettlement: 1_000_000_000
});

const PPM = 1_000_000;
const FOOD_PER_PERSON = 100;
const MAX_SAFE = Number.MAX_SAFE_INTEGER;

function invariant(ok, message) {
  if (!ok) throw new Error(`R18 civilization invariant: ${message}`);
}

function integer(value, name, min = 0, max = MAX_SAFE) {
  invariant(Number.isSafeInteger(value), `${name} must be a safe integer`);
  invariant(value >= min && value <= max, `${name} out of range`);
  return value;
}

function ppm(value, name) { return integer(value, name, 0, PPM); }
function clamp(value, lo, hi) { return Math.max(lo, Math.min(hi, value)); }
function mulDiv(a, b, divisor) {
  integer(a, 'mulDiv.a', -MAX_SAFE, MAX_SAFE);
  integer(b, 'mulDiv.b', -MAX_SAFE, MAX_SAFE);
  integer(divisor, 'mulDiv.divisor', 1, MAX_SAFE);
  const q = (BigInt(a) * BigInt(b)) / BigInt(divisor);
  const n = Number(q);
  invariant(Number.isSafeInteger(n), 'mulDiv result overflow');
  return n;
}
function addChecked(a, b, name = 'sum') {
  const n = a + b;
  invariant(Number.isSafeInteger(n), `${name} overflow`);
  return n;
}
function sum(values, name = 'sum') {
  return values.reduce((acc, value) => addChecked(acc, integer(value, name, 0), name), 0);
}
function stableClone(value) { return structuredClone(value); }
function sorted(values, fn) { return [...values].sort(fn); }
function distance2(a, b) {
  const dx = a.xKm - b.xKm, dy = a.yKm - b.yKm;
  return dx * dx + dy * dy + 25;
}
function isqrt(value) {
  integer(value, 'isqrt.value', 0);
  let n=BigInt(value); if(n<2n)return Number(n);
  let x0=n, x1=(x0+n/x0)>>1n;
  while(x1<x0){x0=x1;x1=(x0+n/x0)>>1n;}
  return Number(x0);
}
function ratioBigIntClamped(numerator, denominator, max) {
  invariant(typeof numerator==='bigint'&&numerator>=0n,'ratio numerator');
  integer(denominator,'ratio denominator',1);integer(max,'ratio max',0);
  const q=numerator/BigInt(denominator);return q>BigInt(max)?max:Number(q);
}

function ageAt(slice, year) { return year - slice.birthYear; }
function ageBand(age) { return age < 15 ? 'child' : age < 65 ? 'adult' : 'elder'; }
function mortalityPpm(age, stressPpm) {
  if(age>=110)return PPM;
  const baseline = age < 5 ? 12_000 : age < 15 ? 2_000 : age < 50 ? 4_000 : age < 65 ? 10_000 : age < 80 ? 45_000 : 140_000;
  return clamp(baseline + mulDiv(stressPpm, age < 15 ? 80_000 : age < 65 ? 120_000 : 180_000, PPM), 0, 900_000);
}

function canonicalSlice(slice) {
  invariant(slice && typeof slice === 'object', 'slice required');
  invariant(typeof slice.originId === 'string' && slice.originId.length > 0, 'slice originId');
  integer(slice.birthYear, 'slice.birthYear', -100000, 100000);
  integer(slice.serialStart, 'slice.serialStart');
  integer(slice.count, 'slice.count', 0, LIMITS.maxPopulationPerSettlement);
  return {originId: slice.originId, birthYear: slice.birthYear, serialStart: slice.serialStart, count: slice.count};
}

function compactSlices(slices) {
  const ordered = sorted(slices.filter(s => s.count > 0).map(canonicalSlice), (a,b) =>
    a.birthYear - b.birthYear || a.originId.localeCompare(b.originId) || a.serialStart - b.serialStart);
  const out = [];
  for (const slice of ordered) {
    const last = out[out.length - 1];
    if (last && last.originId === slice.originId && last.birthYear === slice.birthYear && last.serialStart + last.count === slice.serialStart) {
      last.count = addChecked(last.count, slice.count, 'slice merge');
    } else out.push({...slice});
  }
  invariant(out.length <= LIMITS.maxSlicesPerSettlement, 'slice working-set budget exceeded');
  return out;
}

function cohortCounts(settlement, year) {
  const result = {child: 0, adult: 0, elder: 0};
  for (const slice of settlement.slices) result[ageBand(ageAt(slice, year))] += slice.count;
  return result;
}
function population(settlement) { return sum(settlement.slices.map(s => s.count), 'population'); }

function canonicalSettlement(input, year) {
  invariant(input && typeof input === 'object', 'settlement required');
  invariant(typeof input.id === 'string' && /^[a-z0-9._:-]{1,96}$/i.test(input.id), 'settlement id');
  const settlement = {
    id: input.id,
    xKm: integer(input.xKm ?? 0, 'xKm', -10_000_000, 10_000_000),
    yKm: integer(input.yKm ?? 0, 'yKm', -10_000_000, 10_000_000),
    landFoodCapacity: integer(input.landFoodCapacity ?? 1_000_000, 'landFoodCapacity'),
    foodStock: integer(input.foodStock ?? 500_000, 'foodStock'),
    wealth: integer(input.wealth ?? 100_000, 'wealth'),
    infrastructure: integer(input.infrastructure ?? 100_000, 'infrastructure'),
    productiveCapacity: integer(input.productiveCapacity ?? 100_000, 'productiveCapacity'),
    institutionCapacityPpm: ppm(input.institutionCapacityPpm ?? 550_000, 'institutionCapacityPpm'),
    institutionLegitimacyPpm: ppm(input.institutionLegitimacyPpm ?? 550_000, 'institutionLegitimacyPpm'),
    technologyPpm: ppm(input.technologyPpm ?? 250_000, 'technologyPpm'),
    culturalMarkerPpm: ppm(input.culturalMarkerPpm ?? 500_000, 'culturalMarkerPpm'),
    conflictPpm: ppm(input.conflictPpm ?? 0, 'conflictPpm'),
    ruins: integer(input.ruins ?? 0, 'ruins'),
    routeLegacy: integer(input.routeLegacy ?? 0, 'routeLegacy'),
    tradeVolumeLast: integer(input.tradeVolumeLast ?? 0, 'tradeVolumeLast'),
    migrationBalanceLast: integer(input.migrationBalanceLast ?? 0, 'migrationBalanceLast', -LIMITS.maxPopulationPerSettlement, LIMITS.maxPopulationPerSettlement),
    slices: compactSlices(input.slices ?? []),
    foundedYear: integer(input.foundedYear ?? year, 'foundedYear', -100000, 100000),
    abandonedSinceYear: input.abandonedSinceYear === null || input.abandonedSinceYear === undefined ? null : integer(input.abandonedSinceYear, 'abandonedSinceYear', -100000, 100000)
  };
  invariant(population(settlement) <= LIMITS.maxPopulationPerSettlement, 'population bound');
  return settlement;
}

export function createWorld(input) {
  invariant(input && typeof input === 'object', 'world input required');
  const year = integer(input.year ?? 0, 'world.year', -100000, 100000);
  invariant(Array.isArray(input.settlements) && input.settlements.length > 0 && input.settlements.length <= LIMITS.maxSettlements, 'settlement count');
  const ids = new Set();
  const settlements = input.settlements.map(s => canonicalSettlement(s, year));
  for (const s of settlements) { invariant(!ids.has(s.id), 'duplicate settlement id'); ids.add(s.id); }
  const world = {
    modelId: MODEL_FAMILY.stockFlow,
    worldId: String(input.worldId ?? 'research-world'),
    year,
    step: integer(input.step ?? 0, 'world.step'),
    settlements,
    birthLedger: stableClone(input.birthLedger ?? []),
    history: stableClone(input.history ?? [])
  };
  invariant(world.birthLedger.length <= LIMITS.maxBirthLedgerEntries, 'birth ledger bound');
  invariant(world.history.length <= LIMITS.maxHistoryEvents, 'history bound');
  return validateWorld(world);
}

export function seedSettlement({id, xKm=0, yKm=0, year=0, population=10000, childPpm=250000, elderPpm=100000, ...rest}) {
  integer(population, 'seed population', 1, LIMITS.maxPopulationPerSettlement);
  ppm(childPpm, 'childPpm'); ppm(elderPpm, 'elderPpm');
  invariant(childPpm + elderPpm <= PPM, 'age shares');
  const child = mulDiv(population, childPpm, PPM);
  const elder = mulDiv(population, elderPpm, PPM);
  const adult = population - child - elder;
  return {
    id, xKm, yKm, foundedYear: year,
    slices: [
      {originId:id,birthYear:year-8,serialStart:0,count:child},
      {originId:id,birthYear:year-35,serialStart:0,count:adult},
      {originId:id,birthYear:year-72,serialStart:0,count:elder}
    ],
    ...rest
  };
}

export function validateWorld(world) {
  invariant(world?.modelId === MODEL_FAMILY.stockFlow, 'model id mismatch');
  integer(world.year, 'world.year', -100000, 100000);
  integer(world.step, 'world.step');
  invariant(Array.isArray(world.settlements) && world.settlements.length <= LIMITS.maxSettlements, 'settlements invalid');
  const ids = new Set();
  for (const s of world.settlements) {
    invariant(!ids.has(s.id), 'duplicate settlement'); ids.add(s.id);
    canonicalSettlement(s, world.year);
  }
  invariant(Array.isArray(world.birthLedger) && world.birthLedger.length <= LIMITS.maxBirthLedgerEntries, 'birth ledger invalid');
  invariant(Array.isArray(world.history) && world.history.length <= LIMITS.maxHistoryEvents, 'history invalid');
  return world;
}

function welfarePpm(s, year, localFoodSatisfactionPpm) {
  const infraPpm = clamp(mulDiv(s.infrastructure, PPM, Math.max(1, s.productiveCapacity + s.infrastructure)), 0, PPM);
  const base = mulDiv(localFoodSatisfactionPpm, 550_000, PPM)
    + mulDiv(s.institutionLegitimacyPpm, 250_000, PPM)
    + mulDiv(infraPpm, 200_000, PPM);
  return clamp(base - mulDiv(s.conflictPpm, 350_000, PPM), 0, PPM);
}

function removeMigrantsFromSlices(settlement, year, count) {
  let remaining = count;
  const slices = settlement.slices.map(s => ({...s}));
  const moved = [];
  const order = slices.map((s,i) => ({s,i,age:ageAt(s,year)}))
    .filter(x => x.age >= 15 && x.age < 55)
    .sort((a,b) => a.age-b.age || a.s.originId.localeCompare(b.s.originId) || b.s.serialStart-a.s.serialStart);
  for (const item of order) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, item.s.count);
    if (!take) continue;
    const start = item.s.serialStart + item.s.count - take;
    moved.push({originId:item.s.originId,birthYear:item.s.birthYear,serialStart:start,count:take});
    item.s.count -= take;
    remaining -= take;
  }
  if (remaining > 0) {
    const fallback = slices.map((s,i)=>({s,i})).filter(x=>x.s.count>0).sort((a,b)=>b.s.birthYear-a.s.birthYear || a.s.originId.localeCompare(b.s.originId));
    for (const item of fallback) {
      if (remaining <= 0) break;
      const take=Math.min(remaining,item.s.count),start=item.s.serialStart+item.s.count-take;
      moved.push({originId:item.s.originId,birthYear:item.s.birthYear,serialStart:start,count:take});
      item.s.count-=take; remaining-=take;
    }
  }
  invariant(remaining === 0, 'migration exceeds source population');
  settlement.slices = compactSlices(slices);
  return compactSlices(moved);
}

function appendHistory(world, event) {
  world.history.push(event);
  if (world.history.length > LIMITS.maxHistoryEvents) world.history.splice(0, world.history.length - LIMITS.maxHistoryEvents);
}

function stepDemography(world, diagnostics) {
  const nextYear = world.year + 1;
  for (const s of world.settlements) {
    const popBefore = population(s);
    const foodSat = diagnostics.get(s.id).foodSatisfactionPpm;
    const stress = clamp((PPM-foodSat) + mulDiv(s.conflictPpm, 500_000, PPM), 0, PPM);
    let deaths = 0;
    const survivors = [];
    for (const slice of s.slices) {
      const age = ageAt(slice, nextYear);
      const rate = mortalityPpm(age, stress);
      const lost = Math.min(slice.count, mulDiv(slice.count, rate, PPM));
      deaths += lost;
      if (slice.count - lost > 0) survivors.push({...slice,count:slice.count-lost});
    }
    s.slices = compactSlices(survivors);
    const cohorts = cohortCounts(s, nextYear);
    const fertilityBase = 45_000;
    const fertility = clamp(mulDiv(fertilityBase, 500_000 + mulDiv(foodSat, 500_000, PPM), PPM), 5_000, 70_000);
    const births = mulDiv(cohorts.adult, fertility, PPM);
    if (births > 0) {
      const slice = {originId:s.id,birthYear:nextYear,serialStart:0,count:births};
      s.slices = compactSlices([...s.slices, slice]);
      world.birthLedger.push({settlementId:s.id,birthYear:nextYear,count:births});
      invariant(world.birthLedger.length <= LIMITS.maxBirthLedgerEntries, 'birth ledger checkpoint required');
    }
    diagnostics.get(s.id).births = births;
    diagnostics.get(s.id).deaths = deaths;
    diagnostics.get(s.id).populationBefore = popBefore;
  }
}

function stepFoodAndProduction(world, drivers, diagnostics) {
  for (const s of world.settlements) {
    const ecology = ppm(drivers.ecologyPpmBySettlement?.[s.id] ?? PPM, `ecology ${s.id}`);
    const shock = ppm(drivers.productiveShockPpmBySettlement?.[s.id] ?? PPM, `productive shock ${s.id}`);
    const techBonus = 700_000 + mulDiv(s.technologyPpm, 600_000, PPM);
    const infraBonus = 800_000 + clamp(mulDiv(s.infrastructure, 300_000, Math.max(1, s.infrastructure+s.productiveCapacity)), 0, 300_000);
    let produced = mulDiv(s.landFoodCapacity, ecology, PPM);
    produced = mulDiv(produced, shock, PPM);
    produced = mulDiv(produced, techBonus, PPM);
    produced = mulDiv(produced, infraBonus, PPM);
    const pop = population(s), need = pop * FOOD_PER_PERSON;
    invariant(Number.isSafeInteger(need), 'food demand overflow');
    s.foodStock = addChecked(s.foodStock, produced, 'food stock production');
    diagnostics.set(s.id,{produced,need,foodBeforeTrade:s.foodStock,tradeIn:0,tradeOut:0,tradeLoss:0});
  }
}

function stepTrade(world, diagnostics) {
  const settlements = sorted(world.settlements, (a,b)=>a.id.localeCompare(b.id));
  for (const donor of settlements) {
    const dd = diagnostics.get(donor.id);
    let surplus = Math.max(0, donor.foodStock - dd.need);
    if (!surplus) continue;
    const receivers = settlements.filter(r => r.id !== donor.id && diagnostics.get(r.id).need > r.foodStock);
    for (const receiver of receivers) {
      if (surplus <= 0) break;
      const rd = diagnostics.get(receiver.id), deficit = Math.max(0, rd.need - receiver.foodStock);
      if (!deficit) continue;
      const d2 = distance2(donor,receiver);
      const route = donor.routeLegacy + receiver.routeLegacy;
      const frictionPpm = clamp(900_000 - Math.min(300_000, Math.floor(route / 1000)) + Math.min(90_000, Math.floor(d2 / 2000)), 500_000, 990_000);
      const donorPop = Math.max(1,population(donor)), receiverPop=Math.max(1,population(receiver));
      const gravityScore = (BigInt(donorPop) * BigInt(receiverPop) * 1000n) / BigInt(Math.max(1,d2));
      const magnitude = Math.max(1,gravityScore.toString().length-1);
      const accessPpm = clamp(100_000 + magnitude * 75_000, 100_000, 750_000);
      let shipped = Math.min(surplus, deficit, mulDiv(surplus, accessPpm, PPM));
      if (!shipped) continue;
      const received = mulDiv(shipped, frictionPpm, PPM), loss = shipped - received;
      donor.foodStock -= shipped; receiver.foodStock = addChecked(receiver.foodStock,received,'trade receipt'); surplus -= shipped;
      dd.tradeOut += shipped; dd.tradeLoss += loss; rd.tradeIn += received;
      donor.routeLegacy = addChecked(donor.routeLegacy, Math.floor(shipped/1000), 'route legacy');
      receiver.routeLegacy = addChecked(receiver.routeLegacy, Math.floor(received/1000), 'route legacy');
    }
  }
  for (const s of world.settlements) {
    const d=diagnostics.get(s.id), consumed=Math.min(s.foodStock,d.need);
    s.foodStock -= consumed;
    d.foodConsumed=consumed;
    d.foodSatisfactionPpm=d.need===0?PPM:clamp(mulDiv(consumed,PPM,d.need),0,PPM);
    s.tradeVolumeLast=d.tradeIn+d.tradeOut;
    s.routeLegacy=mulDiv(s.routeLegacy,995_000,PPM);
  }
}

function stepMigration(world, diagnostics) {
  const settlements=sorted(world.settlements,(a,b)=>a.id.localeCompare(b.id));
  const welfare=new Map(settlements.map(s=>[s.id,welfarePpm(s,world.year+1,diagnostics.get(s.id).foodSatisfactionPpm)]));
  const plans=[];
  for(const source of settlements){
    let budget=mulDiv(population(source),25_000,PPM);
    if(!budget)continue;
    const candidates=settlements.filter(d=>d.id!==source.id&&welfare.get(d.id)>welfare.get(source.id)+40_000)
      .sort((a,b)=>(welfare.get(b.id)-welfare.get(source.id))-(welfare.get(a.id)-welfare.get(source.id))||distance2(source,a)-distance2(source,b)||a.id.localeCompare(b.id));
    for(const dest of candidates){
      if(budget<=0)break;
      const gap=welfare.get(dest.id)-welfare.get(source.id),friction=Math.min(PPM,isqrt(distance2(source,dest))*2000);
      const rate=clamp(mulDiv(gap,200_000,PPM)-Math.floor(friction/8),0,120_000);
      const move=Math.min(budget,mulDiv(population(source),rate,PPM));
      if(move>0){plans.push({source:source.id,dest:dest.id,count:move});budget-=move;}
    }
  }
  const byId=new Map(settlements.map(s=>[s.id,s]));
  for(const s of settlements)s.migrationBalanceLast=0;
  for(const plan of plans){
    const source=byId.get(plan.source),dest=byId.get(plan.dest),available=population(source),count=Math.min(plan.count,available);
    if(!count)continue;
    const moved=removeMigrantsFromSlices(source,world.year+1,count);
    dest.slices=compactSlices([...dest.slices,...moved]);
    source.migrationBalanceLast-=count;dest.migrationBalanceLast+=count;
  }
}

function stepInstitutionsEconomyCulture(world, diagnostics) {
  const settlements=sorted(world.settlements,(a,b)=>a.id.localeCompare(b.id));
  for(const s of settlements){
    const d=diagnostics.get(s.id),pop=Math.max(1,population(s));
    const labor=cohortCounts(s,world.year+1).adult;
    const productivityPpm=500_000+mulDiv(s.technologyPpm,500_000,PPM);
    const output=mulDiv(labor,productivityPpm,1000);
    s.wealth=addChecked(s.wealth,output,'wealth output');
    const scarcity=PPM-d.foodSatisfactionPpm;
    const tension=clamp(mulDiv(scarcity,500_000,PPM)+mulDiv(PPM-s.institutionLegitimacyPpm,250_000,PPM)+mulDiv(Math.max(0,-s.migrationBalanceLast),250_000,Math.max(1,pop)),0,PPM);
    s.conflictPpm=clamp(mulDiv(s.conflictPpm,650_000,PPM)+mulDiv(tension,350_000,PPM),0,PPM);
    const fiscal=clamp(mulDiv(s.wealth,PPM,Math.max(1,s.wealth+pop*30)),0,PPM);
    const capacityDelta=mulDiv(fiscal,25_000,PPM)-mulDiv(s.conflictPpm,35_000,PPM);
    s.institutionCapacityPpm=clamp(s.institutionCapacityPpm+capacityDelta,0,PPM);
    const legitimacyDelta=mulDiv(d.foodSatisfactionPpm-500_000,25_000,PPM)-mulDiv(s.conflictPpm,25_000,PPM);
    s.institutionLegitimacyPpm=clamp(s.institutionLegitimacyPpm+legitimacyDelta,0,PPM);
    const investment=mulDiv(s.wealth,clamp(mulDiv(s.institutionCapacityPpm,60_000,PPM),5_000,60_000),PPM);
    s.wealth-=investment;s.infrastructure=addChecked(s.infrastructure,investment,'infrastructure investment');
    const maintenance=mulDiv(s.infrastructure,8_000,PPM),damage=mulDiv(s.infrastructure,mulDiv(s.conflictPpm,35_000,PPM),PPM);
    const lost=Math.min(s.infrastructure,maintenance+damage);s.infrastructure-=lost;s.ruins=addChecked(s.ruins,lost,'ruins');
    s.ruins=mulDiv(s.ruins,998_000,PPM);
    const innovation=clamp(mulDiv(s.tradeVolumeLast,90_000,Math.max(1,s.tradeVolumeLast+pop*20))+mulDiv(s.infrastructure,40_000,Math.max(1,s.infrastructure+s.ruins)),0,120_000);
    s.technologyPpm=clamp(s.technologyPpm+mulDiv(PPM-s.technologyPpm,innovation,PPM),0,PPM);
  }
  // Network diffusion is deliberately weak and integer-only; it is not calibrated history.
  const cultureNext=new Map();
  for(const s of settlements){
    let weighted=0n,weight=0;
    for(const o of settlements){if(o.id===s.id)continue;const raw=BigInt(s.tradeVolumeLast+o.tradeVolumeLast+1)*1000n;const w=ratioBigIntClamped(raw,distance2(s,o),1_000_000);weighted+=BigInt(o.culturalMarkerPpm)*BigInt(w);weight+=w;}
    const network=weight?Number(weighted/BigInt(weight)):s.culturalMarkerPpm;
    cultureNext.set(s.id,clamp(mulDiv(s.culturalMarkerPpm,970_000,PPM)+mulDiv(network,30_000,PPM),0,PPM));
  }
  for(const s of settlements)s.culturalMarkerPpm=cultureNext.get(s.id);
}

function stepHistoricalConsequences(world, diagnostics) {
  for(const s of world.settlements){
    const pop=population(s),d=diagnostics.get(s.id);
    if(pop < 25 && s.abandonedSinceYear===null){
      s.abandonedSinceYear=world.year+1;
      const lost=mulDiv(s.infrastructure,650_000,PPM);s.infrastructure-=lost;s.ruins=addChecked(s.ruins,lost,'abandonment ruins');
      appendHistory(world,{type:'ABANDONMENT',year:world.year+1,settlementId:s.id,population:pop,ruinsAdded:lost});
    } else if(pop >= 25 && s.abandonedSinceYear!==null){
      appendHistory(world,{type:'REOCCUPATION',year:world.year+1,settlementId:s.id,previousAbandonmentYear:s.abandonedSinceYear,routeLegacy:s.routeLegacy,ruins:s.ruins});
      s.abandonedSinceYear=null;
    }
    if(s.conflictPpm>650_000&&d.populationBefore>=100){appendHistory(world,{type:'HIGH_TENSION_CONFLICT',year:world.year+1,settlementId:s.id,conflictPpm:s.conflictPpm,ruins:s.ruins});}
  }
}

export function stepWorld(worldInput, drivers = {}) {
  const world=createWorld(stableClone(worldInput));
  invariant(world.step < LIMITS.maxYearsPerRun, 'run length bound');
  const diagnostics=new Map();
  stepFoodAndProduction(world,drivers,diagnostics);
  stepTrade(world,diagnostics);
  stepDemography(world,diagnostics);
  stepMigration(world,diagnostics);
  stepInstitutionsEconomyCulture(world,diagnostics);
  stepHistoricalConsequences(world,diagnostics);
  world.year+=1; world.step+=1;
  for(const s of world.settlements)s.slices=compactSlices(s.slices);
  validateWorld(world);
  return Object.freeze({world, diagnostics:Object.freeze(Object.fromEntries([...diagnostics].map(([k,v])=>[k,Object.freeze({...v})])))});
}

export function simulate(world, years, driverFn = () => ({})) {
  integer(years,'years',0,LIMITS.maxYearsPerRun);
  let current=createWorld(world); const trace=[];
  for(let i=0;i<years;i++){
    const result=stepWorld(current,driverFn(current,i));current=result.world;
    trace.push({year:current.year,settlements:current.settlements.map(s=>({id:s.id,population:population(s),foodStock:s.foodStock,wealth:s.wealth,infrastructure:s.infrastructure,ruins:s.ruins,routeLegacy:s.routeLegacy,technologyPpm:s.technologyPpm,conflictPpm:s.conflictPpm,migrationBalanceLast:s.migrationBalanceLast}))});
  }
  return Object.freeze({world:current,trace:Object.freeze(trace)});
}

export function settlementSummary(world, settlementId) {
  validateWorld(world);const s=world.settlements.find(x=>x.id===settlementId);invariant(s,'unknown settlement');
  return Object.freeze({
    id:s.id,year:world.year,population:population(s),cohorts:cohortCounts(s,world.year),foodStock:s.foodStock,wealth:s.wealth,infrastructure:s.infrastructure,
    ruins:s.ruins,routeLegacy:s.routeLegacy,technologyPpm:s.technologyPpm,institutionCapacityPpm:s.institutionCapacityPpm,institutionLegitimacyPpm:s.institutionLegitimacyPpm,
    culturalMarkerPpm:s.culturalMarkerPpm,conflictPpm:s.conflictPpm,migrationBalanceLast:s.migrationBalanceLast,slices:s.slices.length,abandonedSinceYear:s.abandonedSinceYear
  });
}

export const internals = Object.freeze({PPM,FOOD_PER_PERSON,population,cohortCounts,ageAt,ageBand,mulDiv,compactSlices});
