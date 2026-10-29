const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

async function runSource(page, source) {
  if (source.input) await page.locator(source.input).fill(source.query);
  await page.locator(source.button).click();
  await page.waitForFunction(({ selector, success, failure }) => {
    const text = document.querySelector(selector)?.textContent || '';
    return text.includes(success) || text.includes(failure);
  }, {
    selector: source.status,
    success: source.successText || 'API erfolgreich',
    failure: source.failureText || 'fehlgeschlagen'
  }, { timeout: 30000 });
  const status = await page.locator(source.status).innerText();
  assert.ok(status.includes(source.successText || 'API erfolgreich'),
    `${source.name} browser API request failed: ${status}`);
  if (source.button) {
    assert.equal(await page.locator(source.button).isDisabled(), false,
      `${source.name} button should be re-enabled`);
  }
  console.log(`PASS ${source.name}: ${status}`);
}

async function main() {
  const htmlPath = path.join(__dirname, '..', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const targetUrl = process.env.DOTCOMSCOUTS_TEST_URL;
  let server = null;
  if (!targetUrl) {
    server = http.createServer((req, res) => {
      if (req.url === '/' || req.url.startsWith('/index.html')) {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        res.end(html);
        return;
      }
      res.writeHead(404);
      res.end('Not found');
    });
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
  }

  let browser;
  const pageErrors = [];
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    page.on('pageerror', error => pageErrors.push(error.message));
    const address = server ? server.address() : null;
    const pageUrl = targetUrl || `http://127.0.0.1:${address.port}/`;
    await page.goto(pageUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    const coreStateBefore = {
      results: await page.locator('#results').innerText(),
      trendCandidates: await page.locator('#trendCandidates').innerText(),
      domainProgress: await page.locator('#domainProgress').innerText()
    };

    const sources = [
      {
        name: 'Hugging Face',
        // Keep the app's default multi-topic query to exercise the representative user configuration.
        button: '#hfBetaRun',
        status: '#hfBetaStatus'
      },
      {
        name: 'npm Registry',
        input: '#npmBetaQuery',
        query: 'mcp server',
        button: '#npmBetaRun',
        status: '#npmBetaStatus',
        failureText: 'Abruf fehlgeschlagen'
      },
      {
        name: 'Stack Exchange',
        input: '#stackBetaQuery',
        query: 'MCP server',
        button: '#stackBetaRun',
        status: '#stackBetaStatus',
        failureText: 'API fehlgeschlagen'
      },
      {
        name: 'DEV Community',
        input: '#devtoBetaTags',
        query: 'ai',
        button: '#devtoBetaRun',
        status: '#devtoBetaStatus',
        failureText: 'DEV-API fehlgeschlagen'
      },
      {
        name: 'Bluesky',
        input: '#blueskyBetaQuery',
        query: 'MCP server',
        button: '#blueskyBetaRun',
        status: '#blueskyBetaStatus',
        failureText: 'Bluesky-API fehlgeschlagen'
      }
    ];

    for (const source of sources) {
      if (source.input) {
        assert.equal(await page.locator(source.input).count(), 1,
          `${source.name} query input should render`);
      }
      assert.equal(await page.locator(source.button).count(), 1,
        `${source.name} run button should render`);
      await runSource(page, source);
    }

    // Experimental sources must not mutate core trend/domain state.
    assert.equal(await page.locator('#results').innerText(), coreStateBefore.results,
      'experimental sources must not mutate the core domain results table');
    assert.equal(await page.locator('#trendCandidates').innerText(), coreStateBefore.trendCandidates,
      'experimental sources must not alter the core trend candidates');
    assert.equal(await page.locator('#domainProgress').innerText(), coreStateBefore.domainProgress,
      'experimental sources must not change core domain-availability progress');

    assert.equal(pageErrors.length, 0,
      `uncaught browser errors: ${pageErrors.join('; ')}`);
    console.log('Browser smoke test passed: all five experimental source panels fetched live data in Chromium and core domain/trend state remained unchanged.');
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
