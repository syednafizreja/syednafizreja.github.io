// A thin ring that trails the mouse and widens over links and buttons.
// Mouse or trackpad only, and only when motion is allowed. The system cursor stays visible.

const fine = matchMedia('(pointer: fine)');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

if (fine.matches && !reduce.matches) {
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  ring.setAttribute('aria-hidden', 'true');
  document.body.append(ring);

  let x = -100, y = -100, rx = -100, ry = -100, raf = 0;
  const loop = () => {
    rx += (x - rx) * 0.2;
    ry += (y - ry) * 0.2;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    raf = Math.abs(x - rx) + Math.abs(y - ry) > 0.3 ? requestAnimationFrame(loop) : 0;
  };

  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (rx < -50) { rx = e.clientX; ry = e.clientY; }
    x = e.clientX; y = e.clientY;
    ring.classList.add('on');
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });

  document.addEventListener('pointerover', (e) => {
    const t = (e.target as Element).closest?.('a, button, [role="button"], summary, label, input, select, textarea');
    ring.classList.toggle('hot', !!t);
  });
  document.documentElement.addEventListener('pointerleave', () => ring.classList.remove('on'));
  reduce.addEventListener('change', () => { if (reduce.matches) ring.remove(); });
}
