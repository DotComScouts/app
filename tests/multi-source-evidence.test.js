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
  assert.equal(evidence.problem, false);
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
  assert.equal(result.clusters['auth-solution'].problemCorroborated, false,
    'explicit solution requests must not be silently reclassified as confirmed technical failures');
});

test('24 cross-source problem evidence does not automatically become cross-source demand', () => {
  const result = aggregateEvidence([
    record({ source: 'bluesky', sourceRecordId: 'bug1', authorKey: 'alice', problemClusterKey: 'token-expiry', text: 'MCP server crashes when authentication expires.' }),
    record({ source: 'stackexchange', sourceRecordId: 'q1', authorKey: 'bob', problemClusterKey: 'token-expiry', text: 'MCP server fails to connect when the token expires.' })
  ]);
  assert.equal(result.clusters['token-expiry'].crossSourceCorroborated, true);
  assert.equal(result.clusters['token-expiry'].crossSourceDemandCorroborated, false);
});

test('25 labelled multilingual corpus keeps signal types separate', () => {
  const cases = [
    { id: 'en-problem', text: 'The MCP server crashes when the authentication token expires.', expected: { problem: true, demandIntent: false, product: false, promotion: false } },
    { id: 'de-problem', text: 'Der Dienst stürzt ab, wenn das Authentifizierungstoken abläuft.', expected: { problem: true, demandIntent: false, product: false, promotion: false } },
    { id: 'es-problem', text: 'La aplicación no funciona y muestra un error de conexión.', expected: { problem: true, demandIntent: false, product: false, promotion: false } },
    { id: 'en-demand', text: 'Looking for a tool to monitor MCP server failures in production.', expected: { problem: false, demandIntent: true, product: false, promotion: false } },
    { id: 'de-demand', text: 'Ich suche ein Tool, das Fehler in meinem MCP-Server überwacht.', expected: { problem: false, demandIntent: true, product: false, promotion: false } },
    { id: 'es-demand', text: 'Busco una herramienta para monitorizar errores del servidor.', expected: { problem: false, demandIntent: true, product: false, promotion: false } },
    { id: 'en-product', text: 'We launched a new open-source tool; it is now available on GitHub.', expected: { problem: false, demandIntent: false, product: true, promotion: false } },
    { id: 'de-product', text: 'Wir haben ein neues Open-Source-Tool veröffentlicht; es ist jetzt verfügbar.', expected: { problem: false, demandIntent: false, product: true, promotion: false } },
    { id: 'es-product', text: 'Hemos lanzado una nueva herramienta para desarrolladores.', expected: { problem: false, demandIntent: false, product: true, promotion: false } },
    { id: 'en-opinion', text: 'Hot take: I think AI is changing everything. What do you think?', expected: { problem: false, demandIntent: false, product: false, discussion: true, promotion: false } },
    { id: 'de-opinion', text: 'Meiner Meinung nach verändert KI alles. Was denkt ihr?', expected: { problem: false, demandIntent: false, product: false, discussion: true, promotion: false } },
    { id: 'es-opinion', text: 'Opino que la IA está cambiando todo.', expected: { problem: false, demandIntent: false, product: false, discussion: true, promotion: false } },
    { id: 'en-promo', text: 'Join our webinar! Register now to learn about our product.', expected: { problem: false, demandIntent: false, product: false, promotion: true } },
    { id: 'de-promo', text: 'Werbung: Jetzt anmelden und Platz für unser Webinar sichern.', expected: { problem: false, demandIntent: false, product: false, promotion: true } },
    { id: 'es-promo', text: 'Anuncio patrocinado: regístrate ahora para nuestro webinar.', expected: { problem: false, demandIntent: false, product: false, promotion: true } },
    { id: 'broad-we-need', text: 'We need better tools for the future of AI.', expected: { problem: false, demandIntent: false, product: false, promotion: false } },
    { id: 'generic-product-mention', text: 'I use an MCP server at work and it has been useful.', expected: { problem: false, demandIntent: false, product: false, promotion: false } },
    { id: 'high-engagement-opinion', text: 'Hot take: AI changes everything.', expected: { problem: false, demandIntent: false, product: false, discussion: true, promotion: false } }
  ];
  for (const fixture of cases) {
    const actual = classifyEvidence(record({ text: fixture.text }));
    for (const [key, expected] of Object.entries(fixture.expected)) {
      assert.equal(actual[key], expected, fixture.id + ': ' + key);
    }
  }
});


test('26 negated failure statements do not count as problem evidence', () => {
  const evidence = classifyEvidence(record({ text: "The MCP server does not crash and is not broken anymore." }));
  assert.equal(evidence.problem, false);
});

test('27 negated solution requests do not count as demand intent', () => {
  const evidence = classifyEvidence(record({ text: "We don't need a tool and are not looking for a solution." }));
  assert.equal(evidence.demandIntent, false);
});

test('28 urgency is a separate signal and does not manufacture demand', () => {
  const evidence = classifyEvidence(record({ text: "Our deployment is blocked and this is urgent." }));
  assert.equal(evidence.urgency, true);
  assert.equal(evidence.demandIntent, false);
});

test('29 budget language strengthens an explicit demand into buying intent', () => {
  const evidence = classifyEvidence(record({ text: "Looking for a paid solution. Budget is available and we are willing to pay." }));
  assert.equal(evidence.demandIntent, true);
  assert.equal(evidence.budgetSignal, true);
  assert.equal(evidence.buyingIntent, true);
});

test('30 budget mention alone is not demand or buying intent', () => {
  const evidence = classifyEvidence(record({ text: "Our annual software budget was approved." }));
  assert.equal(evidence.budgetSignal, true);
  assert.equal(evidence.demandIntent, false);
  assert.equal(evidence.buyingIntent, false);
});

test('31 workaround statements are distinguished from explicit demand', () => {
  const evidence = classifyEvidence(record({ text: "We use a manual workaround because the API timeout keeps happening." }));
  assert.equal(evidence.problem, true);
  assert.equal(evidence.workaroundSignal, true);
  assert.equal(evidence.demandIntent, false);
});

test('33 workaround mention alone is not automatically a confirmed problem', () => {
  const evidence = classifyEvidence(record({ text: "Our team has a workaround for the old workflow." }));
  assert.equal(evidence.problem, false);
  assert.equal(evidence.workaroundSignal, true);
});

test('34 negated budget availability is not a positive budget signal', () => {
  const evidence = classifyEvidence(record({ text: "We have no budget; funding is not available and we are not willing to pay." }));
  assert.equal(evidence.budgetSignal, false);
  assert.equal(evidence.buyingIntent, false);
});

test('35 budget being unapproved is not a positive buying signal', () => {
  const evidence = classifyEvidence(record({ text: "The project budget is not approved yet." }));
  assert.equal(evidence.budgetSignal, false);
});

test('36 error-free and no-issue statements are not problem evidence', () => {
  const evidence = classifyEvidence(record({ text: "The migration is error-free; no issues and no data loss have been reported." }));
  assert.equal(evidence.problem, false);
});

test('37 urgency without a solution request does not imply buying intent', () => {
  const evidence = classifyEvidence(record({ text: "The deadline is today, but we are not looking for a new tool." }));
  assert.equal(evidence.urgency, true);
  assert.equal(evidence.demandIntent, false);
  assert.equal(evidence.buyingIntent, false);
});

test('38 a free alternative request is demand but not buying intent', () => {
  const evidence = classifyEvidence(record({ text: "Looking for a free alternative; we have no budget for paid software." }));
  assert.equal(evidence.demandIntent, true);
  assert.equal(evidence.budgetSignal, false);
  assert.equal(evidence.buyingIntent, false);
});

test('32 promotional urgency and budget language are excluded', () => {
  const evidence = classifyEvidence(record({ text: "Sponsored webinar: urgent offer, register now and get special pricing." }));
  assert.equal(evidence.promotion, true);
  assert.equal(evidence.urgency, false);
  assert.equal(evidence.budgetSignal, false);
  assert.equal(evidence.buyingIntent, false);
});
