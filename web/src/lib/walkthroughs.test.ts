import { describe, expect, it } from 'vitest';
import { hasWalkthrough, walkthroughFileUrl, walkthroughPath, walkthroughSlugs } from './walkthroughs';

// Dosyalar diskten Vite'ın glob içe aktarmasıyla okunur; anahtarlar dosya yollarıdır.
const pages = import.meta.glob<string>('../../public/walkthroughs/*/index.html', { query: '?raw', import: 'default', eager: true });
const scripts = import.meta.glob('../../public/walkthroughs/*/walkthrough.js', { query: '?url' });
const problems = import.meta.glob('../../../content/problems/*.md', { query: '?url' });

const folderOf = (path: string) => path.split('/').at(-2) ?? '';
const sorted = (values: readonly string[]) => [...values].sort();

describe('adım adım anlatımlar', () => {
  it('listedeki her anlatımın dosyaları public klasöründe bulunur ve fazladan klasör yoktur', () => {
    expect(sorted(Object.keys(pages).map(folderOf))).toEqual(sorted(walkthroughSlugs));
    expect(sorted(Object.keys(scripts).map(folderOf))).toEqual(sorted(walkthroughSlugs));
  });

  it('her anlatım var olan bir probleme aittir', () => {
    const problemSlugs = Object.keys(problems).map((path) => (path.split('/').at(-1) ?? '').replace(/^\d+-/, '').replace(/\.md$/, ''));

    expect(problemSlugs.length).toBeGreaterThan(0);
    for (const slug of walkthroughSlugs) {
      expect(problemSlugs, slug).toContain(slug);
    }
  });

  it('sayfalar satır içi betik içermez (script-src self politikasıyla çalışır)', () => {
    for (const [path, html] of Object.entries(pages)) {
      expect(html, path).toContain('<script src="walkthrough.js"></script>');
      expect(html.match(/<script/g), path).toHaveLength(1);
      expect(html, path).not.toMatch(/\son[a-z]+="/);
    }
  });

  it('adresleri üretir', () => {
    expect(hasWalkthrough('min-yigin')).toBe(true);
    expect(hasWalkthrough('olmayan-problem')).toBe(false);
    expect(walkthroughFileUrl('min-yigin')).toBe('/walkthroughs/min-yigin/index.html');
    expect(walkthroughPath('min-yigin')).toBe('/problems/min-yigin/adim-adim');
  });
});
