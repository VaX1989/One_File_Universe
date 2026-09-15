const fmt=value=>Number.isFinite(value)?value.toFixed(3):'n/a';

export function buildHumanSummary(report){
  const diversity=report.diversity?.score;
  const issueRows=Object.entries(report.issueCounts||{}).sort(([a],[b])=>a.localeCompare(b));
  return [
    `# OFU Quality Observatory — ${report.campaignId}`,
    '',
    `Status: **${report.status}**`,
    '',
    `Samples: ${report.sampleCount}; failure witnesses: ${report.issueCount}; witness-set hash: \`${report.witnessSetHash}\`.`,
    '',
    '## Perceptual diversity',
    '',
    diversity?`Population spread: ${fmt(diversity.populationSpread)}; nearest-neighbor distinctness: ${fmt(diversity.nearestNeighborDistinctness)}; template-collapse rate: ${fmt(diversity.templateCollapseRate)}; descriptor coverage: ${fmt(diversity.descriptorCoverage)}.`:'No calibrated diversity score was produced for this campaign.',
    '',
    'The observatory deliberately reports a multidimensional score vector rather than a single magic number. Palette is one semantic component; image similarity is supporting evidence only.',
    '',
    '## Failures',
    '',
    issueRows.length?issueRows.map(([category,count])=>`- ${category}: ${count}`).join('\n'):'No configured failure condition was witnessed.',
    '',
    '## Performance / resources',
    '',
    `CPU update p95: ${fmt(report.performance.cpuUpdateMs.p95)} ms; CPU render p95: ${fmt(report.performance.cpuRenderMs.p95)} ms; verified GPU p95: ${fmt(report.performance.gpuFrameMs.p95)} ms.`,
    `Provenance mean coverage: ${fmt(report.provenance.meanCoverage)}; minimum coverage: ${fmt(report.provenance.minimumCoverage)}.`,
    '',
    'Every failure row in the machine-readable report retains the exact address, seed and model version witness supplied by the harness.'
  ].join('\n')+'\n';
}
