const test = require('node:test');
const assert = require('node:assert/strict');
const { aggregateEvidence } = require('../lib/shadow-evidence');

function item({ id, author, source, text, cluster = 'mcp-timeouts', url } = {}) {
  return {
    source,
    sourceRecordId: id,
    sourceUrl: url || `https://example.test/${id}`,
    authorKey: author,
    authorOrPublisher: author,
    problemClusterKey: cluster,
    sourceStatus: 'validated',
    text
  };
}

test('evidence score stays limited when one author repeats the same problem', () => {
  const result = aggregateEvidence([
    item({ id: 'one-a', author: 'alice', source: 'bluesky', text: 'MCP server timed out. Looking for a tool; willing to pay.' }),
    item({ id: 'one-b', author: 'alice', source: 'github', text: 'MCP server timed out. Looking for a tool; willing to pay.' })
  ]);
  const cluster = result.clusters['mcp-timeouts'];
  assert.equal(cluster.independentProblemAuthorCount, 1);
  assert.equal(cluster.independentDemandAuthorCount, 1);
  assert.equal(cluster.independentBuyingAuthorCount, 1);
  assert.equal(cluster.problemCorroborated, false);
  assert.equal(cluster.crossSourceCorroborated, false);
  assert.ok(cluster.evidenceScore < 40);
});

test('independent problem, demand and buying signals across sources raise evidence strength', () => {
  const records = [
    ['alice', 'bluesky'],
    ['bob', 'github'],
    ['carol', 'stackexchange']
  ].map(([author, source], index) => item({
    id: `independent-${index}`,
    author,
    source,
    text: 'Our MCP server timed out in production. Looking for a reliable tool; willing to pay. This is urgent.'
  }));
  const cluster = aggregateEvidence(records).clusters['mcp-timeouts'];
  assert.equal(cluster.independentProblemAuthorCount, 3);
  assert.equal(cluster.independentDemandAuthorCount, 3);
  assert.equal(cluster.independentBuyingAuthorCount, 3);
  assert.equal(cluster.crossSourceCorroborated, true);
  assert.equal(cluster.crossSourceDemandCorroborated, true);
  assert.equal(cluster.evidenceScore, 100);
  assert.equal(cluster.evidenceLevel, 'strong');
});

test('feature requests are visible but do not count as independent demand or buying intent', () => {
  const cluster = aggregateEvidence([
    item({
      id: 'feature-only',
      author: 'dave',
      source: 'github',
      text: 'Feature request: please add a configurable timeout; current timeout is not enforced.'
    })
  ]).clusters['mcp-timeouts'];
  assert.equal(cluster.independentFeatureRequestAuthorCount, 1);
  assert.equal(cluster.featureRequestObserved, true);
  assert.equal(cluster.independentDemandAuthorCount, 0);
  assert.equal(cluster.independentBuyingAuthorCount, 0);
  assert.equal(cluster.evidenceScore, 8);
  assert.equal(cluster.evidenceLevel, 'insufficient');
});

test('promotional records do not inflate cluster evidence', () => {
  const result = aggregateEvidence([
    item({ id: 'promo', author: 'vendor', source: 'bluesky', text: 'Join our webinar! Register now to learn about our timeout product.' })
  ]);
  assert.equal(Object.keys(result.clusters).length, 0);
  assert.equal(result.records[0].evidence.promotion, true);
});

test('duplicate canonical URLs count only once in evidence scoring', () => {
  const result = aggregateEvidence([
    item({ id: 'original', author: 'alice', source: 'bluesky', text: 'MCP server timed out.', url: 'https://example.test/report?utm_source=feed' }),
    item({ id: 'duplicate', author: 'bob', source: 'github', text: 'MCP server timed out.', url: 'https://example.test/report' })
  ]);
  const cluster = result.clusters['mcp-timeouts'];
  assert.equal(result.uniqueRecordCount, 1);
  assert.equal(cluster.independentProblemAuthorCount, 1);
  assert.equal(cluster.evidenceScore, 8);
});
