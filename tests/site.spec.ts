import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = ['/', '/work/', '/work/shellbench/', '/work/shellform/', '/work/canopy/', '/research/', '/publications/', '/about/', '/cv/', '/contact/'];

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

test('no visible draft markers or private details', async ({ page }) => {
  test.setTimeout(90_000);
  for (const path of pages) {
    await page.goto(path);
    const text = await page.locator('body').innerText();
    expect(text, path).not.toMatch(/\bTODO\b|\bDRAFT\b|lorem ipsum/);

    for (const word of PRIVATE) expect(text.includes(word), `${path}: private detail`).toBe(false);
  }
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
