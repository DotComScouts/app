const test = require('node:test');
const assert = require('node:assert/strict');

async function getJson(url, headers = {}) {
  const response = await fetch(url, {
    headers: { accept: 'application/json', ...headers },
    signal: AbortSignal.timeout(15000)
  });
  assert.equal(response.status, 200, `${new URL(url).hostname} returned HTTP ${response.status}`);
  return response.json();
}

test('Hacker News Algolia search returns a hits array', { timeout: 20000 }, async () => {
  const url = 'https://hn.algolia.com/api/v1/search_by_date?query='
    + encodeURIComponent('MCP server') + '&tags=story&hitsPerPage=3';
  const payload = await getJson(url);
  assert.ok(Array.isArray(payload.hits), 'Algolia response must contain hits');
});

test('GitHub repository search returns an items array', { timeout: 20000 }, async () => {
  const url = 'https://api.github.com/search/repositories?q='
    + encodeURIComponent('MCP server') + '&per_page=3';
  const payload = await getJson(url, { 'user-agent': 'DotComScouts-beta-smoke-test' });
  assert.ok(Array.isArray(payload.items), 'GitHub search response must contain items');
});

test('Hugging Face model search returns an array', { timeout: 20000 }, async () => {
  const url = 'https://huggingface.co/api/models?search='
    + encodeURIComponent('MCP') + '&limit=3';
  const payload = await getJson(url);
  assert.ok(Array.isArray(payload), 'Hugging Face model search must return an array');
});

test('Stack Exchange advanced search returns an items array', { timeout: 20000 }, async () => {
  const url = 'https://api.stackexchange.com/2.3/search/advanced?site=stackoverflow'
    + '&order=desc&sort=activity&pagesize=3&q=' + encodeURIComponent('MCP server');
  const payload = await getJson(url);
  assert.ok(Array.isArray(payload.items), 'Stack Exchange response must contain items');
});

test('npm Registry search returns an objects array', { timeout: 20000 }, async () => {
  const url = 'https://registry.npmjs.org/-/v1/search?text='
    + encodeURIComponent('ai agent') + '&size=3';
  const payload = await getJson(url);
  assert.ok(Array.isArray(payload.objects), 'npm Registry response must contain objects');
});

test('DEV Community article API returns an array', { timeout: 20000 }, async () => {
  const url = 'https://dev.to/api/articles?tag=ai&per_page=3&top=7';
  const payload = await getJson(url);
  assert.ok(Array.isArray(payload), 'DEV API response must be an array');
});
