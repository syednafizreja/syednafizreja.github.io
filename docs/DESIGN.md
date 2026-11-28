# Design note

The site is a personal computational research studio. The visual base is the existing obsidian ground (`#080A0E`), cyan for the working accent, and brass only where a second meaning is needed. Type is Plus Jakarta Sans for display, Inter for reading, and JetBrains Mono for coordinates, status, and metadata.

The homepage is not one template. `src/data/home.json` lists the sections. `src/pages/index.astro` renders the matching component from `src/components/home/`. Project cards read the project collection. Publication rows read the publication collection. There is no second database of findings.

The hero mesh is a sketch of a hyperbolic paraboloid. The page says so. It is not a project result. ShellForm's viewer still loads only on request.

Diagrams in the research map are labelled as diagrams. Calculated figures come from `src/assets/`.

Routes are unchanged. The menu points at Work, Research, Publications, About, and CV. Contact stays a button. Education is linked from the About band, the About page, and the footer.
