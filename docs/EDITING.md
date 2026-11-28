# Editing the site

Two ways to edit. Both end as a commit to `main`. The deploy workflow rebuilds the site in two or three minutes.

## 1. Dashboard (Pages CMS)

1. Go to https://app.pagescms.org and sign in with GitHub.
2. The first time only, install the Pages CMS GitHub app on `syednafizreja/syednafizreja.github.io`.
3. Open the repository. The menu shows **Projects**, **Publications**, **About page**, **Research statement**, **Site settings**, and **Homepage**.
4. Edit and press **Save**. Each save is one commit.

Images uploaded in the dashboard go to `src/assets/media/`. The site converts them to AVIF and WebP at several widths, so upload the largest PNG or JPG you have.

The homepage form edits `src/data/home.json`. It does not store project findings or publication records. Those stay in the project and publication files.

## 2. Files

| What | Where |
| --- | --- |
| Name, job title, one-line identity, short bio, "Now" line, location, email, links, CV path | `src/data/site.json` |
| Homepage section order, which sections are on, featured project ids, tool ids, how many publications to show, homepage-only sentences | `src/data/home.json` |
| A project case study | `src/content/projects/<slug>.mdx` (the file name is the URL: `/work/<slug>/`) |
| A publication | `src/content/publications/NN-short-name.yaml` |
| About and research text | `src/content/pages/about.mdx`, `research.mdx` |
| Figures | `src/assets/media/<project>/` |
| Resume (CV) page | `src/pages/cv.astro` |
| Degrees, courses, languages, scholarship (shared by Education and the resume) | `src/data/education.json` |
| Menu (Work, Research, Publications, About, CV) | `src/components/Header.astro` |

### Name, headline, biography, links

In `src/data/site.json`:

- `name` is the name in the header, the footer, and the page titles.
- `job_title` is the small line under the name.
- `identity` is the one-line description used in search results and on the resume.
- `bio` is the short biography on the homepage About band and the resume.
- `currently` is the "Now" line.
- `location` is a region only. Never a street address.
- `email_user` and `email_domain` stay split. The page joins them in the browser.
- `orcid`, `github`, `linkedin`, `researchgate`, and `cv_pdf` are the public links.

The homepage headline and the research-focus sentence are not in `site.json`. They are `hero.headline` and `hero.focus` in `src/data/home.json`. A line break in `hero.headline` starts a new display line.

### Homepage sections

Open `src/data/home.json`. The `sections` array is the whole homepage.

- Reorder an item to move that block.
- Set `"enabled": false` to hide a block without deleting it.
- Leave the `id` as one of: `hero`, `map`, `work`, `method`, `outputs`, `tools`, `about`.

The page renders only those ids, in that order. An unknown id fails the build.

`featured` is a list of project file names, without `.mdx`, in the order they should appear. Four to six is the intended range. The card text, image, methods, and links come from the project file. Do not copy findings into `home.json`.

`tools.ids` is the same kind of list, for the tools block. A tool needs `evidence.live` on its project if the "Open the tool" button should appear.

`publicationLimit` is how many publication records, by `order`, appear on the homepage. The publications page always shows the full collection.

The other objects (`hero`, `map`, `work`, `method`, `outputs`, `tools`, `about`) are sentences that exist only on the homepage. The two direction cards point at project ids. They do not repeat the project numbers.

### Feature or unfeature a project

Add or remove its id in `featured` in `src/data/home.json`. The project remains on `/work/` either way.

### Add a project

Copy an existing `.mdx` file. Set `number` to the next free three-digit number. The file name is the URL.

The case-study body used by the current studies is three headings, in this order:

`## Method`, `## Key result`, `## Open limit`.

Keep the result and the limit specific. A negative or mixed result stays in **Key result**.

Optional fields:

- `brief.finding`, `brief.limit`, `brief.next` are the short method, result, and open limit used when a card asks for them.
- `card_links` are the code, dataset, or tool links.
- `exhibit` is an optional calculated figure. The homepage uses it instead of the hero image when it is present.
- `draft: true` hides the project from the site.

The new project appears on `/work/` on the next build. It appears on the homepage only if its id is in `featured`.

The build fails if a required field is missing, the summary is over 300 characters, alt text is shorter than ten characters, or a method is not in `src/lib/methods.ts`.

### Publication status

Edit the YAML file. Set `status` to exactly one of:

- `published`
- `submitted`
- `under-review`
- `with-editor`
- `preprint`
- `in-preparation`

`with-editor` is not published. A Zenodo or other dataset DOI on a manuscript is shown as **Dataset**. A DOI on a published paper or a preprint is shown as **DOI**.

`order` controls the list. Lower numbers come first. The homepage shows the first `publicationLimit` records in that order, then groups them by status.

`scope` is the verification record. It stays behind a disclosure. Do not put a claim there that is not already in the paper or the repository.

### About and research

`src/content/pages/about.mdx` is the About page essay. `src/content/pages/research.mdx` is the research statement. The homepage About band uses `bio` from `site.json` plus `about.lines` in `home.json`.

Keep the two research directions and the qualified findings. Do not turn a trade-off into a single improvement.

### Images

Project figures live in `src/assets/media/<project>/`. Point `hero.src`, `gallery`, or `exhibit.src` at the file. Alt text describes what the figure shows and is at least ten characters.

The About portrait is `src/assets/media/portrait.jpg` (4:5, 1200 × 1500 px). Replace that file with a new 4:5 JPEG of the same name, with location data removed.

Calculated plots stay labelled as results. Diagrams drawn in the page are labelled "Diagram, not a calculated result." Do not add a decorative plot that looks like a new analysis.

### CV and education

Degrees, courses, languages, and the scholarship live in `src/data/education.json`. The Education page and the resume both read that file.

The resume narrative is `src/pages/cv.astro`. Do not add grades, a GPA, a street address, a phone number, or the former employer's name. The employer stays "precision manufacturing".

After a resume edit, regenerate the PDF:

```sh
npm run build
npm run cv:pdf
npm run og
npm run build
```

Commit the new files in `public/`.

### Preview and deploy

```sh
npm ci
npm run dev
npm run check
npm run build
npm run links
npm run test:e2e
```

`npm run dev` serves http://localhost:4321. A commit to `main` deploys. Do not force-push.

### Colour

The site is dark only. The ground is `#080A0E`. Cyan is the accent. Brass is for a status that needs a second meaning, such as "with the editor", and for the research-focus label. Do not add a purple gradient or a second theme. Text must reach 4.5:1 against its background. Large text may use 3:1. The blue-to-red scale in the 3D viewer is a data scale.

### Code marks

Small mono labels may start with a decorative `#`, written as `<span class="cm" aria-hidden="true">#</span>`. The 404 page keeps a short Python traceback ending in `FileNotFoundError`. Headings and body text stay in plain English. Any full line of Python on the site must be valid Python.

### 3D viewer

The ShellForm viewer reads `src/assets/models/shellform-cell.json`, written by `tools/extract_shellform_cell.py`. It loads Three.js only after a click. The fallback image stays in place until then.

### Rules the content follows

- Every number comes from a repository, a report, or a paper, and its source is named in `basis` or in the text.
- Grades, GPA, and averages stay off the site. The privacy test in `tests/site.spec.ts` rejects withheld tokens. The comment in the test shows how to add a hash.
- No phone numbers or street addresses. Email stays split.
- The former employer is described only as "precision manufacturing".
- Numerical verification is not full-scale experimental validation. Say which one a result is.
- ShellBench's whole-building carbon reduction is not the floor-only reduction.
- A NiTi reduction in residual drift is not a reduction in peak drift or carbon.
