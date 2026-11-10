# Site log

## 2026-11-10: redesign

The author asked for a more modern, technical look (reference sites: yasio.dev, swkang73.github.io, the CodersRank list of developer sites, and the Bespoke Careers architecture-portfolio advice). Content is unchanged apart from two whitespace fixes.

### Decisions

- Dark by default (near-black blue `#070a12`, cyan and violet accents). The OS colour scheme is ignored; a light theme stays one click away on the toggle and is remembered. Light is a cool grey-white, not cream.
- Type: Geist and Geist Mono (variable, self-hosted through Fontsource). Newsreader, Inter and IBM Plex Mono are removed.
- Home hero: the real ShellForm design cell (same JSON as the 3D viewer) drawn as a turning wireframe on a 2D canvas with a drawing title block (span, supports, rise/span, Sa, thickness, governing check). No three.js on load. The canvas is `aria-hidden`, capped at 1.5x pixel density, pauses off screen and in hidden tabs, starts 1.2 s after load, draws about 30 frames a second in six batched strokes, and shows one still frame under reduced motion. The heading stays the largest paint.
- Numbers on the home page are only those already on the site: 168 shells, 79 of 84 pairs, the project count and the publication count.
- Header: sticky glass bar with numbered navigation (01 to 05) and a Contact pill; on phones the navigation becomes a second row and fits five items at 390 px.
- Projects are cards with a thumbnail on a light plate (figures are never inverted), status, tags and a gradient edge on hover.
- Every page except Contact ends with a "Get in touch" band (email, CV, contact page).
- Scroll reveal only for content below the first screen, only after the script runs, and never under reduced motion; print forces everything visible.
- The print layer is kept, so the CV PDF is still black on white.
- The status-dot pulse animates transform and opacity only, so it does not repaint on the main thread.
- The background grid fades through a paper-coloured overlay rather than a CSS mask, and the header blur applies only on fine pointers (desktop); phones get a near-opaque bar. Both cut raster work, which was the cause of slow first renders in headless tests.
- The hero canvas sizes and draws its still frame from a ResizeObserver, after first paint, not during script evaluation.

### Checks

- `astro check`: 0 errors, 0 warnings, 0 hints. Build: 27 pages.
- Playwright and axe (WCAG 2.1 A and AA), 10 pages in both themes, plus behaviour tests: all 27 pass. The axe tests now pick the theme through `localStorage`, the way a reader does.
- Screenshots checked at 1280 and 390 px in both themes: full pages for home, work, ShellForm case study, about, publications and CV; first screen for home, research and contact after the performance changes.
- CV PDF regenerated (3 pages); text search for the private strings returns nothing.
- Lighthouse 12 (mobile, simulated), local preview, which is noisy on this machine: accessibility, best practices and SEO 100 on `/` and `/work/shellform/`. Performance on `/` after the raster fixes: 77, 98, 98, 95 (median 96; the first run is a cold start). `/work/shellform/`: 100 on most runs, one run 76. The previous design scored 96 to 99 on the live site.
- Lighthouse 12 (mobile, simulated), live site after deployment, 10 Nov 2026, three runs each: `/` performance 95, 84, 98 (median 95); `/work/shellform/` 88, 100, 100 (median 100). Accessibility, best practices and SEO 100 on every run. LCP 1.0 to 1.7 s; total blocking time varied from 12 to 650 ms between runs on this machine.

## 2026-11-10: first release

Built from the plan in `16_Personal_Website_Plan_and_Master_Prompt.md`.

### Decisions

- Astro 7 static site, GitHub Pages through Actions, Pages CMS for editing. No third-party CDN at run time (fonts self-hosted), so the site loads in mainland China.
- This repository is the user site, served at the root `https://syednafizreja.github.io/`. The canopy prototype stays a project site at `/parametric-canopy-carbon-optimization/`, served from its own repository. GitHub serves project sites under the user domain, so both work; this repository must never contain a top-level folder or route with that name.
- three.js loads only when a reader presses "Rotate in 3D" on the viewer; until then the page shows a still render of the same model. Loading it on scroll cost about 0.8 s of blocking time on mobile and captured touch scrolling. Pages ship about 2 KB of JavaScript before that.
- Newsreader uses the weight-only variable files (58 KB instead of 132 KB per style), and the 6 KB stylesheet is inlined, which removes the only render-blocking request.
- The viewer shows one real ShellForm design cell (`tools/extract_shellform_cell.py`). In that cell no node drops (height change 0 to 349 mm), and the caption says so. A still render is the fallback without WebGL.
- The former employer is not named; the CV page says "precision manufacturing" and omits process details.
- References on the CV page read "Available on request". No phone numbers or street addresses anywhere.
- Email is assembled in the browser from two parts, with a plain "name [at] domain" fallback.
- Filters on `/work/` use `aria-current` (not `aria-pressed`, which is invalid on links).
- Back-to-top button with a scroll-progress ring appears after one and a fifth screens of scrolling; it respects reduced motion and is hidden in print.
- The CV PDF is printed from `/cv/` (A4, 14 mm margins) with links rewritten to the live domain.

### Checks at release

- `astro check`: 0 errors, 0 warnings, 0 hints.
- Internal links (linkinator): all OK.
- Playwright and axe (WCAG 2.1 A and AA) on 10 pages in light and dark themes, plus behaviour tests: all 27 pass.
- Lighthouse 12 (mobile, simulated throttling), live site, 10 Nov 2026: performance 100 on `/`, `/work/shellform/` and `/cv/`, 95 on `/publications/`. Accessibility, best practices and SEO scored 100 on the pages checked before the viewer change.
- External links: both Zenodo DOIs return 403 to link checkers (Zenodo blocks bots); the DOI handle API confirms both are registered.

### Checked by Claude, author to confirm

- Hero title block (redesign): span 20 m, corner supports, rise/span 0.20, Sa 0.6 g, thickness 185 mm, governed by buckling. Every value is read from `src/assets/models/shellform-cell.json` (cell L20-corners-r0.20-seismic-sa0.6), which `tools/extract_shellform_cell.py` takes from ShellForm v0.1.0 explorer data, freeze tag freeze-2026-11-09, commit fd5cc85.
- All CV facts on `/about/` and `/cv/` were copied from `CV_Syed_Nafiz_Reja_Hasib.pdf` (Nov 2026).
- Publication [5] (PaveCarbon paper) is shown as "in preparation, submission planned November 2026", as in the CV. Confirmed by the author on 10 Nov 2026 ("approve all"). Update when submitted.
- ShellBench test count: the CV says 114, the repository reported 238 passed on 10 Nov 2026. The CV page gives no count; the project page uses the repository figure.

### Headshot (10 Nov 2026)

- The author supplied a portrait in `_inbox/`. It was cropped to 4:5 head and shoulders, EXIF stripped, saved as `src/assets/media/portrait.jpg`, and shown on `/about/` (AVIF and WebP, 320 and 640 px). A 640 px JPEG is the `image` in the Person JSON-LD.
- Playwright now serves on `127.0.0.1` with `--force`: the local sandbox refused connections to `astro preview` on `localhost`.

### TODO(syed)

- Install the Pages CMS GitHub app on this repository (https://app.pagescms.org) to use the dashboard.
- Two projects from the plan are not on the site yet: stress-trajectory ribs and diaphragm flexibility. Add them when there is material to show.
- Add `https://syednafizreja.github.io` to the CV PDF source, LinkedIn and ORCID. The repository homepage and the GitHub profile website field were both set on 10 Nov 2026.
