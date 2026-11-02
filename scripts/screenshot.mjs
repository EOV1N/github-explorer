// Utility script: builds a README screenshot against a local preview server.
// Usage: npm run build && npx vite preview --port 4173 &  →  node scripts/screenshot.mjs
import { chromium } from 'playwright';

const URL = process.env.SHOT_URL ?? 'http://localhost:4173/?q=react';
const OUT = process.env.SHOT_OUT ?? 'docs/screenshot.png';

const browser = await chromium.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  colorScheme: 'dark',
});

await page.goto(URL, { waitUntil: 'domcontentloaded' });
try {
  await page.waitForSelector('article', { timeout: 20000 });
} catch {
  console.warn('No repository cards appeared — check the preview server.');
}
await page.waitForTimeout(2500); // let avatars and webfonts settle
await page.screenshot({ path: OUT });
await browser.close();
console.log('SHOT-OK', OUT);
