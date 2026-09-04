import { entryId, siteSections, writingsPerPage, type ContentCard, type SiteSection } from '../data/siteContent';

export type SearchEntry = {
  id: string;
  text: string;
  cardId: string;
  cardTitle: string;
  sectionId: 'projects' | 'writings';
  sectionTitle: string;
  cardPage: number;
  linkPage: number;
};

export type SearchResult =
  | { kind: 'entry'; id: string; entry: SearchEntry }
  | { kind: 'section'; id: string; section: SiteSection };

export type ParsedSearch = {
  query: string;
  section?: SiteSection;
  sectionQuery?: string;
};

export type SearchEnterAction = SearchResult | { kind: 'locate-section'; section: SiteSection };

// A section-only query goes to that section unless a button was explicitly selected.
export function getEnterAction(parsed: ParsedSearch, results: SearchResult[], activeIndex: number): SearchEnterAction | undefined {
  if (activeIndex >= 0 && results[activeIndex]) return results[activeIndex];
  if (parsed.section && !parsed.query) return { kind: 'locate-section', section: parsed.section };
  return results[0];
}

const normalize = (text: string) => text.normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');

export function createSearchEntries(projects: ContentCard[], writings: ContentCard[]): SearchEntry[] {
  return ([['projects', projects], ['writings', writings]] as const).flatMap(([sectionId, cards]) => (
    cards.flatMap((card, cardIndex) => card.links.map((link, linkIndex) => ({
      id: entryId(sectionId, card.id, link.id),
      text: link.text,
      cardId: card.id,
      cardTitle: card.title,
      sectionId,
      sectionTitle: sectionId === 'projects' ? 'Projects' : 'Writings',
      cardPage: sectionId === 'writings' ? Math.floor(cardIndex / writingsPerPage) : 0,
      linkPage: card.linksPerPage ? Math.floor(linkIndex / card.linksPerPage) : 0
    })))
  ));
}

export function parseSearchQuery(input: string, { requireSectionSeparator = false }: { requireSectionSeparator?: boolean } = {}): ParsedSearch {
  const prefix = /^\s*section\s*:\s*/i.exec(input);
  if (!prefix) return { query: input.trim() };

  const rest = input.slice(prefix[0].length);
  const wrapper = rest[0];
  const closer = wrapper === '{' ? '}' : wrapper;
  if (wrapper === '{' || wrapper === '"' || wrapper === "'") {
    const end = rest.indexOf(closer, 1);
    if (end === -1) return { query: '', sectionQuery: rest.slice(1).trim() };
    const name = rest.slice(1, end);
    const section = siteSections.find(item => normalize(item.title) === normalize(name));
    return section && (!requireSectionSeparator || /\s/.test(rest[end + 1] ?? ''))
      ? { section, query: rest.slice(end + 1).trim() }
      : { query: '', sectionQuery: name.trim() };
  }

  const section = [...siteSections].sort((a, b) => b.title.length - a.title.length).find(item => (
    (!requireSectionSeparator && rest.toLowerCase() === item.title.toLowerCase())
    || (rest.toLowerCase().startsWith(item.title.toLowerCase()) && /\s/.test(rest[item.title.length] ?? ''))
  ));
  return section
    ? { section, query: rest.slice(section.title.length).trim() }
    : { query: '', sectionQuery: rest.trim() };
}

// Match each typed fragment anywhere in the button label: "t ha" finds "Habit Hall".
function matchScore(label: string, query: string): number {
  const name = normalize(label);
  const search = normalize(query);
  if (!search) return 0;
  if (!search.split(' ').every(token => name.includes(token))) return -1;
  if (name === search) return 100;
  if (name.startsWith(search)) return 80;
  if (name.includes(search)) return 60;
  return 40;
}

export function getSearchResults(parsed: ParsedSearch, entries: SearchEntry[]): SearchResult[] {
  if (parsed.sectionQuery !== undefined) {
    return siteSections.filter(section => matchScore(section.title, parsed.sectionQuery ?? '') >= 0)
      .map(section => ({ kind: 'section', id: `search-section-${section.id}`, section }));
  }

  return entries.filter(entry => !parsed.section || entry.sectionId === parsed.section.id)
    .map(entry => ({ entry, score: matchScore(entry.text, parsed.query) }))
    .filter(item => item.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map(({ entry }) => ({ kind: 'entry', id: entry.id, entry }));
}
