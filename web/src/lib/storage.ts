// localStorage erişimi gizli modda ya da kota dolduğunda hata fırlatabilir; bu yardımcılar
// uygulamanın bu durumlarda da çalışmayı sürdürmesini sağlar.

const PREFIX = 'zirve:';

export function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(PREFIX + key, value);
  } catch {
    // Kaydedilemedi; oturum boyunca bellekteki değerle devam edilir.
  }
}

export function removeStorage(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // yoksay
  }
}
