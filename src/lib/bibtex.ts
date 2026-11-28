import type { CollectionEntry } from 'astro:content';

type Pub = CollectionEntry<'publications'>['data'];

const esc = (s: string) => s.replace(/[{}]/g, '').replace(/&/g, '\\&').replace(/–/g, '--');

/** BibTeX generated from the structured fields, so it can never drift from the list. */
export function toBibtex(p: Pub, id: string): string {
  if (p.bibtex) return p.bibtex.trim();
  const first = p.authors[0].split(',')[0].toLowerCase().replace(/[^a-z]/g, '');
  const word = p.title.toLowerCase().split(/\s+/).find((w) => w.length > 3)?.replace(/[^a-z]/g, '') ?? 'x';
  const key = `${first}${p.year ?? 'nd'}${word}`;
  const fields: [string, string | number | undefined][] = [
    ['author', p.authors.join(' and ')],
    ['title', `{${p.title}}`],
  ];
  let type = 'misc';
  if (p.type === 'journal') {
    type = 'article';
    fields.push(['journal', p.venue], ['year', p.year], ['volume', p.volume], ['number', p.issue], ['pages', p.pages]);
  } else if (p.type === 'manuscript') {
    type = 'unpublished';
    const status =
      p.status === 'with-editor'
        ? `With the editor${p.venue ? `, ${p.venue}` : ''}`
        : p.status === 'under-review'
          ? `Under review${p.venue ? `, ${p.venue}` : ''}`
          : p.status === 'submitted'
            ? `Submitted${p.venue ? `, ${p.venue}` : ''}`
            : 'In preparation';
    fields.push(['note', p.note ? `${status}. ${p.note}` : status], ['year', p.year]);
  } else {
    fields.push(['howpublished', p.venue || undefined], ['note', 'Technical report'], ['year', p.year]);
  }
  fields.push(['doi', p.doi], ['url', p.url]);
  const body = fields
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `  ${k.padEnd(12)} = {${esc(String(v))}}`)
    .join(',\n');
  void id;
  return `@${type}{${key},\n${body}\n}`;
}
