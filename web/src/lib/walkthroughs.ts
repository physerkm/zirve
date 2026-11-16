// Adım adım anlatımlar: çözümün her satırını kendi örneklerinizle izleyebildiğiniz etkileşimli sayfalar.
// Her biri public/walkthroughs/{slug}/ altında kendi başına duran statik bir sayfadır; yeni bir anlatım
// eklerken klasörü oluşturun ve problemin slug'ını bu listeye yazın (walkthroughs.test.ts ikisini karşılaştırır).
const slugs: ReadonlySet<string> = new Set([
  'bagli-listelerle-toplama',
  'bagli-listeyi-ters-cevir',
  'eksik-sayi',
  'en-uzun-ardisik-dizi',
  'gecerli-parantezler',
  'kayip-sayilar',
  'kelimeleri-ters-cevir',
  'kendisi-haric-carpim',
  'matriste-arama',
  'merdiven-tirmanma',
  'min-yigin',
  'permutasyonlar',
  'renkleri-sirala',
  'ziplama-oyunu',
]);

export const walkthroughSlugs: readonly string[] = [...slugs];

export const hasWalkthrough = (problemSlug: string): boolean => slugs.has(problemSlug);

/** Anlatımın statik dosyasının adresi (çerçevede gösterilir). */
export const walkthroughFileUrl = (problemSlug: string): string => `/walkthroughs/${problemSlug}/index.html`;

/** Anlatımın Zirve içindeki sayfası. */
export const walkthroughPath = (problemSlug: string): string => `/problems/${problemSlug}/adim-adim`;
