import { z } from 'astro/zod';
import raw from '../data/site.json';

const Site = z.object({
  name: z.string(),
  short_name: z.string(),
  job_title: z.string(),
  identity: z.string(),
  bio: z.string(),
  currently: z.string(),
  location: z.string(),
  email_user: z.string(),
  email_domain: z.string(),
  orcid: z.string().regex(/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/),
  github: z.string(),
  linkedin: z.url(),
  researchgate: z.url(),
  cv_pdf: z.string(),
  accent: z.enum(['oxide', 'cobalt', 'moss']),
});

/** Site settings, validated at build time. Edited through Pages CMS ("Site settings"). */
export const site = Site.parse(raw);

export const links = {
  orcid: `https://orcid.org/${site.orcid}`,
  github: `https://github.com/${site.github}`,
  linkedin: site.linkedin,
  researchgate: site.researchgate,
};

export const STATUS_LABEL = {
  'in-progress': 'In progress',
  complete: 'Complete',
  archived: 'Archived',
} as const;

export const PUB_STATUS_LABEL = {
  published: 'Published',
  submitted: 'Submitted',
  'under-review': 'Under review',
  'with-editor': 'With the editor',
  'in-preparation': 'In preparation',
  preprint: 'Preprint',
} as const;

export const pubBadge = (status: string) => PUB_STATUS_LABEL[status as keyof typeof PUB_STATUS_LABEL] ?? status;

export const doiUrl = (doi: string) => `https://doi.org/${doi}`;
