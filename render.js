// render.js — fetch SVG via URL, render to PNG via Playwright Chromium.
// Supports @font-face (embedded base64 fonts) natively.

const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const svgUrl = process.env.SVG_URL;
  const width = parseInt(process.env.WIDTH || '1366', 10);
  const height = parseInt(process.env.HEIGHT || '768', 10);
  const scale = parseInt(process.env.SCALE || '1', 10);
  const outPath = 'output.png';

  if (!svgUrl) {
    console.error('SVG_URL not set');
    process.exit(1);
  }

  const finalW = width * scale;
  const finalH = height * scale;
  console.log(`[render] svg_url=${svgUrl.slice(0, 80)}...`);
  console.log(`[render] viewport=${width}x${height}  scale=${scale}  final=${finalW}x${finalH}`);

  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: scale,
    });
    const page = await context.newPage();

    // Direct SVG load (works for both public and presigned URLs)
    await page.goto(svgUrl, { waitUntil: 'networkidle', timeout: 60000 });

    // Wait for any embedded fonts to finish loading
    await page.evaluate(() => document.fonts && document.fonts.ready);

    // Screenshot the SVG element (or full page if no <svg> root)
    const svgEl = await page.$('svg');
    if (svgEl) {
      await svgEl.screenshot({ path: outPath, omitBackground: false });
    } else {
      await page.screenshot({
        path: outPath,
        fullPage: false,
        clip: { x: 0, y: 0, width: finalW, height: finalH },
      });
    }

    const stat = fs.statSync(outPath);
    console.log(`[render] wrote ${outPath} ${(stat.size/1024).toFixed(0)}KB ${stat.size}B`);
  } finally {
    await browser.close();
  }
})();
