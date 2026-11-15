import GithubSlugger from 'github-slugger';

export interface TocEntry {
  id: string;
  text: string;
  depth: 2 | 3;
}

/**
 * Markdown metnindeki ## ve ### başlıklarından içindekiler listesi üretir. Kimlikler, sayfadaki
 * başlıklara kimlik veren rehype-slug ile aynı algoritmayla (github-slugger) hesaplanır.
 */
export function buildToc(markdown: string): TocEntry[] {
  const slugger = new GithubSlugger();
  const entries: TocEntry[] = [];
  let inFence = false;

  for (const line of markdown.split('\n')) {
    if (line.trimStart().startsWith('```')) {
      inFence = !inFence;
      continue;
    }

    if (inFence) continue;

    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;

    // Satır içi biçimlendirmeyi at: rehype-slug kimliği başlığın düz metninden üretir.
    const text = match[2]
      .replace(/`([^`]*)`/g, '$1')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/(\*\*|__|\*|_|~~)/g, '');

    // Sıra önemli: slugger yinelenen başlıklara sırayla -1, -2 ekler; bu yüzden her başlık işlenmeli.
    const id = slugger.slug(text);
    const depth = match[1].length;

    if (depth === 2 || depth === 3) {
      entries.push({ id, text, depth });
    }
  }

  return entries;
}
