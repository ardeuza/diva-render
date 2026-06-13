// render.js — fetch SVG, render to PNG via Playwright Chromium
// Supports @font-face (embedded base64 fonts) natively.

const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const svgUrl = process.env.SVG_URL;
  const width = parseInt(process.env.WIDTH || '1366', 10);
  const height = parseInt(process.env.HEIGHT || '768', 10);
  const outPath = 'output.png';

  if (!svgUrl) {
    console.error('SVG_URL not set');
    process.exit(1);
  }

  console.log(`[render] svg_url=${svgUrl}`);
  console.log(`[render] viewport=${width}x${height}`);

  // Use a small deviceScaleFactor to keep file size sane, then upscale via CSS
  // Actually for crisp 4K we want deviceScaleFactor=1 but the SVG declares its own viewBox.
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    // Wrap the SVG in a minimal HTML page so fonts/images load normally
    const html = `<!doctype html>
<html><head><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:#000;}</style>
</head><body>
<iframe id="frame" src="${svgUrl}" style="border:0;width:${width}px;height:${height}px;display:block"></iframe>
</body></html>`;

    // Direct SVG load is cleaner; let's do that
    await page.goto(svgUrl, { waitUntil: 'networkidle', timeout: 60000 });

    // Wait for any fonts to be ready
    await page.evaluate(() => document.fonts.ready);

    // Screenshot the SVG element (or page if no SVG element)
    const svgEl = await page.$('svg');
    if (svgEl) {
      await svgEl.screenshot({ path: outPath, omitBackground: false });
    } else {
      await page.screenshot({ path: outPath, fullPage: false, clip: { x: 0, y: 0, width, height } });
    }

    const stat = fs.statSync(outPath);
    console.log(`[render] wrote ${outPath} ${(stat.size/1024).toFixed(0)}KB`);
  } finally {
    await browser.close();
  }
})();
