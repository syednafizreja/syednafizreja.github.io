// Full-viewport triangulated mesh. It drifts on its own, leans toward a mouse
// or a finger, and stays on screen at every width. Reduced motion gets one still frame.

const canvas = document.querySelector<HTMLCanvasElement>('[data-mesh]');
const ctx = canvas?.getContext('2d', { alpha: true });

if (canvas && ctx) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let w = 0;
  let h = 0;
  let dpr = 1;
  let cols = 0;
  let R = new Float32Array(0);
  let P = new Float32Array(0);
  let G = new Float32Array(0);
  let cur = new Float32Array(0);
  let tris = new Uint32Array(0);
  let shade = new Uint8Array(0);

  let ink = '#94a3b8';
  let c1 = '#22d3ee';
  const readColours = () => {
    const cs = getComputedStyle(document.documentElement);
    ink = cs.getPropertyValue('--ink-2').trim() || ink;
    c1 = cs.getPropertyValue('--accent').trim() || c1;
  };

  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  const targetCount = (width: number) => (width <= 640 ? 28 : width <= 1024 ? 45 : 75);

  const build = () => {
    seed = 7;
    const aspect = w / Math.max(h, 1);
    const target = targetCount(w);
    cols = Math.max(4, Math.round(Math.sqrt(target * aspect)));
    const rows = Math.max(4, Math.round(target / cols));
    const sx = w / (cols - 1);
    const sy = h / (rows - 1);
    R = new Float32Array(cols * rows * 2);
    P = new Float32Array(cols * rows);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i;
        const edge = i === 0 || j === 0 || i === cols - 1 || j === rows - 1;
        R[k * 2] = i * sx + (edge ? 0 : (rnd() - 0.5) * 0.55 * sx);
        R[k * 2 + 1] = j * sy + (edge ? 0 : (rnd() - 0.5) * 0.55 * sy);
        P[k] = rnd() * Math.PI * 2;
      }
    }
    G = new Float32Array(cols * rows);
    cur = new Float32Array(R);
    const t: number[] = [];
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        const a = j * cols + i;
        const b = a + 1;
        const c = a + cols;
        const d = c + 1;
        if ((i + j) % 2) t.push(a, b, d, a, d, c);
        else t.push(a, b, c, b, d, c);
      }
    }
    tris = new Uint32Array(t);
    shade = new Uint8Array(tris.length / 3);
    for (let i = 0; i < shade.length; i++) shade[i] = Math.floor(rnd() * 3);
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const nw = rect.width;
    const nh = rect.height;
    if (nw < 2 || nh < 2) return;
    const cap = Math.min(window.devicePixelRatio || 1, 2, 2048 / Math.max(nw, nh));
    const bw = Math.max(1, Math.round(nw * cap));
    const bh = Math.max(1, Math.round(nh * cap));
    const grew = Math.abs(nw - w) > 8 || Math.abs(nh - h) > 8 || !cols;
    w = nw;
    h = nh;
    dpr = cap;
    if (canvas.width !== bw) canvas.width = bw;
    if (canvas.height !== bh) canvas.height = bh;
    if (grew) build();
  };

  let px = -1e4;
  let py = -1e4;
  let tx = -1e4;
  let ty = -1e4;
  let amp = 0;
  let goal = 0;
  let touching = false;

  const step = (now: number) => {
    px += (tx - px) * 0.18;
    py += (ty - py) * 0.18;
    amp += (goal - amp) * 0.1;
    const drift = reduce.matches ? 0 : Math.min(w, h) * 0.011;
    const reach = Math.max(120, Math.min(w, h) * 0.28);
    const s2 = 2 * reach * reach;
    const push = Math.min(28, Math.min(w, h) * 0.03);
    for (let k = 0; k < G.length; k++) {
      const rx = R[k * 2];
      const ry = R[k * 2 + 1];
      const dx = rx - px;
      const dy = ry - py;
      const d2 = dx * dx + dy * dy;
      const g = amp * Math.exp(-d2 / s2);
      const dist = Math.sqrt(d2) || 1;
      G[k] = g;
      cur[k * 2] = rx + Math.sin(now * 0.00045 + P[k]) * drift + (dx / dist) * push * g;
      cur[k * 2 + 1] = ry + Math.cos(now * 0.00032 + P[k] * 1.7) * drift * 0.75 + (dy / dist) * push * g;
    }
  };

  const draw = (now: number) => {
    if (!w || !h || !G.length) return;
    step(now);
    const light = document.documentElement.dataset.theme === 'light';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const edges = new Path2D();
    const accent = new Path2D();
    const hot = new Path2D();
    for (let n = 0; n < tris.length; n += 3) {
      const a = tris[n];
      const b = tris[n + 1];
      const c = tris[n + 2];
      const path = shade[n / 3] === 0 ? accent : edges;
      path.moveTo(cur[a * 2], cur[a * 2 + 1]);
      path.lineTo(cur[b * 2], cur[b * 2 + 1]);
      path.lineTo(cur[c * 2], cur[c * 2 + 1]);
      path.closePath();
      if ((G[a] + G[b] + G[c]) / 3 > 0.08) {
        hot.moveTo(cur[a * 2], cur[a * 2 + 1]);
        hot.lineTo(cur[b * 2], cur[b * 2 + 1]);
        hot.lineTo(cur[c * 2], cur[c * 2 + 1]);
        hot.closePath();
      }
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = light ? '#1e293b' : ink;
    ctx.globalAlpha = light ? 0.42 : 0.5;
    ctx.stroke(edges);
    ctx.strokeStyle = light ? '#0e7490' : c1;
    ctx.globalAlpha = light ? 0.62 : 0.72;
    ctx.stroke(accent);
    ctx.strokeStyle = c1;
    ctx.globalAlpha = light ? 0.55 : 0.9;
    ctx.stroke(hot);
    const dots = new Path2D();
    for (let k = 0; k < G.length; k++) {
      const r = 1.15 + G[k] * 1.8;
      dots.moveTo(cur[k * 2] + r, cur[k * 2 + 1]);
      dots.arc(cur[k * 2], cur[k * 2 + 1], r, 0, Math.PI * 2);
    }
    ctx.globalAlpha = light ? 0.55 : 0.75;
    ctx.fillStyle = light ? '#0e7490' : c1;
    ctx.fill(dots);
    ctx.globalAlpha = 1;
  };

  let raf = 0;
  const loop = (now: number) => {
    raf = 0;
    draw(now);
    if (!reduce.matches && !document.hidden) raf = requestAnimationFrame(loop);
  };
  const kick = () => {
    if (!raf && !reduce.matches && !document.hidden) raf = requestAnimationFrame(loop);
  };

  const aim = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    tx = clientX - rect.left;
    ty = clientY - rect.top;
    if (amp < 0.01 && goal === 0) {
      px = tx;
      py = ty;
    }
    goal = 1;
  };

  window.addEventListener('pointermove', (e) => {
    if (reduce.matches) return;
    if (e.pointerType === 'touch' && !touching) return;
    aim(e.clientX, e.clientY);
  }, { passive: true });
  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
    touching = true;
    aim(e.clientX, e.clientY);
  }, { passive: true });
  const release = (e: PointerEvent) => {
    if (e.pointerType === 'touch' || e.pointerType === 'pen') touching = false;
    goal = 0;
  };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  document.documentElement.addEventListener('pointerleave', () => { goal = 0; });

  readColours();
  const onResize = () => {
    resize();
    if (reduce.matches) draw(performance.now());
    else kick();
  };
  resize();
  if (reduce.matches) draw(performance.now());
  else kick();
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
  window.visualViewport?.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    } else if (reduce.matches) draw(performance.now());
    else kick();
  });
  window.addEventListener('themechange', () => {
    readColours();
    if (reduce.matches) draw(performance.now());
  });
  reduce.addEventListener('change', () => {
    goal = 0;
    amp = 0;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    draw(performance.now());
    kick();
  });
}
