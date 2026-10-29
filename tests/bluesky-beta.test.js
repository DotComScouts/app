const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(m => m[1]).filter(s => s.trim());
const explorer = scripts[3];

function makeDocument(values = {}) {
  const elements = new Map();
  return {
    elements,
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, {
        id, value: values[id] ?? '', textContent: '', innerHTML: '',
        disabled: false, handlers: {},
        addEventListener(type, callback) { this.handlers[type] = callback; }
      });
      return elements.get(id);
    }
  };
}

function post(handle, text, id, likes = 8, reposts = 3, replies = 2) {
  const now = new Date().toISOString();
  return {
    author: { handle },
    record: { text, createdAt: now },
    uri: `at://did:plc/test/app.bsky.feed.post/${id}`,
    indexedAt: now, likeCount: likes, repostCount: reposts, replyCount: replies
  };
}

async function run({ query = 'MCP server', posts = [], fetchImpl } = {}) {
  const document = makeDocument({
    blueskyBetaQuery: query, blueskyBetaSort: 'latest', blueskyBetaCount: '30'
  });
  const fetcher = fetchImpl ?? (async () => ({
    ok: true, json: async () => ({ posts })
  }));
  new Function('document', 'fetch', explorer)(document, fetcher);
  await document.getElementById('blueskyBetaRun').handlers.click();
  return document;
}
const count = d => Number(d.getElementById('blueskyBetaTotal').textContent || 0);
const results = d => d.getElementById('blueskyBetaResults').innerHTML;
const status = d => d.getElementById('blueskyBetaStatus').textContent;

test('01 all inline JavaScript blocks parse', () => {
  assert.equal(scripts.length, 4);
  scripts.forEach((script, i) => assert.doesNotThrow(() => new Function(script), `block ${i + 1}`));
});
test('02 empty query is rejected before API access', async () => {
  let called = false;
  const d = await run({ query: '', fetchImpl: async () => { called = true; throw Error('unexpected'); } });
  assert.equal(called, false); assert.match(status(d), /Suchbegriff eingeben/); assert.equal(count(d), 0);
});
test('03 successful API response reports success', async () => {
  const d = await run({ posts: [post('dev.bsky.social', 'We built an open-source MCP server integration for Claude. Now available on GitHub.', 'p1')] });
  assert.match(status(d), /API erfolgreich/);
});
test('04 API network failure is reported and button restored', async () => {
  const d = await run({ fetchImpl: async () => { throw Error('network down'); } });
  assert.match(status(d), /Bluesky-API fehlgeschlagen/);
  assert.equal(d.getElementById('blueskyBetaRun').disabled, false);
  assert.equal(count(d), 0);
});
test('05 HTTP error response is handled', async () => {
  const d = await run({ fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({}) }) });
  assert.match(status(d), /HTTP 429/); assert.equal(d.getElementById('blueskyBetaRun').disabled, false);
});
test('06 malformed API payload is handled', async () => {
  const d = await run({ fetchImpl: async () => ({ ok: true, json: async () => ({ unexpected: true }) }) });
  assert.match(status(d), /Unerwartetes API-Antwortformat/); assert.equal(count(d), 0);
});
test('07 webinar registration promotion is excluded', async () => {
  const d = await run({ posts: [post('event.bsky.social', 'Join us for our webinar! Register now to learn about MCP server tools.', 'webinar')] });
  assert.equal(count(d), 0);
});
test('08 paid promotion is excluded', async () => {
  const d = await run({ posts: [post('vendor.bsky.social', 'Sponsored by Example Inc. Try our MCP server product, use code SAVE20.', 'ad')] });
  assert.equal(count(d), 0);
});
test('09 genuine open-source product launch remains eligible', async () => {
  const d = await run({ posts: [post('builder.bsky.social', 'We built an open-source MCP server integration for Claude. Now available on GitHub with production workflow support.', 'launch')] });
  assert.equal(count(d), 1); assert.match(results(d), /Signalwert:/);
});
test('10 concrete technical problem is classified and shown', async () => {
  const d = await run({ posts: [post('engineer.bsky.social', 'MCP server crashes when authentication expires. Bug report: production integration fails to connect and returns an error.', 'bug')] });
  assert.ok(count(d) <= 1);
  if (count(d)) assert.match(results(d), /Konkretes technisches Problem|Sicherheitsproblem/);
});
test('11 general opinion without technical evidence is not promoted', async () => {
  const d = await run({ posts: [post('opinion.bsky.social', 'Hot take: I think AI is ruining everything. What do you think about this trend?', 'opinion')] });
  assert.equal(count(d), 0);
});
test('12 localized ToolDurus account variants collapse to one result', async () => {
  const d = await run({ query: 'MCP Claude server', posts: [
    post('tooldurus-cz.bsky.social', 'Jak připojit vlastní MCP server ke Claude? ToolDurus provides an MCP server integration.', 'cz', 8, 3, 2),
    post('tooldurus-de.bsky.social', 'How to connect a custom MCP server to Claude with ToolDurus. Open-source integration guide.', 'de', 4, 1, 1)
  ] });
  assert.equal(count(d), 1);
});
test('13 tracking-parameter variants of the same article collapse', async () => {
  const d = await run({ posts: [
    post('builder-one.bsky.social', 'We built a useful MCP server integration and released it on GitHub. https://example.com/product?utm_source=bluesky', 'url1'),
    post('builder-two.bsky.social', 'New MCP server product is now available. https://www.example.com/product?utm_campaign=test', 'url2')
  ] });
  assert.equal(count(d), 1);
});
test('14 distinct article URLs are not merged', async () => {
  const d = await run({ posts: [
    post('builder-one.bsky.social', 'We built an open-source MCP server integration and released it on GitHub. https://example.com/product-a', 'url-a'),
    post('builder-two.bsky.social', 'New MCP server product is now available on GitHub. https://example.com/product-b', 'url-b')
  ] });
  assert.equal(count(d), 2);
});
test('15 empty API result renders an explicit empty state', async () => {
  const d = await run({ posts: [] });
  assert.equal(count(d), 0); assert.match(results(d), /Keine passenden Posts gefunden/);
});
test('16 clear action resets counters and status', async () => {
  const d = await run({ posts: [post('builder.bsky.social', 'We built an open-source MCP server integration for Claude. Now available on GitHub with production workflow support.', 'clear')] });
  assert.equal(count(d), 1);
  await d.getElementById('blueskyBetaClear').handlers.click();
  assert.equal(count(d), 0);
  assert.equal(d.getElementById('blueskyBetaLikes').textContent, '0');
  assert.equal(d.getElementById('blueskyBetaShares').textContent, '0');
  assert.equal(status(d), 'Ergebnisse geleert.');
});
test('17 source counters reflect only displayed unique posts', async () => {
  const d = await run({ posts: [
    post('tooldurus-cz.bsky.social', 'Jak připojit vlastní MCP server ke Claude? ToolDurus provides an MCP server integration.', 'count-cz', 8, 3, 2),
    post('tooldurus-de.bsky.social', 'How to connect a custom MCP server to Claude with ToolDurus. Open-source integration guide.', 'count-de', 4, 1, 1)
  ], query: 'MCP Claude server' });
  assert.equal(count(d), 1);
  assert.equal(d.getElementById('blueskyBetaLikes').textContent, '8');
});
test('18 no-resonance posts do not become stronger community signals', async () => {
  const d = await run({ posts: [post('builder.bsky.social', 'We built an open-source MCP server integration for Claude. Now available on GitHub with production workflow support.', 'low-resonance', 0, 0, 0)] });
  if (count(d)) assert.doesNotMatch(results(d), /Stärkeres Community-Signal/);
});
test('19 result text is HTML-escaped', async () => {
  const d = await run({ posts: [post('builder.bsky.social', 'We built an open-source MCP server integration for Claude. <img src=x onerror=alert(1)> now available on GitHub.', 'escaped')] });
  if (count(d)) {
    assert.doesNotMatch(results(d), /<img src=x onerror=alert\(1\)>/);
    assert.match(results(d), /&lt;img/);
  }
});
test('20 status explains Bluesky is not proof of domain demand', async () => {
  const d = await run({ posts: [post('builder.bsky.social', 'We built an open-source MCP server integration for Claude. Now available on GitHub with production workflow support.', 'disclaimer')] });
  assert.match(status(d), /kein Nachweis für Domainnachfrage/);
});
