# STRICT REPOSITORY SAFETY RULES FOR AI AGENTS
1. NEVER run `git push --force`, `git reset --hard`, or delete `src/components/`, `src/layouts/`, or `src/content/`.
2. NEVER modify `main` directly for large refactors. Create a branch (`git checkout -b feat/your-change`) first.
3. Before committing any change, `npm run check` and `npm run build` MUST pass with 0 errors.
4. Keep total tracked source files intact; never replace `Base.astro` or delete `.mdx`/`.yaml` data files.