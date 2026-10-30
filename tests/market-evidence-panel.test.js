const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('Beta 98.29 exposes the five live shadow sources in a dedicated market evidence panel', () => {
  assert.match(html, /id="marketEvidencePanel"/);
  assert.match(html, /id="marketSourceGrid"/);
  assert.match(html, /id="marketEvidenceList"/);
  for (const source of ['Hugging Face', 'npm Registry', 'Stack Exchange', 'DEV Community', 'Bluesky']) {
    assert.ok(html.includes("['" + source + "',async query=>"), 'missing live source adapter: ' + source);
  }
  assert.match(html, /function drawShadowMarketPanel/);
  assert.match(html, /shadowMarketSummary=summary;drawShadowMarketPanel\(summary\)/);
  assert.match(html, /records\.filter\(x=>x\.category===category&&\(x\.relevance\|\|0\)>=50\)/);
  assert.match(html, /records\.filter\(x=>\(x\.relevance\|\|0\)>=50\)/);
});

test('the five legacy standalone source panels are consolidated into the shared market view', () => {
  assert.ok(html.includes('#hfBetaPanel,#npmBetaPanel,#stackBetaPanel,#devtoBetaPanel,#blueskyBetaPanel{display:none!important}'));
  assert.match(html, /Gemeinsame Marktbeobachtung/);
  assert.match(html, /Alle fünf Zusatzquellen in einer gemeinsamen Übersicht/);
});

test('market evidence panel is localized in all four supported interface languages', () => {
  for (const lang of ['de', 'en', 'es', 'fr']) {
    assert.match(html, new RegExp(lang + ':\\{source:'));
  }
  assert.match(html, /drawShadowMarketPanel\(\);/);
});

test('market evidence is presented as heuristic and remains isolated from domain ranking', () => {
  assert.match(html, /heuristisch klassifizierte Signale/);
  const start = html.indexOf('async function collectShadowMarketEvidence');
  const end = html.indexOf('function getLengthRange()', start);
  const adapter = html.slice(start, end);
  assert.doesNotMatch(adapter, /trendScore\s*=|results\.push\(|checkAvail\(/);
  assert.match(adapter, /Keine Auswirkung auf die reguläre Bewertung/);
});
