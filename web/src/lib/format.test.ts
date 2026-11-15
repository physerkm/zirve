import { describe, expect, it } from 'vitest';
import { formatArguments, formatDuration, formatMinutes, formatOperations, formatRelative, formatValue, percent, tagLabel } from './format';
import { buildToc } from './toc';

describe('biçimlendirme yardımcıları', () => {
  it('fonksiyon argümanlarını parametre adlarıyla yazar', () => {
    const text = formatArguments(
      [[2, 7, 11, 15], 9],
      [
        { name: 'nums', type: 'int[]' },
        { name: 'target', type: 'int' },
      ],
    );

    expect(text).toBe('nums = [2, 7, 11, 15]\ntarget = 9');
  });

  it('sınıf işlemlerini kurucu ve metot çağrıları olarak yazar', () => {
    expect(formatOperations(['MinStack', 'push', 'getMin'], [[], [-2], []])).toBe('new MinStack()\n.push(-2)\n.getMin()');
  });

  it('eksik değeri çizgiyle, null değerini null olarak gösterir', () => {
    expect(formatValue(undefined)).toBe('—');
    expect(formatValue(null)).toBe('null');
    expect(formatValue(['a', 'b'])).toBe('["a", "b"]');
  });

  it('süreleri ve yüzdeleri biçimlendirir', () => {
    expect(formatMinutes(45)).toBe('45 dk');
    expect(formatMinutes(60)).toBe('1 sa');
    expect(formatMinutes(135)).toBe('2 sa 15 dk');
    expect(formatDuration(75)).toBe('01:15');
    expect(percent(1, 3)).toBe(33);
    expect(percent(0, 0)).toBe(0);
  });

  it('etiket slug\'larını okunur adlara çevirir', () => {
    expect(tagLabel('hash-tablosu')).toBe('Hash Tablosu');
    expect(tagLabel('bilinmeyen-etiket')).toBe('Bilinmeyen Etiket');
  });

  it('göreli zamanı Türkçe yazar', () => {
    const now = new Date('2026-11-15T12:00:00Z');

    expect(formatRelative('2026-11-15T11:59:50Z', now)).toBe('az önce');
    expect(formatRelative('2026-11-15T09:00:00Z', now)).toBe('3 saat önce');
    expect(formatRelative('2026-11-14T12:00:00Z', now)).toBe('dün');
  });
});

describe('içindekiler listesi', () => {
  it('yalnızca ikinci ve üçüncü düzey başlıkları alır, kod bloklarındakileri atlar', () => {
    const toc = buildToc(
      ['# Başlık', '## Giriş', 'metin', '```md', '## Kod içindeki başlık', '```', '### `async` ve **await**', '#### Çok derin'].join('\n'),
    );

    expect(toc).toEqual([
      { id: 'giriş', text: 'Giriş', depth: 2 },
      { id: 'async-ve-await', text: 'async ve await', depth: 3 },
    ]);
  });

  it('yinelenen başlıklara rehype-slug ile aynı biçimde sıra numarası ekler', () => {
    const toc = buildToc(['## Özet', '## Özet'].join('\n'));

    expect(toc.map((entry) => entry.id)).toEqual(['özet', 'özet-1']);
  });
});
