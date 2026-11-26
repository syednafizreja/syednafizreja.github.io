// Small site-wide behaviours: theme toggle, email reveal, copy-to-clipboard, back to top.

const root = document.documentElement;

const themeButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]')];
const syncTheme = () => {
  const dark = root.dataset.theme !== 'light';
  for (const btn of themeButtons) btn.setAttribute('aria-pressed', String(dark));
};
syncTheme();
for (const btn of themeButtons) {
  btn.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* private mode: theme lasts for this page only */
    }
    syncTheme();
    window.dispatchEvent(new CustomEvent('themechange', { detail: next }));
  });
}

document.querySelectorAll<HTMLElement>('.email[data-u][data-d]').forEach((el) => {
  const addr = `${el.dataset.u}@${el.dataset.d}`;
  const a = document.createElement('a');
  a.href = `mailto:${addr}`;
  a.textContent = el.dataset.label || addr;
  el.replaceChildren(a);
});

document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
  const original = btn.textContent;
  btn.addEventListener('click', async () => {
    const src = document.getElementById(btn.dataset.copy!);
    if (!src) return;
    try {
      await navigator.clipboard.writeText(src.textContent ?? '');
      btn.textContent = 'Copied';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(src);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      btn.textContent = 'Selected: press Ctrl+C';
    }
    setTimeout(() => (btn.textContent = original), 1800);
  });
});

const toTop = document.querySelector<HTMLButtonElement>('[data-to-top]');
if (toTop) {
  toTop.hidden = false;
  let ticking = false;
  const update = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    toTop.style.setProperty('--p', max > 0 ? String(Math.min(1, scrollY / max)) : '0');
    toTop.toggleAttribute('data-show', scrollY > innerHeight * 1.2);
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update, { passive: true });
  update();
  toTop.addEventListener('click', () => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    document.querySelector<HTMLElement>('.brand')?.focus({ preventScroll: true });
  });
}

// Scroll reveal. Only elements below the first screen are hidden, and only when motion is allowed,
// so content never depends on this script.
if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const sel = '.section-head, .feature, .index-row, .now > div, .stats, .pub, .cv section, figure.fig, .numbers, .panel, .related a, .cta-band, .contact-list';
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { (e.target as HTMLElement).dataset.reveal = 'in'; io.unobserve(e.target); } }),
    { rootMargin: '0px 0px -8% 0px' },
  );
  const fold = innerHeight;
  const seen = new Map<Element, number>();
  document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
    if (el.getBoundingClientRect().top < fold) return;
    const parent = el.parentElement!;
    const i = seen.get(parent) ?? 0;
    seen.set(parent, i + 1);
    el.style.setProperty('--d', `${Math.min(i, 4) * 0.07}s`);
    el.dataset.reveal = '';
    io.observe(el);
  });
}

// A "see more" block starts closed. A link to a heading inside it opens the block first.
const openDetailsFor = (id: string) => {
  const el = document.getElementById(id);
  const box = el?.closest('details');
  if (box instanceof HTMLDetailsElement) box.open = true;
};
const openFromHash = () => {
  if (location.hash.length > 1) openDetailsFor(decodeURIComponent(location.hash.slice(1)));
};
document.addEventListener('click', (event) => {
  const link = (event.target as Element | null)?.closest?.('a[href^="#"]');
  const href = link?.getAttribute('href');
  if (href && href.length > 1) openDetailsFor(decodeURIComponent(href.slice(1)));
});
openFromHash();
window.addEventListener('hashchange', openFromHash);
