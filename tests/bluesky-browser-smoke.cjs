const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

async function main() {
  const htmlPath = path.join(__dirname, '..', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const server = http.createServer((req, res) => {
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

  let browser;
  const pageErrors = [];
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    page.on('pageerror', error => pageErrors.push(error.message));
    const address = server.address();
    await page.goto(`http://127.0.0.1:${address.port}/`, { waitUntil: 'domcontentloaded', timeout: 20000 });

    assert.equal(await page.locator('#blueskyBetaQuery').count(), 1, 'Bluesky query input should render');
    assert.equal(await page.locator('#blueskyBetaRun').count(), 1, 'Bluesky search button should render');

    await page.locator('#blueskyBetaQuery').fill('MCP server');
    await page.locator('#blueskyBetaRun').click();

    await page.waitForFunction(() => {
      const text = document.getElementById('blueskyBetaStatus')?.textContent || '';
      return text.includes('API erfolgreich') || text.includes('Bluesky-API fehlgeschlagen');
    }, null, { timeout: 25000 });

    const status = await page.locator('#blueskyBetaStatus').innerText();
    assert.match(status, /API erfolgreich/, `Browser API request did not succeed: ${status}`);
    assert.equal(await page.locator('#blueskyBetaRun').isDisabled(), false, 'search button should be re-enabled');
    assert.equal(pageErrors.length, 0, `uncaught browser errors: ${pageErrors.join('; ')}`);

    console.log('Browser smoke test passed: Bluesky UI rendered and public API fetch succeeded.');
    console.log(`Status: ${status}`);
    console.log(`Displayed unique posts: ${await page.locator('#blueskyBetaTotal').innerText()}`);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
