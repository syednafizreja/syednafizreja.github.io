# Editing the site

You can edit in two ways. Both end the same way: a commit to `main`, then the deploy workflow rebuilds the site in two or three minutes.

## 1. Dashboard (Pages CMS)

1. Go to https://app.pagescms.org and sign in with GitHub.
2. The first time only, install the Pages CMS GitHub app on `syednafizreja/syednafizreja.github.io`.
3. Open the repository. The menu shows **Projects**, **Publications**, **About page**, **Research statement** and **Site settings**.
4. Edit and press **Save**. Each save is one commit.

Images uploaded in the dashboard go to `src/assets/media/`. The site converts them to AVIF and WebP at several widths, so upload the largest PNG or JPG you have.

## 2. Files

| What | Where |
| --- | --- |
| Name, bio, "Now" line, links, featured projects | `src/data/site.json` |
| A project case study | `src/content/projects/<slug>.mdx` (the file name is the URL: `/work/<slug>/`) |
| A publication | `src/content/publications/NN-short-name.yaml` |
| About and research text | `src/content/pages/about.mdx`, `research.mdx` |
| Figures | `src/assets/media/<project>/` |
| Resume (CV) page | `src/pages/cv.astro` |
| Degrees, courses, languages, scholarship (shared by the Education and Resume pages) | `src/data/education.json` |
| Menu order (Home, Education, Projects, Research, About, Resume) | `src/components/Header.astro` |

### Adding a project

Copy an existing `.mdx` file, set `number` to the next free number, and keep the five headings in this order:

`## Question`, `## Approach`, `## Validation`, `## Findings in brief`, `## What this does not show`.

The new project appears by itself on `/work/`, in the Projects menu and in the tests on the next build.

The build fails if a required field is missing, the summary is over 300 characters, alt text is shorter than ten characters, or a method is not in the list in `src/lib/methods.ts`. That check is deliberate.

### Rules the content follows

- Every number comes from a repository, a report or a paper, and its source is named in `basis` or in the text.
- Findings stay general: no exact study results and no grades, GPA or averages on the site (the CV sent to professors carries them). The privacy test in `tests/site.spec.ts` checks for withheld numbers by hash; the comment there shows how to add one.
- No phone numbers or street addresses anywhere. Email stays split into `email_user` and `email_domain`; the page assembles it in the browser.
- The former employer is described only as "precision manufacturing".
- Set `draft: true` to keep a project off the site while you work on it.

## After changing the CV page

The PDF is generated from the web page, so regenerate it after edits:

```sh
npm run build
npm run cv:pdf      # writes public/cv/CV_Syed_Nafiz_Reja_Hasib.pdf
npm run og          # social cards, only needed if titles changed
npm run build
```

Commit the new files in `public/`.

## Code marks (Python style)

The site uses a small set of Python marks so the code look reads as one deliberate style. Each mark is a decorative `aria-hidden` span or CSS prompt, so screen readers skip it, and all of them are hidden in print.

- Small mono labels (hero marker, section indexes such as `01 · Projects`, page eyebrows): a leading `#` comment, written as `<span class="cm" aria-hidden="true">#</span>` at the start of the label.
- Hero typed line: the `>>>` interpreter prompt (CSS, `.rot-line::before`).
- 404 page: a short traceback ending in `FileNotFoundError`.

Keep headings, body text, the menu and the numbers band in plain English, with no brackets or other marks in the menu. Any full line of Python shown on the site must be valid Python.

## Colour

One hue: cyan in two depths (`--accent`, `--accent-ink`, `--accent-2` at the top of `global.css`), plus the neutral inks. Do not add a second hue or multi-colour gradients. The only exceptions are the green status dot and the blue-to-red colour scale of the 3D viewer, which is a data scale. Text must reach 4.5:1 against its background in both themes (3:1 for large text); borders of buttons and icons must reach 3:1 (`--rule-strong`). Check both themes after any colour change.

## Portrait

The About page photo is `src/assets/media/portrait.jpg` (4:5, 1200 × 1500 px). To change it, replace that file with a new 4:5 JPEG of the same name, with location data removed. The build makes the smaller AVIF and WebP copies.

## Local preview

```sh
npm ci
npm run dev         # http://localhost:4321
npm run build && npm run test:e2e   # accessibility and behaviour tests
```

## 3D viewer

The ShellForm viewer reads `src/assets/models/shellform-cell.json`, written by `tools/extract_shellform_cell.py` from the ShellForm results. To show other geometry as a `.glb`, see `tools/export_mesh.py`.
