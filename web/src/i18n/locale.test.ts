import { afterEach, describe, expect, it } from 'vitest';
import { getLocale, intlLocale, setLocale } from './locale';
import { currentMessages, defineMessages } from './messages';

const messages = defineMessages({
  tr: { greeting: 'Merhaba', count: (n: number) => `${n} ders` },
  en: { greeting: 'Hello', count: (n: number) => (n === 1 ? '1 lesson' : `${n} lessons`) },
});

describe('dil', () => {
  afterEach(() => setLocale('tr'));

  it('varsayılan dil Türkçedir', () => {
    document.documentElement.lang = '';
    expect(getLocale()).toBe('tr');
    expect(currentMessages(messages).greeting).toBe('Merhaba');
  });

  it('dil <html lang> üzerinde tutulur ve kaydedilir', () => {
    setLocale('en');

    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem('zirve:locale')).toBe('en');
    expect(intlLocale()).toBe('en-US');
    expect(currentMessages(messages).greeting).toBe('Hello');
    expect(currentMessages(messages).count(3)).toBe('3 lessons');
  });
});
