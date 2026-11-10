import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = ['/', '/work/', '/work/shellbench/', '/work/shellform/', '/work/canopy/', '/research/', '/publications/', '/about/', '/education/', '/cv/', '/contact/'];

for (const path of pages) {
  for (const scheme of ['light', 'dark'] as const) {
    test(`${path} has no WCAG A/AA violations (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
      // the site ignores the OS scheme (dark by default), so pick the theme the way a reader does
      await page.addInitScript((t) => localStorage.setItem('theme', t), scheme);
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(scheme);
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    });
  }
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
    const text = await page.locator('body').innerText();
    expect(text, path).not.toMatch(/\bTODO\b|\bDRAFT\b|lorem ipsum/);

    for (const word of PRIVATE) expect(text.includes(word), `${path}: private detail`).toBe(false);
    for (const word of WITHHELD_WORDS) expect(text.includes(word), `${path}: grade wording`).toBe(false);
    expect(withheldIn(text), `${path}: exact result or grade`).toEqual([]);
  }
});

test('projects menu lists every project and opens from the nav', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/work/shellform/');
  const toggle = page.locator('.sub-toggle');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#nav-projects a[aria-current="page"]')).toHaveText(/ShellForm/);
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/');
  await expect(page.locator('#nav-projects')).toBeHidden();
  await page.locator('.sub-toggle').click();
  await expect(page.locator('#nav-projects')).toBeVisible();
  expect(await page.locator('#nav-projects li:not(.all) a').count()).toBe(await page.locator('#nav-projects li').count() - 1);
  await page.keyboard.press('Escape');
  await expect(page.locator('#nav-projects')).toBeHidden();
});

test('typed hero line keeps looping and can be paused', async ({ page }) => {
  await page.goto('/');
  const rot = page.locator('[data-rotate]');
  const first = await rot.textContent();
  await expect(rot).not.toHaveText(first!, { timeout: 8_000 });
  const pause = page.locator('[data-rot-pause]');
  await pause.click();
  await expect(pause).toHaveText('Resume typing');
  const held = await rot.textContent();
  await page.waitForTimeout(1500);
  await expect(rot).toHaveText(held!);
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

test('theme toggle switches and persists', async ({ page }) => {
  await page.goto('/');
  const before = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.click('[data-theme-toggle]');
  const after = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(after).not.toBe(before);
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(after);
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

test('3D view loads only on request', async ({ page }) => {
  await page.goto('/');
  const host = page.locator('[data-viewer]').first();
  await expect(host.locator('canvas')).toHaveCount(0);
  await host.locator('[data-load]').click();
  await expect(host).toHaveAttribute('data-ready', 'true', { timeout: 20000 });
  await expect(host.locator('[data-reset]')).toBeFocused();
});
