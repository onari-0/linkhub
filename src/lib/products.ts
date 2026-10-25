import type { Product } from './schema';

export function normalizeSearch(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('ko').trim().replace(/\s+/g, ' ');
}

export function filterProducts(items: Product[], query: string): Product[] {
  const tokens = normalizeSearch(query).split(' ').filter(Boolean);
  if (!tokens.length) return items;
  return items.filter(item => {
    const haystack = normalizeSearch([item.title, item.brand, item.description, ...item.keywords].filter(Boolean).join(' '));
    return tokens.every(token => haystack.includes(token));
  });
}
