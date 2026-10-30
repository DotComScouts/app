const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { URL } = require('node:url');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const classifyStart = html.indexOf('function classifyShadowEvidence(');
const normalizeStart = html.indexOf('function normalizeShadowEvidence(', classifyStart);
const end = html.indexOf('async function collectShadowMarketEvidence(', normalizeStart);
assert.ok(classifyStart >= 0 && normalizeStart > classifyStart && end > normalizeStart, 'classifier and normalizer functions are present');
const classifyShadowEvidence = vm.runInNewContext('(' + html.slice(classifyStart, normalizeStart).trim() + ')', { URL });
const normalizeShadowEvidence = vm.runInNewContext('(' + html.slice(normalizeStart, end).trim() + ')', { URL, classifyShadowEvidence });

test('shadow normalizer computes deterministic term-overlap relevance', () => {
  const result = normalizeShadowEvidence([
    {source:'npm Registry',title:'AI agent workflow toolkit',description:'Build AI agent workflows',url:'https://www.npmjs.com/package/agent-kit',observedAt:'2026-10-29T12:00:00Z'},
    {source:'Bluesky',title:'Weekend gardening ideas',description:'',url:'https://bsky.app/post/1',observedAt:'2026-10-29T12:00:00Z'}
  ], 'AI agent');
  assert.equal(result.length, 2);
  assert.equal(result[0].relevance, 100);
  assert.deepEqual(Array.from(result[0].matchedTerms), ['agent', 'ai'].sort((a,b)=>['ai','agent'].indexOf(a)-['ai','agent'].indexOf(b)));
  assert.equal(result[1].relevance, 0);
});

test('shadow normalizer merges tracking-parameter URL duplicates across sources', () => {
  const result = normalizeShadowEvidence([
    {source:'DEV Community',title:'AI agent tutorial',url:'https://dev.to/example/ai-agent?utm_source=feed',observedAt:'2026-10-29T12:00:00Z'},
    {source:'Bluesky',title:'AI agent tutorial',url:'https://dev.to/example/ai-agent?utm_medium=social',observedAt:'2026-10-29T12:01:00Z'}
  ], 'AI agent');
  assert.equal(result.length, 1);
  assert.deepEqual(Array.from(result[0].sources), ['DEV Community','Bluesky']);
  assert.equal(result[0].duplicateCount, 1);
});

test('shadow normalizer preserves distinct query URLs and drops empty records', () => {
  const result = normalizeShadowEvidence([
    {source:'Stack Exchange',title:'How to build an AI agent?',url:'https://stackoverflow.com/search?q=agent'},
    {source:'Stack Exchange',title:'How to build an AI agent?',url:'https://stackoverflow.com/search?q=workflow'},
    {source:'Bluesky',title:'',url:'https://bsky.app/post/2'}
  ], 'AI agent');
  assert.equal(result.length, 2);
  assert.notEqual(result[0].canonicalUrl, result[1].canonicalUrl);
});


test('per-record relevance is scored against its own query, not the union of candidate queries', () => {
  const result = normalizeShadowEvidence([
    {source:'Hugging Face',query:'AI agent',title:'AI agent workflow model',url:'https://huggingface.co/acme/agent'},
    {source:'npm Registry',query:'quantum battery',title:'Quantum battery simulator',url:'https://www.npmjs.com/package/quantum-battery'}
  ], 'AI agents quantum battery');
  assert.equal(result.length, 2);
  assert.equal(result.find(x => x.source === 'Hugging Face').relevance, 100);
  assert.equal(result.find(x => x.source === 'npm Registry').relevance, 100);
});

test('model and package registry records are classified as product inventory, not demand', () => {
  assert.equal(classifyShadowEvidence({kind:'model',title:'acme/ai-model',description:'text-generation'}), 'product');
  assert.equal(classifyShadowEvidence({kind:'package',title:'agent-workflow-kit',description:'A JavaScript package'}), 'product');
});

test('shadow adapter reports raw, deduplicated and relevant evidence without activating scoring', () => {
  assert.match(html, /normalizeShadowEvidence\(rawEvidence,candidates\.join\(' '\)\)/);
  assert.match(html, /Rohbelege/);
  assert.match(html, /Dubletten entfernt/);
  assert.match(html, /mindestens 50 % Trefferquote zum jeweiligen Suchbegriff/);
  const start = html.indexOf('async function collectShadowMarketEvidence');
  const end = html.indexOf('function getLengthRange()', start);
  const adapter = html.slice(start, end);
  assert.match(adapter, /shadowEvidence\s*=\s*evidence/);
  assert.doesNotMatch(adapter, /trendScore\s*=|results\.push\(|checkAvail\(/);
});
