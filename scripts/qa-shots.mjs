import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'] });
// light theme, desktop
let page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
await page.goto('http://localhost:4173/?q=typescript', { waitUntil: 'domcontentloaded' });
try { await page.waitForSelector('article', { timeout: 20000 }); } catch {}
await page.waitForTimeout(2200);
// star a repo to verify favorites interaction
await page.locator('article button[aria-label^="Add"]').first().click();
await page.locator('button[title*="Remove"]').first().waitFor({ timeout: 3000 }).catch(() => {});
await page.goto('http://localhost:4173/?q=typescript', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);
await page.screenshot({ path: '/tmp/qa-light.png' });
await page.close();
// dark theme, mobile
page = await browser.newPage({ viewport: { width: 390, height: 844 }, colorScheme: 'dark', isMobile: true, hasTouch: true });
await page.goto('http://localhost:4173/?q=tetris', { waitUntil: 'domcontentloaded' });
try { await page.waitForSelector('article', { timeout: 20000 }); } catch {}
await page.waitForTimeout(2200);
await page.screenshot({ path: '/tmp/qa-mobile.png' });
await browser.close();
console.log('QA-OK');
