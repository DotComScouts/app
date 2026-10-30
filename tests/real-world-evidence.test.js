const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyEvidence } = require('../lib/shadow-evidence');

// Small, manually reviewed sample of public GitHub issue reports.
// Excerpts are paraphrased; source URLs are retained for auditability.
const cases = [
  {
    id: 'openai/codex#35611',
    url: 'https://github.com/openai/codex/issues/35611',
    text: 'Improve MCP startup timeout UX. MCP servers time out during startup; users receive duplicate warnings, and the suggested timeout increase does not fix shared VPN or DNS failures. Proposed UX: show one compact warning after startup.',
    problem: true,
    featureRequest: true
  },
  {
    id: 'anthropics/claude-code#53641',
    url: 'https://github.com/anthropics/claude-code/issues/53641',
    text: 'The configured per-server timeout is not enforced on individual tool calls; one call can hang indefinitely after initialization.',
    problem: true,
    featureRequest: false
  },
  {
    id: 'anthropics/claude-code#62121',
    url: 'https://github.com/anthropics/claude-code/issues/62121',
    text: 'Stdio tool calls time out after about one second, although the server returns a valid response several seconds later.',
    problem: true,
    featureRequest: false
  },
  {
    id: 'openai/codex#29416',
    url: 'https://github.com/openai/codex/issues/29416',
    text: 'An optional MCP server is too slow to respond and blocks creation of new conversations; disabling that server restores the flow.',
    problem: true,
    featureRequest: false
  },
  {
    id: 'anthropics/claude-code#52441',
    url: 'https://github.com/anthropics/claude-code/issues/52441',
    text: 'Feature request: long-running HTTP MCP operations exceed the client limit; users request a configurable per-server timeout flag.',
    problem: true,
    featureRequest: true
  },
  {
    id: 'anthropics/claude-code#76459',
    url: 'https://github.com/anthropics/claude-code/issues/76459',
    text: 'Static-header authentication on an HTTP MCP endpoint hangs until the full connection timeout expires despite a healthy endpoint.',
    problem: true,
    featureRequest: false
  }
];

for (const sample of cases) {
  test(`real-world ${sample.id} is recognized without conflating demand and feature requests`, () => {
    const evidence = classifyEvidence({ source: 'github', sourceUrl: sample.url, text: sample.text });
    assert.equal(evidence.problem, sample.problem, 'problem classification');
    assert.equal(evidence.featureRequest, sample.featureRequest, 'feature request classification');
    assert.equal(evidence.demandIntent, false, 'feature/bug reports are not automatically solution-seeking demand');
  });
}
