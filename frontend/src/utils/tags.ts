export function parseTags(value: string | string[] | null | undefined): string[] {
  const source = Array.isArray(value) ? value : value ? [value] : [];
  const tags: string[] = [];

  for (const item of source) {
    for (const piece of String(item).split(',')) {
      const tag = piece.trim().replace(/^#+/, '');
      if (!tag || tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
        continue;
      }
      tags.push(tag);
    }
  }

  return tags;
}
