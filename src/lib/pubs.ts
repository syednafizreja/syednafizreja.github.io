import type { CollectionEntry } from 'astro:content';

export type Pub = CollectionEntry<'publications'>;

/** Status groups. Every schema status belongs to one group, so a record cannot disappear from the list. */
export const PUB_GROUPS = [
  {
    id: 'submitted',
    title: 'Submitted manuscripts',
    match: (status: string) => status === 'submitted' || status === 'under-review' || status === 'with-editor',
  },
  {
    id: 'preprints',
    title: 'Preprints',
    match: (status: string) => status === 'preprint',
  },
  {
    id: 'journal',
    title: 'Peer-reviewed articles',
    match: (status: string) => status === 'published',
  },
  {
    id: 'preparing',
    title: 'In preparation',
    match: (status: string) => status === 'in-preparation',
  },
] as const;

export const byOrder = (pubs: Pub[]) => [...pubs].sort((a, b) => a.data.order - b.data.order);

export const groupPubs = (pubs: Pub[]) =>
  PUB_GROUPS.map((group) => ({
    ...group,
    items: pubs.filter((p) => group.match(p.data.status)),
  })).filter((group) => group.items.length > 0);
