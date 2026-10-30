const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('Beta 98.30 consolidates all five live shadow sources in one market evidence panel', () => {
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
  assert.match(html, /#marketSourceGrid\{display:none!important\}/);
});

test('standalone source panels stay hidden and technical diagnostics are collapsed by default', () => {
  assert.ok(html.includes('#hfBetaPanel,#npmBetaPanel,#stackBetaPanel,#devtoBetaPanel,#blueskyBetaPanel{display:none!important}'));
  assert.match(html, /id="marketEvidencePanel"/);
  assert.match(html, /<details class="source-diagnostics">/);
  assert.doesNotMatch(html, /<details class="source-diagnostics" open>/);
  assert.match(html, /id="sourceCsv"/);
  assert.match(html, /function exportSourceDiagnostics/);
});

test('market evidence panel headings and labels are localized in all four supported interface languages', () => {
  for (const lang of ['de', 'en', 'es', 'fr']) {
    assert.match(html, new RegExp(lang + ':\\{source:'));
    assert.match(html, new RegExp(lang + ':\\{eyebrow:'));
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

test('regular domain search is trend-only and starts at 60 with 20-domain increments', () => {
  assert.match(html, /<select id="count"><option selected>60<\/option><option>80<\/option><option>100<\/option><\/select>/);
  assert.doesNotMatch(html, /id="mode"/);
  const start = html.indexOf('function buildCandidates()');
  const end = html.indexOf('function drawTrendCandidates()', start);
  const builder = html.slice(start, end);
  assert.ok(start >= 0 && end > start, 'candidate builder boundaries found');
  assert.match(builder, /for\(let round=0;selected\.length<count;round\+\+\)/);
  assert.match(builder, /type:'Originaltrend'/);
  assert.match(builder, /type:'Trend-inspiriert'/);
  assert.doesNotMatch(builder, /Fantasiename|randomBrand|syllableBrand/);
  assert.doesNotMatch(html, /function randomBrand|function syllableBrand/);
});

test('language-risk screening and all four localized domain CSV headers remain available', () => {
  assert.match(html, /function languageRisk\(raw\)/);
  for (const label of ["de:\['Domain'","en:\['Domain'","es:\['Dominio'","fr:\['Domaine'"]) {
    assert.ok(html.includes(label), 'missing localized CSV header: ' + label);
  }
  assert.match(html, /downloadCsv\(rows,'DotComScouts-results\.csv'\)/);
  assert.match(html, /applyLanguage\(lang\)/);
});
