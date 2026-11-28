import { z } from 'astro/zod';
import raw from '../data/home.json';

/**
 * Homepage arrangement. Identity stays in site.json.
 * Project facts stay in the project collection. Publication records stay in the publication collection.
 * This file only chooses order, visibility, which IDs to feature, and homepage-only sentences.
 */
const link = z.object({ label: z.string().min(1), href: z.string().min(1) });

export const SECTION_IDS = ['hero', 'map', 'work', 'method', 'outputs', 'tools', 'about'] as const;
export type SectionId = (typeof SECTION_IDS)[number];

const Home = z
  .object({
    sections: z
      .array(z.object({ id: z.enum(SECTION_IDS), enabled: z.boolean() }))
      .refine((list) => new Set(list.map((s) => s.id)).size === list.length, 'Duplicate homepage section id'),
    featured: z
      .array(z.string().min(1))
      .min(1)
      .max(6)
      .refine((ids) => new Set(ids).size === ids.length, 'Duplicate featured project id'),
    publicationLimit: z.number().int().min(1).max(20),
    hero: z.object({
      kicker: z.string().min(1),
      headline: z.string().min(1),
      focus: z.string().min(1),
      primary: link,
      secondary: link,
      tertiary: link.optional(),
    }),
    map: z.object({
      heading: z.string().min(1),
      question: z.string().min(1),
      directions: z
        .array(
          z.object({
            id: z.string().min(1),
            index: z.string().min(1),
            title: z.string().min(1),
            summary: z.string().min(1),
            points: z.array(z.string().min(1)).min(2).max(6),
            project: z.string().min(1),
            diagram: z.enum(['hysteresis', 'shell']),
          }),
        )
        .length(2),
    }),
    work: z.object({ heading: z.string().min(1), lede: z.string().min(1) }),
    method: z.object({
      heading: z.string().min(1),
      intro: z.string().min(1),
      steps: z
        .array(z.object({ id: z.string().min(1), title: z.string().min(1), text: z.string().min(1) }))
        .min(3)
        .max(6),
    }),
    outputs: z.object({ heading: z.string().min(1), lede: z.string().min(1) }),
    tools: z.object({
      heading: z.string().min(1),
      lede: z.string().min(1),
      ids: z
        .array(z.string().min(1))
        .max(4)
        .refine((ids) => new Set(ids).size === ids.length, 'Duplicate tool project id'),
    }),
    about: z.object({ heading: z.string().min(1), lines: z.array(z.string().min(1)).min(1).max(4) }),
  })
  .strict();

export const home = Home.parse(raw);
export type HomeConfig = z.infer<typeof Home>;
