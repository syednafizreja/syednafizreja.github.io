// Home hero background: a triangulated finite-element mesh. It never moves by itself.
// Under a mouse or pen the nearest nodes deflect away from the pointer, as under a point load,
// and the elements around it light up like a stress contour. It eases back when the pointer leaves.
// Touch screens and reduced motion get the still mesh only.

const canvas = document.querySelector<HTMLCanvasElement>('[data-mesh]');
const ctx = canvas?.getContext('2d');
const host = canvas?.parentElement;

if (canvas && ctx && host) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let w = 0, h = 0, dpr = 1;
  let cols = 0, rows = 0;
  let R = new Float32Array(0); // rest positions
  let X = new Float32Array(0); // current positions
  let G = new Float32Array(0); // load intensity at each node, 0..1
  let tris = new Uint32Array(0);
  let shade = new Uint8Array(0);

  let ink = '#e8eef8', c1 = '#22d3ee', c2 = '#a78bfa';
  const readColours = () => {
    const cs = getComputedStyle(document.documentElement);
    ink = cs.getPropertyValue('--ink').trim() || ink;
    c1 = cs.getPropertyValue('--accent').trim() || c1;
    c2 = cs.getPropertyValue('--accent-2').trim() || c2;
  };

  // small seeded generator so the mesh is the same on every visit
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  const build = () => {
    seed = 7;
    const s = Math.max(64, Math.min(104, w / 14));
    cols = Math.ceil(w / s) + 2;
    rows = Math.ceil(h / s) + 2;
    R = new Float32Array(cols * rows * 2);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const k = (j * cols + i) * 2;
        const edge = i === 0 || j === 0 || i === cols - 1 || j === rows - 1;
        R[k] = (i - 0.5) * s + (edge ? 0 : (rnd() - 0.5) * 0.7 * s);
        R[k + 1] = (j - 0.5) * s + (edge ? 0 : (rnd() - 0.5) * 0.7 * s);
      }
    }
    X = R.slice();
    G = new Float32Array(cols * rows);
    const t: number[] = [];
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        const a = j * cols + i, b = a + 1, c = a + cols, d = c + 1;
        if ((i + j) % 2) t.push(a, b, d, a, d, c);
        else t.push(a, b, c, b, d, c);
      }
    }
    tris = new Uint32Array(t);
    shade = new Uint8Array(tris.length / 3).map(() => Math.floor(rnd() * 4));
  };

  const resize = () => {
    const r = host.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    build();
  };

  const fills: Path2D[] = [];
  const hot: Path2D[] = [];
  const draw = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);
    for (let b = 0; b < 4; b++) fills[b] = new Path2D();
    for (let b = 0; b < 5; b++) hot[b] = new Path2D();
    const edges = new Path2D();
    const hotEdges = new Path2D();
    for (let n = 0; n < tris.length; n += 3) {
      const a = tris[n], b = tris[n + 1], c = tris[n + 2];
      const tri = (q: Path2D) => {
        q.moveTo(X[a * 2], X[a * 2 + 1]);
        q.lineTo(X[b * 2], X[b * 2 + 1]);
        q.lineTo(X[c * 2], X[c * 2 + 1]);
        q.closePath();
      };
      const g = (G[a] + G[b] + G[c]) / 3;
      if (g > 0.06) {
        tri(hot[Math.min(4, Math.floor(g * 5))]);
        tri(hotEdges);
      } else {
        tri(fills[shade[n / 3]]);
      }
      tri(edges);
    }
    ctx.fillStyle = ink;
    for (let b = 0; b < 4; b++) {
      ctx.globalAlpha = 0.012 + b * 0.012;
      ctx.fill(fills[b]);
    }
    ctx.globalAlpha = 0.07;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1;
    ctx.stroke(edges);
    for (let b = 0; b < 5; b++) {
      ctx.fillStyle = b < 3 ? c1 : c2;
      ctx.globalAlpha = 0.05 + b * 0.045;
      ctx.fill(hot[b]);
    }
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = c1;
    ctx.stroke(hotEdges);
    // nodes
    const dots = new Path2D();
    for (let k = 0; k < G.length; k++) {
      const r = 0.9 + G[k] * 2.2;
      dots.moveTo(X[k * 2] + r, X[k * 2 + 1]);
      dots.arc(X[k * 2], X[k * 2 + 1], r, 0, Math.PI * 2);
    }
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = ink;
    ctx.fill(dots);
    // fade the mesh into the page at the bottom and behind the text on the left
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'destination-out';
    const fb = ctx.createLinearGradient(0, h * 0.55, 0, h);
    fb.addColorStop(0, 'rgba(0,0,0,0)');
    fb.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = fb;
    ctx.fillRect(0, 0, w, h);
    const fl = ctx.createLinearGradient(0, 0, w, 0);
    fl.addColorStop(0, 'rgba(0,0,0,0.55)');
    fl.addColorStop(0.55, 'rgba(0,0,0,0.25)');
    fl.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fl;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  };

  // pointer load
  let px = -1e4, py = -1e4, tx = -1e4, ty = -1e4, amp = 0, goal = 0;
  const SIG = 150, PUSH = 22;
  const step = () => {
    px += (tx - px) * 0.18;
    py += (ty - py) * 0.18;
    amp += (goal - amp) * 0.08;
    let moving = Math.abs(goal - amp) > 0.002 || Math.abs(tx - px) > 0.5 || Math.abs(ty - py) > 0.5;
    const s2 = 2 * SIG * SIG;
    for (let k = 0; k < G.length; k++) {
      const rx = R[k * 2], ry = R[k * 2 + 1];
      const dx = rx - px, dy = ry - py;
      const d2 = dx * dx + dy * dy;
      const g = amp * Math.exp(-d2 / s2);
      const d = Math.sqrt(d2) || 1;
      const ox = rx + (dx / d) * PUSH * g, oy = ry + (dy / d) * PUSH * g;
      if (Math.abs(X[k * 2] - ox) > 0.05 || Math.abs(X[k * 2 + 1] - oy) > 0.05) moving = true;
      X[k * 2] += (ox - X[k * 2]) * 0.25;
      X[k * 2 + 1] += (oy - X[k * 2 + 1]) * 0.25;
      G[k] = g;
    }
    return moving;
  };

  let raf = 0, visible = true;
  const loop = () => {
    raf = 0;
    const moving = step();
    draw();
    if (moving && visible && !document.hidden) raf = requestAnimationFrame(loop);
  };
  const kick = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop); };

  host.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || reduce.matches) return;
    const r = host.getBoundingClientRect();
    tx = e.clientX - r.left; ty = e.clientY - r.top;
    if (amp < 0.01 && goal === 0) { px = tx; py = ty; }
    goal = 1;
    kick();
  }, { passive: true });
  host.addEventListener('pointerleave', () => { goal = 0; kick(); });

  readColours();
  new ResizeObserver(() => { resize(); draw(); }).observe(host);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(host);
  window.addEventListener('themechange', () => { readColours(); draw(); });
  reduce.addEventListener('change', () => { goal = 0; amp = 0; X = R.slice(); G.fill(0); draw(); });

  // Type the phrases once, then rest on the first one, so nothing keeps moving (WCAG 2.2.2).
  const rot = document.querySelector<HTMLElement>('[data-rotate]');
  const words: string[] = rot ? JSON.parse(rot.dataset.rotate || '[]') : [];
  if (rot && words.length > 1 && !reduce.matches) {
    const line = rot.parentElement!;
    const seq = [...words.slice(1), words[0]];
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const run = async () => {
      line.classList.add('typing');
      for (const next of seq) {
        await wait(1900);
        for (let t = rot.textContent!; t.length; t = t.slice(0, -1)) { rot.textContent = t.slice(0, -1); await wait(28); }
        for (let i = 1; i <= next.length; i++) { rot.textContent = next.slice(0, i); await wait(55); }
      }
      await wait(1200);
      line.classList.remove('typing');
    };
    const go = () => setTimeout(run, 600);
    if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
  }
}
