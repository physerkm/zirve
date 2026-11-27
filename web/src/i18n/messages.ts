import { getLocale, type Locale, useLocale } from './locale';

/**
 * Bir bileşenin iki dildeki metinleri. İngilizce sözlük Türkçeyle aynı biçimde olmak zorundadır
 * (eksik ya da fazla anahtar derleme hatasıdır). Değerler metin ya da metin döndüren fonksiyon olabilir:
 *
 * ```ts
 * const messages = defineMessages({
 *   tr: { title: 'Problemler', solved: (n: number) => `${n} çözüldü` },
 *   en: { title: 'Problems', solved: (n: number) => `${n} solved` },
 * });
 * const t = useMessages(messages);
 * ```
 */
export type Messages<T> = Record<Locale, T>;

export function defineMessages<T>(messages: { tr: T; en: NoInfer<T> }): Messages<T> {
  return messages;
}

/** Geçerli dilin metinlerini döndürür; dil değişince bileşen yeniden çizilir. */
export function useMessages<T>(messages: Messages<T>): T {
  return messages[useLocale()];
}

/** React dışında (ör. API istemcisi) geçerli dilin metinleri. */
export function currentMessages<T>(messages: Messages<T>): T {
  return messages[getLocale()];
}
