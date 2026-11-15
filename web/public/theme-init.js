// İlk boyamadan önce çalışır: kayıtlı tercih yoksa işletim sisteminin tercihi kullanılır.
(function () {
  try {
    var stored = localStorage.getItem('zirve:theme');
    var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
