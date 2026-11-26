// @ts-check
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

/** @returns {import('astro').AstroIntegration} */
const assetVersion = () => ({
  name: 'asset-version-query',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      const stamp = '20261126';
      const walk = async (/** @type {string} */ dirPath) => {
        for (const ent of await readdir(dirPath, { withFileTypes: true })) {
          const filePath = join(dirPath, ent.name);
          if (ent.isDirectory()) await walk(filePath);
          else if (ent.name.endsWith('.html')) {
            const html = await readFile(filePath, 'utf8');
            const next = html.replace(
              /(<(?:link|script)\b[^>]*?\s(?:href|src)=")([^"]*\/_astro\/[^"?#]+)(")/g,
              `$1$2?v=${stamp}$3`,
            );
            if (next !== html) await writeFile(filePath, next);
          }
        }
      };
      await walk(fileURLToPath(dir));
    },
  },
});

export default defineConfig({
  site: 'https://syednafizreja.github.io',
  trailingSlash: 'ignore',
  build: { format: 'directory', inlineStylesheets: 'never' },
  integrations: [
    mdx(),
    sitemap({ filter: (page) => !page.includes('/og/') && !page.includes('/404') }),
    assetVersion(),
  ],
  image: { responsiveStyles: false },
  devToolbar: { enabled: false },
});
