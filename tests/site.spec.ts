import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = ['/', '/work/', '/work/shellbench/', '/work/shellform/', '/work/shelllab/', '/work/stress-line-ribs/', '/work/seismic-shell-floors/', '/research/', '/publications/', '/about/', '/education/', '/cv/', '/contact/'];

for (const path of pages) {
  test(`${path} has no WCAG A/AA violations`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.goto(path);
    await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { if (d instanceof HTMLDetailsElement) d.open = true; }));
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
}

// Private strings that must never appear, stored encoded so they are not in the source.
const PRIVATE = ['RGVuY28=', 'Kzg2', 'c25yaGFzaWI='].map((b) => Buffer.from(b, 'base64').toString());
// exact findings and grades are kept off the public pages (the CV sent to professors carries them)
import { createHash } from 'node:crypto';

// Results and grades kept off the public site. Values are stored only as hashes (first 16 hex of SHA-256, whitespace removed),
// so this public file does not repeat them. To add one: node -e "console.log(require('crypto').createHash('sha256').update('VALUE'.replace(/\s+/g,'')).digest('hex').slice(0,16))"
const WITHHELD_WORDS = ['GPA', 'weighted average'];
const WITHHELD_HASHES = new Set(['87db912ff0dc7aa4', '6e960221dab9d17d', '37a9d6f9ed8e5f79', 'd415896c53b1bcae', '1c5a938863b97ec5', 'fb0c0be1d2128c58', 'd46f9ee841b910aa', '8469980bcf39d434', '422361409165f1db', '06a688643b42bb5a']);
const h = (s: string) => createHash('sha256').update(s.replace(/\s+/g, '')).digest('hex').slice(0, 16);
// number-like tokens such as 1,234 / 12.5 / 12.5 % / 3.0 m³ / 50/100 / 3 of 4; each is checked whole and as the bare number
const withheldIn = (text: string) =>
  [...text.matchAll(/\d[\d,]*(?:\.\d+)?(?:\s*(?:%|m³|\/\s*100|of\s+\d+))?/g)].flatMap((m) => [m[0], m[0].match(/^[\d,.]+/)![0]]).filter((t) => WITHHELD_HASHES.has(h(t)));

test('no visible draft markers or private details', async ({ page }) => {
  test.setTimeout(90_000);
  for (const path of pages) {
    await page.goto(path);
    await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { if (d instanceof HTMLDetailsElement) d.open = true; }));
    const text = await page.locator('body').innerText();
    expect(text, path).not.toMatch(/\bTODO\b|\bDRAFT\b|lorem ipsum/);

    for (const word of PRIVATE) expect(text.includes(word), `${path}: private detail`).toBe(false);
    for (const word of WITHHELD_WORDS) expect(text.includes(word), `${path}: grade wording`).toBe(false);
    expect(withheldIn(text), `${path}: exact result or grade`).toEqual([]);
  }
});

test('mobile menu opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/');
  const btn = page.locator('.menu-toggle');
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
  await btn.click();
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#site-drawer nav a')).toHaveCount(5);
  await page.keyboard.press('Escape');
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
});

test('hero shell is drawn', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const canvas = page.locator('canvas.mesh');
  await expect(canvas).toBeVisible();
  await page.waitForTimeout(500);
  const painted = await canvas.evaluate((el) => {
    const c = el as HTMLCanvasElement;
    const ctx = c.getContext('2d');
    if (!ctx || c.width < 2) return false;
    const { data } = ctx.getImageData(0, 0, c.width, c.height);
    for (let i = 3; i < data.length; i += 32) if (data[i] > 8) return true;
    return false;
  });
  expect(painted).toBe(true);
});

test('method filter is shareable through the URL', async ({ page }) => {
  await page.goto('/work/?method=form-finding');
  await expect(page.locator('[data-method="form-finding"]')).toHaveAttribute('aria-current', 'true');
  const visible = page.locator('.index-row:visible');
  expect(await visible.count()).toBeGreaterThan(0);
  expect(await visible.count()).toBeLessThan(6);
});

test('email is revealed by script', async ({ page }) => {
  await page.goto('/contact/');
  await expect(page.locator('.contact-list a[href^="mailto:"]')).toHaveCount(1);
});

test('copy BibTeX button finds its entry', async ({ page }) => {
  await page.goto('/publications/');
  const ids = await page.locator('[data-copy]').evaluateAll((els) => els.map((e) => e.getAttribute('data-copy')));
  for (const id of ids) expect(await page.locator(`#${id}`).count()).toBe(1);
});

test('the site stays dark with no theme switch', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await expect(page.locator('[data-theme-toggle]')).toHaveCount(0);
  const scheme = await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme);
  expect(scheme).toContain('dark');
  const bg = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
  expect(bg).toBe('rgb(8, 10, 14)');
});

test('back-to-top control appears after scrolling and returns to the top', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/cv/');
  const btn = page.locator('[data-to-top]');
  await expect(btn).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(btn).toBeVisible();
  await btn.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5);
});

test('a verification record stays closed until it is opened', async ({ page }) => {
  await page.goto('/');
  const spec = page.locator('details.spec').first();
  await expect(spec).not.toHaveAttribute('open', '');
  await expect(spec.locator('p')).toBeHidden();
  await spec.locator('summary').click();
  await expect(spec).toHaveAttribute('open', '');
  await expect(spec.locator('p')).toBeVisible();
});

test('3D view loads only on request', async ({ page }) => {
  await page.goto('/work/shellform/');
  const host = page.locator('[data-viewer]').first();
  await expect(host.locator('canvas')).toHaveCount(0);
  await host.locator('[data-load]').click();
  await expect(host).toHaveAttribute('data-ready', 'true', { timeout: 20000 });
  await expect(host.locator('[data-reset]')).toBeFocused();
});
