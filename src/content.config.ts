import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

import { METHODS } from './lib/methods';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      number: z.string().regex(/^\d{3}$/, 'Three digits, e.g. 001'),
      title: z.string(),
      short_title: z.string(),
      year: z.string(),
      sort_date: z.coerce.date(),
      status: z.enum(['in-progress', 'complete', 'archived']),
      summary: z.string().max(300),
      methods: z.array(z.enum(METHODS)).min(1),
      tools: z.array(z.string()).default([]),
      hero: z.object({ src: image(), alt: z.string().min(10), caption: z.string() }),
      exhibit: z.object({ src: image(), alt: z.string().min(10) }).optional(),
      gallery: z.array(z.object({ src: image(), alt: z.string().min(10), caption: z.string() })).default([]),
      key_numbers: z
        .array(z.object({ label: z.string(), value: z.string(), unit: z.string().default(''), basis: z.string().default('') }))
        .default([]),
      numbers_note: z.string().optional(),
      validation: z.object({ benchmark: z.string(), metric: z.string(), value: z.string() }).optional(),
      evidence: z
        .object({
          repo: z.url().optional(),
          tag: z.string().optional(),
          doi: z.string().optional(),
          report: z.url().optional(),
          live: z.url().optional(),
          tests: z.string().optional(),
          licence: z.string().optional(),
        })
        .default({}),
      related: z.array(z.string()).default([]),
      card_links: z.array(z.object({ label: z.string(), href: z.url() })).default([]),
      brief: z
        .object({
          finding: z.string(),
          limit: z.string(),
          next: z.string(),
        })
        .optional(),
      draft: z.boolean().default(false),
    }),
});

const publications = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/content/publications' }),
  schema: z.object({
    title: z.string(),
    authors: z.array(z.string()).min(1),
    owner_index: z.number().int().min(1),
    venue: z.string().default(''),
    year: z.number().int().optional(),
    volume: z.string().optional(),
    issue: z.string().optional(),
    pages: z.string().optional(),
    doi: z.string().optional(),
    url: z.url().optional(),
    status: z.enum(['published', 'submitted', 'under-review', 'in-preparation', 'preprint']),
    type: z.enum(['journal', 'manuscript', 'report']),
    note: z.string().optional(),
    project: z.string().optional(),
    bibtex: z.string().optional(),
    order: z.number().default(0),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/pages' }),
  schema: z.object({ title: z.string(), description: z.string() }),
});

export const collections = { projects, publications, pages };
