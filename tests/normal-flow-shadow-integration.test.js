const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('normal trend run invokes the five additional sources in shadow mode', () => {
  assert.match(html, /trendTerms\s*=\s*findTerms\(storyList,githubRepos\);\s*try\s*\{\s*await collectShadowMarketEvidence\(trendTerms\)/);
  assert.match(html, /async function collectShadowMarketEvidence\(terms\)/);
  for (const source of [
    'https://huggingface.co/api/models?',
    'https://registry.npmjs.org/-/v1/search?',
    'https://api.stackexchange.com/2.3/search/advanced?',
    'https://dev.to/api/articles?',
    'https://api.bsky.app/xrpc/app.bsky.feed.searchPosts?'
  ]) assert.ok(html.includes(source), 'missing source adapter: ' + source);
});

test('shadow-source failures are isolated and do not abort the ordinary search', () => {
  assert.match(html, /Promise\.allSettled\(jobs\)/);
  assert.match(html, /catch\(shadowError\).*Die normale Suche läuft weiter/s);
  assert.ok(html.includes('const sourceJobs=['), 'source jobs are declared');
  for (const source of ['Hugging Face','npm Registry','Stack Exchange','DEV Community','Bluesky']) {
    assert.ok(html.includes("['" + source + "',async query=>"), 'missing shadow source job: ' + source);
  }
  assert.ok(html.includes("runSource('Shadow · '+name"), 'each source uses the shared isolated runner');
});

test('shadow evidence does not directly alter ranking or domain-check results', () => {
  const start = html.indexOf('async function collectShadowMarketEvidence');
  const end = html.indexOf('function getLengthRange()', start);
  assert.ok(start >= 0 && end > start, 'shadow adapter function boundaries found');
  const adapter = html.slice(start, end);
  assert.match(adapter, /shadowEvidence\s*=\s*evidence/);
  assert.doesNotMatch(adapter, /trendScore\s*=|results\.push\(|checkAvail\(/);
  assert.match(adapter, /Keine Auswirkung auf die reguläre Bewertung/);
});
