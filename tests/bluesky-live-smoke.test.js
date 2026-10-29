const test = require('node:test');
const assert = require('node:assert/strict');

// This is a real network smoke test against the public Bluesky API.
// It intentionally does not assert that matching posts must exist.
test('public Bluesky search API responds with a valid posts payload', { timeout: 20000 }, async () => {
  const endpoint = 'https://api.bsky.app/xrpc/app.bsky.feed.searchPosts?q='
    + encodeURIComponent('MCP server')
    + '&sort=latest&limit=3';
  const response = await fetch(endpoint, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(15000)
  });

  assert.equal(response.status, 200, `Bluesky API returned HTTP ${response.status}`);
  const payload = await response.json();
  assert.ok(payload && typeof payload === 'object', 'response must be a JSON object');
  assert.ok(Array.isArray(payload.posts), 'response must contain a posts array');
  assert.ok(payload.posts.length <= 3, 'API must respect the requested result limit');

  for (const post of payload.posts) {
    assert.ok(post && typeof post === 'object', 'each post must be an object');
    assert.ok(post.record && typeof post.record.text === 'string', 'each post must contain record.text');
    assert.ok(post.author && typeof post.author.handle === 'string', 'each post must contain an author handle');
  }
});
