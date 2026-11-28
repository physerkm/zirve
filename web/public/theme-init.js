// İlk boyamadan önce çalışır.
// Tema: kayıtlı tercih yoksa işletim sisteminin tercihi kullanılır.
// Dil: kayıtlı tercih yoksa tarayıcının dili Türkçeyse Türkçe, değilse İngilizce.
(function () {
  try {
    var stored = localStorage.getItem('zirve:theme');
    var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {
    document.documentElement.classList.add('dark');
  }

  var language = 'tr';
  try {
    // zirve:language programlama dili tercihidir (csharp, typescript…); arayüz dili zirve:locale'dadır.
    // İlk sürümde arayüz dili yanlışlıkla zirve:language'a yazılıyordu; oradaki tr/en değeri bir kez okunur.
    var storedLanguage = localStorage.getItem('zirve:locale') || localStorage.getItem('zirve:language');
    if (storedLanguage === 'tr' || storedLanguage === 'en') {
      language = storedLanguage;
    } else {
      var preferred = (navigator.languages && navigator.languages[0]) || navigator.language || 'tr';
      language = preferred.toLowerCase().indexOf('tr') === 0 ? 'tr' : 'en';
    }
  } catch (e) {
    // Varsayılan Türkçe kalır.
  }
  document.documentElement.lang = language;
})();
