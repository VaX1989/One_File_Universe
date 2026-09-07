import {
  assertRecord, boundedArray, int, mulDivFloor, nonNegativeInt, ppm, sumSafe, uniqueIds
} from '../reference/bounded-math.mjs';

export const LIFE_LIMITS = Object.freeze({
  resources: 16,
  guilds: 32,
  trophicLinks: 128,
  patches: 64,
  lineages: 64,
  maxStock: 1_000_000_000,
  maxPopulation: 1_000_000_000,
  maxPerCapita: 1_000_000,
  maxTicksPerCall: 256
});

export const LIFE_AUTHORITY = 'RESEARCH_ONLY_MODEL_DERIVED_SIMULATION';

function validateResource(resource, i) {
  assertRecord(resource, `resources[${i}]`);
  nonNegativeInt(resource.stock, `resources[${i}].stock`, LIFE_LIMITS.maxStock);
  nonNegativeInt(resource.inflow ?? 0, `resources[${i}].inflow`, LIFE_LIMITS.maxStock);
  ppm(resource.lossPpm ?? 0, `resources[${i}].lossPpm`);
}

function validateGuild(guild, i, resourceIds) {
  assertRecord(guild, `guilds[${i}]`);
  if (!resourceIds.has(guild.resourceId)) throw new Error(`guilds[${i}] references unknown resource ${guild.resourceId}`);
  nonNegativeInt(guild.population, `guilds[${i}].population`, LIFE_LIMITS.maxPopulation);
  nonNegativeInt(guild.reserve ?? 0, `guilds[${i}].reserve`, LIFE_LIMITS.maxStock);
  nonNegativeInt(guild.maxUptakePerCapita, `guilds[${i}].maxUptakePerCapita`, LIFE_LIMITS.maxPerCapita);
  nonNegativeInt(guild.maintenancePerCapita, `guilds[${i}].maintenancePerCapita`, LIFE_LIMITS.maxPerCapita);
  ppm(guild.assimilationPpm, `guilds[${i}].assimilationPpm`);
  nonNegativeInt(guild.reproductionCost, `guilds[${i}].reproductionCost`, LIFE_LIMITS.maxStock);
  ppm(guild.baselineMortalityPpm ?? 0, `guilds[${i}].baselineMortalityPpm`);
}

export function validateEcologyState(state) {
  assertRecord(state, 'state');
  boundedArray(state.resources, 'resources', LIFE_LIMITS.resources);
  boundedArray(state.guilds, 'guilds', LIFE_LIMITS.guilds);
  const resourceIds = uniqueIds(state.resources, 'resources');
  uniqueIds(state.guilds, 'guilds');
  state.resources.forEach(validateResource);
  state.guilds.forEach((guild, i) => validateGuild(guild, i, resourceIds));
  return true;
}

export function thermodynamicOpportunity(input) {
  assertRecord(input, 'input');
  const donor = Boolean(input.donorAvailable);
  const acceptor = Boolean(input.acceptorAvailable);
  const gradient = int(input.freeEnergyGradientProxy ?? 0, 'freeEnergyGradientProxy', -1_000_000, 1_000_000);
  const pathway = input.pathwayAuthority ?? 'UNKNOWN';
  if (!['SOURCE_BACKED', 'MODEL_DERIVED', 'UNKNOWN'].includes(pathway)) throw new Error('invalid pathwayAuthority');

  if (!donor || !acceptor || gradient <= 0) {
    return Object.freeze({
      authority: LIFE_AUTHORITY,
      state: 'INSUFFICIENT_OPPORTUNITY',
      canInferLife: false,
      reason: !donor ? 'NO_DONOR' : !acceptor ? 'NO_ACCEPTOR' : 'NO_POSITIVE_GRADIENT_PROXY'
    });
  }
  return Object.freeze({
    authority: LIFE_AUTHORITY,
    state: pathway === 'SOURCE_BACKED' ? 'SOURCE_BACKED_OPPORTUNITY' : 'OPPORTUNITY_ONLY',
    canInferLife: false,
    reason: pathway === 'SOURCE_BACKED' ? 'DECLARED_PATHWAY_AND_GRADIENT' : 'GRADIENT_WITHOUT_SOURCE_BACKED_PATHWAY'
  });
}

function proportionalAllocations(stock, requests) {
  if (requests.length === 0 || stock === 0) return new Map(requests.map(({ id }) => [id, 0]));
  const totalRequest = sumSafe(requests.map(({ request }) => request), 'totalRequest');
  if (totalRequest <= stock) return new Map(requests.map(({ id, request }) => [id, request]));

  const sorted = [...requests].sort((a, b) => a.id.localeCompare(b.id));
  const allocations = new Map();
  let used = 0;
  for (const item of sorted) {
    const allocation = mulDivFloor(stock, item.request, totalRequest, 'proportionalAllocation');
    allocations.set(item.id, allocation);
    used += allocation;
  }
  let residual = stock - used;
  for (const item of sorted) {
    if (residual <= 0) break;
    const room = item.request - allocations.get(item.id);
    if (room > 0) {
      allocations.set(item.id, allocations.get(item.id) + 1);
      residual -= 1;
    }
  }
  return allocations;
}

export function stepEcology(state, forcing = {}) {
  validateEcologyState(state);
  assertRecord(forcing, 'forcing');
  const resourceDelta = forcing.resourceDelta ?? {};
  assertRecord(resourceDelta, 'forcing.resourceDelta');

  const resources = state.resources.map((resource) => {
    const delta = int(resourceDelta[resource.id] ?? 0, `resourceDelta.${resource.id}`, -LIFE_LIMITS.maxStock, LIFE_LIMITS.maxStock);
    const preLoss = resource.stock + (resource.inflow ?? 0) + delta;
    if (!Number.isSafeInteger(preLoss) || preLoss < 0 || preLoss > LIFE_LIMITS.maxStock) {
      throw new RangeError(`resource ${resource.id} forcing leaves valid bounds`);
    }
    const abioticLoss = mulDivFloor(preLoss, resource.lossPpm ?? 0, 1_000_000, 'abioticLoss');
    return { ...resource, stock: preLoss - abioticLoss, abioticLoss, openingWithForcing: preLoss };
  });

  const requestsByResource = new Map(resources.map((resource) => [resource.id, []]));
  for (const guild of state.guilds) {
    const request = Math.min(
      LIFE_LIMITS.maxStock,
      mulDivFloor(guild.population, guild.maxUptakePerCapita, 1, `uptakeRequest.${guild.id}`)
    );
    requestsByResource.get(guild.resourceId).push({ id: guild.id, request });
  }

  const allocationByGuild = new Map();
  for (const resource of resources) {
    const allocations = proportionalAllocations(resource.stock, requestsByResource.get(resource.id));
    let consumed = 0;
    for (const [guildId, allocation] of allocations) {
      allocationByGuild.set(guildId, allocation);
      consumed += allocation;
    }
    resource.consumed = consumed;
    resource.stock -= consumed;
    if (resource.openingWithForcing !== resource.stock + resource.consumed + resource.abioticLoss) {
      throw new Error(`resource conservation failure for ${resource.id}`);
    }
  }

  const guilds = state.guilds.map((guild) => {
    const uptake = allocationByGuild.get(guild.id) ?? 0;
    const assimilated = mulDivFloor(uptake, guild.assimilationPpm, 1_000_000, `assimilated.${guild.id}`);
    const dissipated = uptake - assimilated;
    const available = guild.reserve + assimilated;
    if (!Number.isSafeInteger(available) || available > LIFE_LIMITS.maxStock) throw new RangeError(`guild ${guild.id} reserve overflow`);
    const maintenanceDemand = mulDivFloor(guild.population, guild.maintenancePerCapita, 1, `maintenance.${guild.id}`);
    const maintenanceSpent = Math.min(available, maintenanceDemand);
    let reserve = available - maintenanceSpent;
    const maintenanceDeficit = maintenanceDemand - maintenanceSpent;

    const maxBirthsByEnergy = guild.reproductionCost > 0 ? Math.floor(reserve / guild.reproductionCost) : 0;
    const maxBirthsByBound = Math.max(0, LIFE_LIMITS.maxPopulation - guild.population);
    const births = Math.min(maxBirthsByEnergy, maxBirthsByBound);
    const reproductionSpent = births * guild.reproductionCost;
    reserve -= reproductionSpent;

    const baselineDeaths = mulDivFloor(guild.population, guild.baselineMortalityPpm ?? 0, 1_000_000, `baselineDeaths.${guild.id}`);
    const deficitDeaths = guild.maintenancePerCapita > 0
      ? Math.min(guild.population - baselineDeaths, Math.ceil(maintenanceDeficit / guild.maintenancePerCapita))
      : 0;
    const deaths = Math.min(guild.population + births, baselineDeaths + deficitDeaths);
    const population = guild.population + births - deaths;

    const energyOpening = guild.reserve + assimilated;
    if (energyOpening !== reserve + maintenanceSpent + reproductionSpent) {
      throw new Error(`guild energy ledger failure for ${guild.id}`);
    }

    return {
      ...guild,
      population,
      reserve,
      evidence: {
        uptake,
        assimilated,
        dissipated,
        maintenanceDemand,
        maintenanceSpent,
        maintenanceDeficit,
        births,
        deaths,
        reproductionSpent
      }
    };
  });

  return Object.freeze({
    authority: LIFE_AUTHORITY,
    currencyClaim: 'ABSTRACT_RESOURCE_AND_ENERGY_QUANTA_NOT_JOULES',
    resources: resources.map(({ openingWithForcing, ...rest }) => rest),
    guilds
  });
}
