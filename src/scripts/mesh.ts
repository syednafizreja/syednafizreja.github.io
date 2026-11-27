// Hyperbolic-paraboloid shell for the hero. The pointer tilts the view and
// lifts a Gaussian patch. Touch screens get a slow wave only. The loop stops
// when the hero leaves the screen, and reduced motion gets one still frame.

const canvas = document.querySelector<HTMLCanvasElement>('[data-mesh]');
const ctx = canvas?.getContext('2d', { alpha: true });
const hudU = document.querySelector<HTMLElement>('[data-hud-uv]');
const hudK = document.querySelector<HTMLElement>('[data-hud-k]');
const hudN = document.querySelector<HTMLElement>('[data-hud-n]');

if (canvas && ctx) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(hover: none), (pointer: coarse)');

  const CYAN = '#67D5F5';
  const BRASS = '#D9A45B';
  const INK = 'rgba(148, 160, 178, 0.55)';
  const RIB = 'rgba(148, 160, 178, 0.28)';

  let w = 0;
  let h = 0;
  let dpr = 1;
  let cols = 36;
  let rows = 18;

  let yaw = 0.18;
  let pitch = 0.6;
  let yawT = 0.18;
  let pitchT = 0.6;
  let pu = 0;
  let pv = 0;
  let puT = 0;
  let pvT = 0;
  let amp = 0;
  let ampT = 0;
  let seen = true;
  let raf = 0;
  let running = false;
  let hudAt = -1000;

  const density = () => {
    if (coarse.matches || w < 720) return [18, 10] as const;
    if (w < 1100) return [26, 14] as const;
    return [36, 18] as const;
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    w = rect.width;
    h = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bw = Math.max(1, Math.round(w * dpr));
    const bh = Math.max(1, Math.round(h * dpr));
    if (canvas.width !== bw) canvas.width = bw;
    if (canvas.height !== bh) canvas.height = bh;
    [cols, rows] = density();
  };

  const project = (u: number, v: number, t: number) => {
    const du = u - pu;
    const dv = v - pv;
    const g = amp * Math.exp(-(du * du + dv * dv) / 0.085);
    const breath = reduce.matches
      ? 0
      : Math.sin(t * 0.00042 + u * 2.4) * Math.cos(t * 0.00031 + v * 1.8) * (coarse.matches ? 0.05 : 0.028);
    const z = 0.55 * u * v + breath + g * 0.34;
    const x = u * 1.45;
    const y = v * 0.78;
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const x1 = x * cy + z * sy;
    const z1 = -x * sy + z * cy;
    const y1 = y * cp - z1 * sp;
    const z2 = y * sp + z1 * cp;
    const f = 3.6 / (3.6 + z2);
    const scale = Math.min(w, h) * (w < 720 ? 0.42 : 0.48);
    const ox = w < 720 ? w * 0.5 : w * 0.7;
    const oy = w < 720 ? h * 0.7 : h * 0.52;
    return { x: ox + x1 * f * scale, y: oy - y1 * f * scale, g, z };
  };

  const draw = (t: number) => {
    if (!w || !h) return;
    if (coarse.matches && !reduce.matches) {
      yawT = 0.28 * Math.sin(t * 0.0002);
      pitchT = 0.6 + 0.05 * Math.cos(t * 0.00016);
      ampT = 0;
    }
    const k = 0.07;
    yaw += (yawT - yaw) * k;
    pitch += (pitchT - pitch) * k;
    pu += (puT - pu) * k;
    pv += (pvT - pv) * k;
    amp += (ampT - amp) * k;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const pts: { x: number; y: number; g: number; z: number }[] = [];
    for (let j = 0; j < rows; j++) {
      const v = rows === 1 ? 0 : -1 + (2 * j) / (rows - 1);
      for (let i = 0; i < cols; i++) {
        const u = cols === 1 ? 0 : -1 + (2 * i) / (cols - 1);
        pts.push(project(u, v, t));
      }
    }
    const at = (i: number, j: number) => pts[j * cols + i];
    const bins = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
    const binOf = (g: number) => (g > 0.62 ? 3 : g > 0.34 ? 2 : g > 0.12 ? 1 : 0);
    const ribs = new Path2D();

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const a = at(i, j);
        if (i + 1 < cols) {
          const b = at(i + 1, j);
          const path = bins[binOf(Math.max(a.g, b.g))];
          path.moveTo(a.x, a.y);
          path.lineTo(b.x, b.y);
        }
        if (j + 1 < rows) {
          const b = at(i, j + 1);
          const path = bins[binOf(Math.max(a.g, b.g))];
          path.moveTo(a.x, a.y);
          path.lineTo(b.x, b.y);
        }
        if (i + 1 < cols && j + 1 < rows && (i + j) % 2 === 0) {
          const b = at(i + 1, j + 1);
          ribs.moveTo(a.x, a.y);
          ribs.lineTo(b.x, b.y);
        }
      }
    }

    ctx.globalAlpha = 1;
    ctx.strokeStyle = RIB;
    ctx.stroke(ribs);
    ctx.strokeStyle = INK;
    ctx.stroke(bins[0]);
    ctx.strokeStyle = CYAN;
    ctx.globalAlpha = 0.45;
    ctx.stroke(bins[1]);
    ctx.globalAlpha = 0.82;
    ctx.stroke(bins[2]);
    ctx.strokeStyle = BRASS;
    ctx.globalAlpha = 0.92;
    ctx.stroke(bins[3]);

    const marks = new Path2D();
    const step = coarse.matches ? 2 : 1;
    for (let j = 0; j < rows; j += step) {
      for (let i = 0; i < cols; i += step) {
        const p = at(i, j);
        const s = 2.1 + p.g * 2.2;
        marks.moveTo(p.x - s, p.y);
        marks.lineTo(p.x + s, p.y);
        marks.moveTo(p.x, p.y - s);
        marks.lineTo(p.x, p.y + s);
      }
    }
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = CYAN;
    ctx.stroke(marks);
    ctx.globalAlpha = 1;

    if (hudU && hudK && t - hudAt > 100) {
      hudAt = t;
      const z = 0.55 * pu * pv + amp * 0.34;
      hudU.textContent = `u ${pu.toFixed(2)}   v ${pv.toFixed(2)}`;
      hudK.textContent = `z ${z.toFixed(3)}`;
      if (hudN) hudN.textContent = `N ${cols * rows}`;
    }
  };

  const stop = () => {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };
  const frame = (now: number) => {
    raf = 0;
    draw(now);
    if (running) raf = requestAnimationFrame(frame);
  };
  const start = () => {
    if (reduce.matches) {
      draw(0);
      return;
    }
    if (!seen || document.hidden) return;
    running = true;
    if (!raf) raf = requestAnimationFrame(frame);
  };

  const aim = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    const nx = (clientX - rect.left) / Math.max(rect.width, 1);
    const ny = (clientY - rect.top) / Math.max(rect.height, 1);
    yawT = (nx - 0.62) * 0.85;
    pitchT = 0.58 + (ny - 0.45) * 0.32;
    puT = Math.max(-1, Math.min(1, nx * 2 - 1));
    pvT = Math.max(-1, Math.min(1, ny * 2 - 1));
    ampT = 1;
  };
  const rest = () => {
    yawT = 0.18;
    pitchT = 0.6;
    puT = 0;
    pvT = 0;
    ampT = 0;
  };

  if (!coarse.matches) {
    window.addEventListener('pointermove', (e) => {
      if (reduce.matches || e.pointerType === 'touch') return;
      aim(e.clientX, e.clientY);
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', rest);
  }

  const hero = canvas.closest('.hero') ?? canvas;
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      seen = entries.some((e) => e.isIntersecting);
      if (seen) start();
      else stop();
    }, { threshold: 0.02 });
    io.observe(hero);
  }

  resize();
  start();
  window.addEventListener('resize', () => { resize(); if (reduce.matches) draw(0); }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
  reduce.addEventListener('change', () => { rest(); stop(); start(); });
  coarse.addEventListener('change', () => { resize(); rest(); });
}
