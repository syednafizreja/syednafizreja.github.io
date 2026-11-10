// three.js viewer for one ShellForm cell. Loaded on demand by ShellViewer.astro.
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import cell from '../assets/models/shellform-cell.json';

// ColorBrewer RdBu (11), reversed so negative = blue, positive = red.
const RAMP = ['#053061', '#2166ac', '#4393c3', '#92c5de', '#d1e5f0', '#f7f7f7', '#fddbc7', '#f4a582', '#d6604d', '#b2182b', '#67001f']
  .map((h) => new Color(h));

function diverging(t: number, out: Color) {
  const x = Math.min(1, Math.max(0, (t + 1) / 2)) * (RAMP.length - 1);
  const i = Math.min(RAMP.length - 2, Math.floor(x));
  return out.copy(RAMP[i]).lerp(RAMP[i + 1], x - i);
}

export function mount(host: HTMLElement) {
  const n = cell.n;
  const xyz = cell.nodes as number[];
  const dz = cell.dz_mm as number[];
  const lim = cell.dz_limit_mm;

  // Centre in plan; three.js is y-up, the data is z-up.
  let cx = 0, cy = 0;
  for (let i = 0; i < n * n; i++) { cx += xyz[3 * i]; cy += xyz[3 * i + 1]; }
  cx /= n * n; cy /= n * n;
  const pos = new Float32Array(n * n * 3);
  const col = new Float32Array(n * n * 3);
  const c = new Color();
  for (let i = 0; i < n * n; i++) {
    pos[3 * i] = xyz[3 * i] - cx;
    pos[3 * i + 1] = xyz[3 * i + 2];
    pos[3 * i + 2] = -(xyz[3 * i + 1] - cy);
    diverging(dz[i] / lim, c);
    col[3 * i] = c.r; col[3 * i + 1] = c.g; col[3 * i + 2] = c.b;
  }
  const idx: number[] = [];
  const lines: number[] = [];
  for (let j = 0; j < n - 1; j++) {
    for (let i = 0; i < n - 1; i++) {
      const a = j * n + i, b = a + 1, d = a + n, e = d + 1;
      idx.push(a, b, e, a, e, d);
    }
  }
  for (let j = 0; j < n; j++) for (let i = 0; i < n - 1; i++) lines.push(j * n + i, j * n + i + 1);
  for (let i = 0; i < n; i++) for (let j = 0; j < n - 1; j++) lines.push(j * n + i, (j + 1) * n + i);

  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('color', new BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();

  const scene = new Scene();
  const shell = new Mesh(geo, new MeshStandardMaterial({ vertexColors: true, side: DoubleSide, roughness: 0.75, metalness: 0 }));
  scene.add(shell);

  const lgeo = new BufferGeometry();
  lgeo.setAttribute('position', new BufferAttribute(pos.map((v, k) => (k % 3 === 1 ? v + 0.01 : v)), 3));
  lgeo.setIndex(lines);
  const lineMat = new LineBasicMaterial({ transparent: true, opacity: 0.22 });
  scene.add(new LineSegments(lgeo, lineMat));

  // Corner supports.
  const supMat = new MeshStandardMaterial({ color: 0x1c1a16 });
  for (const k of [0, n - 1, n * (n - 1), n * n - 1]) {
    const s = new Mesh(new SphereGeometry(0.22, 16, 12), supMat);
    s.position.set(pos[3 * k], pos[3 * k + 1], pos[3 * k + 2]);
    scene.add(s);
  }

  scene.add(new HemisphereLight(0xffffff, 0x8a8170, 1.6));
  const sun = new DirectionalLight(0xffffff, 1.5);
  sun.position.set(-8, 14, 10);
  scene.add(sun);

  const span = cell.span_m;
  const camera = new PerspectiveCamera(32, 16 / 10, 0.1, 500);
  const home = new Vector3(span * 1.3, span * 0.68, span * 1.3);
  const target = new Vector3(0, span * cell.rise_ratio * 0.15, 0);
  camera.position.copy(home);

  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', host.querySelector('img')?.getAttribute('alt') ?? 'Interactive 3D shell');
  host.prepend(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(target);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = span * 0.6;
  controls.maxDistance = span * 4;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.update();

  const theme = () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    lineMat.color.set(dark ? 0xebe6dc : 0x1c1a16);
    lineMat.opacity = dark ? 0.22 : 0.32;
    supMat.color.set(dark ? 0xebe6dc : 0x1c1a16);
  };
  theme();

  let raf = 0;
  const render = () => { raf = 0; if (controls.update()) request(); renderer.render(scene, camera); };
  const request = () => { if (!raf) raf = requestAnimationFrame(render); };
  controls.addEventListener('change', request);
  window.addEventListener('themechange', () => { theme(); request(); });

  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    request();
  };
  new ResizeObserver(resize).observe(host);
  resize();

  const reset = host.querySelector<HTMLButtonElement>('[data-reset]');
  if (reset) {
    reset.hidden = false;
    reset.addEventListener('click', () => {
      camera.position.copy(home);
      controls.target.copy(target);
      controls.update();
      request();
    });
  }
  const hint = host.querySelector<HTMLElement>('[data-hint]');
  if (hint) hint.hidden = false;
  host.dataset.ready = 'true';
  request();
}
