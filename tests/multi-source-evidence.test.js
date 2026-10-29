const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyEvidence, canonicalizeUrl, aggregateEvidence } = require('../lib/shadow-evidence');

function record(overrides = {}) {
  const sourceRecordId = overrides.sourceRecordId || 'post-1';
  return {
    source: 'bluesky',
    sourceRecordId,
    sourceUrl: `https://bsky.app/profile/example/post/${encodeURIComponent(sourceRecordId)}`,
    authorKey: 'author-a',
    authorOrPublisher: 'author-a',
    text: '',
    publishedAt: '2026-10-20T10:00:00Z',
    retrievedAt: '2026-10-29T10:00:00Z',
    sourceStatus: 'validated',
    metrics: {},
    ...overrides
  };
}

test('01 a concrete bug is problem evidence, not automatic demand', () => {
  const evidence = classifyEvidence(record({
    text: 'MCP server crashes when authentication expires. Bug report: production integration fails to connect.'
  }));
  assert.equal(evidence.problem, true);
  assert.equal(evidence.demandIntent, false);
  assert.equal(evidence.product, false);
});

test('02 explicit search for a solution is demand intent, not proof of independent demand', () => {
  const evidence = classifyEvidence(record({ text: 'Looking for a tool to monitor MCP server failures across production.' }));
  assert.equal(evidence.demandIntent, true);
  assert.equal(evidence.problem, true);
  assert.equal(evidence.independentDemandSupported, false);
});

test('03 product launch is product evidence only', () => {
  const evidence = classifyEvidence(record({ text: 'We launched a new open-source MCP server tool on GitHub.' }));
  assert.equal(evidence.product, true);
  assert.equal(evidence.problem, false);
  assert.equal(evidence.demandIntent, false);
});

test('04 high engagement alone does not create problem or demand evidence', () => {
  const evidence = classifyEvidence(record({
    text: 'Hot take: I think AI is changing everything.',
    metrics: { likes: 5000, reposts: 900, replies: 200 }
  }));
  assert.equal(evidence.problem, false);
  assert.equal(evidence.demandIntent, false);
  assert.equal(evidence.product, false);
  assert.equal(evidence.discussion, true);
});

test('05 webinar promotion is excluded from evidence classification', () => {
  const evidence = classifyEvidence(record({
    text: 'Join our webinar! Register now to learn about our MCP server product.'
  }));
  assert.equal(evidence.promotion, true);
  assert.equal(evidence.problem, false);
  assert.equal(evidence.demandIntent, false);
  assert.equal(evidence.product, false);
});

test('06 tracking parameters and host aliases canonicalize to the same article URL', () => {
  assert.equal(
    canonicalizeUrl('https://www.example.com/en/article.html?utm_source=bluesky&ref=feed'),
    'example.com/article'
  );
  assert.equal(
    canonicalizeUrl('https://example.com/article?utm_campaign=test'),
    'example.com/article'
  );
});

test('07 one author reporting a problem is not independent demand', () => {
  const result = aggregateEvidence([
    record({ problemClusterKey: 'mcp-auth-failure', text: 'MCP server crashes when authentication expires.' })
  ]);
  assert.equal(result.clusters['mcp-auth-failure'].independentAuthorCount, 1);
  assert.equal(result.clusters['mcp-auth-failure'].demandSupported, false);
});

test('08 two distinct authors reporting the same cluster support independent demand', () => {
  const result = aggregateEvidence([
    record({ sourceRecordId: 'p1', authorKey: 'alice', problemClusterKey: 'mcp-auth-failure', text: 'Looking for a tool to monitor MCP server authentication failures.' }),
    record({ sourceRecordId: 'p2', authorKey: 'bob', problemClusterKey: 'mcp-auth-failure', text: 'Looking for a tool to fix MCP server authentication failures.' })
  ]);
  assert.equal(result.clusters['mcp-auth-failure'].independentAuthorCount, 2);
  assert.equal(result.clusters['mcp-auth-failure'].demandSupported, true);
  assert.equal(result.clusters['mcp-auth-failure'].crossSourceCorroborated, false);
});

test('09 distinct authors across two sources provide cross-source corroboration', () => {
  const result = aggregateEvidence([
    record({ source: 'bluesky', sourceRecordId: 'p1', authorKey: 'alice', problemClusterKey: 'mcp-auth-failure', text: 'MCP server crashes when authentication expires.' }),
    record({ source: 'stackexchange', sourceRecordId: 'q1', authorKey: 'bob', problemClusterKey: 'mcp-auth-failure', text: 'MCP server crashes when the authentication token expires.' })
  ]);
  assert.equal(result.clusters['mcp-auth-failure'].problemCorroborated, true);
  assert.equal(result.clusters['mcp-auth-failure'].demandSupported, false);
  assert.equal(result.clusters['mcp-auth-failure'].crossSourceCorroborated, true);
});

test('10 duplicate article URLs count only once toward independent demand', () => {
  const result = aggregateEvidence([
    record({ source: 'bluesky', sourceRecordId: 'p1', authorKey: 'alice', problemClusterKey: 'api-timeout', sourceUrl: 'https://example.com/article?utm_source=bluesky', text: 'Looking for a tool to diagnose API timeout failures.' }),
    record({ source: 'devto', sourceRecordId: 'a1', authorKey: 'bob', problemClusterKey: 'api-timeout', sourceUrl: 'https://www.example.com/article?ref=feed', text: 'Looking for a tool to diagnose API timeout failures.' })
  ]);
  assert.equal(result.uniqueRecordCount, 1);
  assert.equal(result.clusters['api-timeout'].independentAuthorCount, 1);
  assert.equal(result.clusters['api-timeout'].demandSupported, false);
});

test('11 two distinct products with similar keywords are not merged by keywords alone', () => {
  const result = aggregateEvidence([
    record({ sourceRecordId: 'p1', source: 'github', sourceUrl: 'https://github.com/org-a/mcp-auth', authorKey: 'org-a', problemClusterKey: 'mcp-auth', text: 'We launched an MCP server authentication tool.' }),
    record({ sourceRecordId: 'p2', source: 'github', sourceUrl: 'https://github.com/org-b/mcp-auth', authorKey: 'org-b', problemClusterKey: 'mcp-auth', text: 'We launched an MCP server authentication tool.' })
  ]);
  assert.equal(result.uniqueRecordCount, 2);
});

test('12 failed source records do not contribute to demand evidence', () => {
  const result = aggregateEvidence([
    record({ sourceRecordId: 'p1', authorKey: 'alice', problemClusterKey: 'mcp-auth', sourceStatus: 'failed', text: 'Looking for a tool to fix MCP server authentication failures.' }),
    record({ sourceRecordId: 'p2', authorKey: 'bob', problemClusterKey: 'mcp-auth', sourceStatus: 'validated', text: 'MCP server crashes when authentication expires.' })
  ]);
  assert.equal(result.clusters['mcp-auth'].independentAuthorCount, 1);
  assert.equal(result.clusters['mcp-auth'].demandSupported, false);
});

test('13 resonance metrics remain separate from evidence labels', () => {
  const result = aggregateEvidence([
    record({ problemClusterKey: 'opinion', text: 'Hot take: I think AI is changing everything.', metrics: { likes: 10000 } })
  ]);
  assert.equal(result.records[0].evidence.problem, false);
  assert.equal(result.records[0].evidence.demandIntent, false);
  assert.deepEqual(result.records[0].metrics, { likes: 10000 });
});

test('14 a failed source record cannot suppress a later validated record for the same URL', () => {
  const sharedUrl = 'https://example.com/problem';
  const result = aggregateEvidence([
    record({ sourceRecordId: 'failed', sourceUrl: sharedUrl, sourceStatus: 'failed', authorKey: 'alice', problemClusterKey: 'api-timeout', text: 'Looking for a tool to diagnose API timeout failures.' }),
    record({ source: 'devto', sourceRecordId: 'valid', sourceUrl: sharedUrl, sourceStatus: 'validated', authorKey: 'bob', problemClusterKey: 'api-timeout', text: 'Looking for a tool to diagnose API timeout failures.' })
  ]);
  assert.equal(result.uniqueRecordCount, 1);
  assert.equal(result.clusters['api-timeout'].independentAuthorCount, 1);
});

test('15 meaningful query parameters on a path remain distinct', () => {
  assert.equal(canonicalizeUrl('https://example.com/search?q=alpha'), 'example.com/search?q=alpha');
  assert.equal(canonicalizeUrl('https://example.com/search?q=beta'), 'example.com/search?q=beta');
  assert.notEqual(
    canonicalizeUrl('https://example.com/search?q=alpha'),
    canonicalizeUrl('https://example.com/search?q=beta')
  );
});

test('16 German problem report is recognized without implying demand', () => {
  const evidence = classifyEvidence(record({ text: 'Der MCP-Server stürzt ab, wenn das Authentifizierungstoken abläuft. Es gibt eine Fehlermeldung.' }));
  assert.equal(evidence.problem, true);
  assert.equal(evidence.demandIntent, false);
});

test('17 German explicit request is demand intent', () => {
  const evidence = classifyEvidence(record({ text: 'Ich suche ein Tool, das MCP-Server-Fehler in der Produktion überwacht.' }));
  assert.equal(evidence.demandIntent, true);
});

test('18 German product launch remains product evidence', () => {
  const evidence = classifyEvidence(record({ text: 'Wir haben ein neues Open-Source-Tool veröffentlicht; es ist jetzt verfügbar.' }));
  assert.equal(evidence.product, true);
  assert.equal(evidence.demandIntent, false);
});

test('19 German advertisement is excluded', () => {
  const evidence = classifyEvidence(record({ text: 'Werbung: Jetzt anmelden und Platz für unser Webinar sichern.' }));
  assert.equal(evidence.promotion, true);
  assert.equal(evidence.problem, false);
  assert.equal(evidence.demandIntent, false);
});

test('20 Spanish explicit solution request is demand intent', () => {
  const evidence = classifyEvidence(record({ text: 'Busco una herramienta para monitorizar errores de conexión en un servidor MCP.' }));
  assert.equal(evidence.demandIntent, true);
});

test('21 product mention without launch language is not automatically product evidence', () => {
  const evidence = classifyEvidence(record({ text: 'I use an MCP server at work and it has been useful.' }));
  assert.equal(evidence.product, false);
});

test('22 two problem reports support problem corroboration, not demand by themselves', () => {
  const result = aggregateEvidence([
    record({ sourceRecordId: 'bug1', authorKey: 'alice', problemClusterKey: 'auth-failure', text: 'MCP server crashes when authentication expires.' }),
    record({ sourceRecordId: 'bug2', authorKey: 'bob', problemClusterKey: 'auth-failure', text: 'MCP server fails to connect when the token expires.' })
  ]);
  assert.equal(result.clusters['auth-failure'].problemCorroborated, true);
  assert.equal(result.clusters['auth-failure'].demandSupported, false);
});

test('23 two explicit independent requests support demand evidence', () => {
  const result = aggregateEvidence([
    record({ sourceRecordId: 'need1', authorKey: 'alice', problemClusterKey: 'auth-solution', text: 'Looking for a tool to monitor MCP server authentication failures.' }),
    record({ sourceRecordId: 'need2', authorKey: 'bob', problemClusterKey: 'auth-solution', text: 'Does anyone know a tool to diagnose MCP server authentication failures?' })
  ]);
  assert.equal(result.clusters['auth-solution'].demandSupported, true);
  assert.equal(result.clusters['auth-solution'].problemCorroborated, true);
});

test('24 cross-source problem evidence does not automatically become cross-source demand', () => {
  const result = aggregateEvidence([
    record({ source: 'bluesky', sourceRecordId: 'bug1', authorKey: 'alice', problemClusterKey: 'token-expiry', text: 'MCP server crashes when authentication expires.' }),
    record({ source: 'stackexchange', sourceRecordId: 'q1', authorKey: 'bob', problemClusterKey: 'token-expiry', text: 'MCP server fails to connect when the token expires.' })
  ]);
  assert.equal(result.clusters['token-expiry'].crossSourceCorroborated, true);
  assert.equal(result.clusters['token-expiry'].crossSourceDemandCorroborated, false);
});
