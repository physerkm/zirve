(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_LEN = 30;

  // The pieces s.Split(' ') makes before empty ones are removed:
  // every space ends a piece, and whatever follows the last space is the final piece.
  function pieces(s) {
    const out = [];
    let start = 0;
    for (let k = 0; k <= s.length; k++) {
      if (k === s.length || s[k] === ' ') {
        out.push({ start, end: k, sep: k < s.length ? k : -1, text: s.slice(start, k) });
        start = k + 1;
      }
    }
    return out;
  }

  // Steps: Split piece by piece, then Array.Reverse swap by swap, then string.Join word by word.
  // sState: how to draw s (null = plain); marks: word index -> state; ij: the counters inside Array.Reverse.
  function buildSteps(s) {
    const n = s.length;
    const steps = [];
    let words = [];
    let wordsLen;
    let result = null;
    let i;
    let j;
    const snap = (o) => steps.push({
      words: words.slice(), wordsLen, result, i, j, sState: null, marks: {}, ij: null,
      fresh: 0, done: false, changed: [], lines: [], ...o,
    });
    const q = (w) => `<code>"${w}"</code>`;

    snap({
      kind: 'start',
      text: `<code>s</code> ${n} karakter; boşlukları <b>·</b> ile gösteriyoruz. Kelimelerin sırasını ters çevireceğiz, kelimelerin içindeki harfler aynı kalacak. Fazla boşluklar da gidecek.`,
    });

    // 1. Split
    let skipped = 0;
    for (const p of pieces(s)) {
      const sState = { doneTo: p.start, piece: p.text ? [p.start, p.end] : null, cut: p.sep, skip: !p.text };
      let text;
      const marks = {};
      if (p.text) {
        words.push(p.text);
        marks[words.length - 1] = 'new';
        text = (p.sep >= 0
          ? `<code>Split</code> soldan okuyor ve bir sonraki boşlukta (index ${p.sep}) kesiyor. Parça: ${q(p.text)}.`
          : `Başka boşluk yok; metnin sonuna kadar olan parça: ${q(p.text)}.`) +
          ' Boş değil, <code>words</code> dizisine eklendi.';
      } else {
        skipped++;
        if (p.sep === 0) {
          text = 'Metin boşlukla başlıyor: ilk boşluktan (index 0) önce hiç karakter yok, parça <code>""</code>, yani boş. <code>RemoveEmptyEntries</code> boş parçaları atıyor.';
        } else if (p.sep > 0) {
          text = `Bu boşluk (index ${p.sep}) bir öncekinin hemen arkasında: aradaki parça <code>""</code>, yani boş. <code>RemoveEmptyEntries</code> sayesinde atlandı.`;
        } else {
          text = 'Metin boşlukla bitiyor: son boşluktan sonra hiç karakter yok, son parça <code>""</code>. Bu da atlandı.';
        }
      }
      snap({ kind: 'split', lines: ['split'], sState, marks, text });
    }

    const m = words.length;
    wordsLen = m;
    snap({
      kind: 'splitDone', lines: ['split'], changed: ['len'], sState: { doneTo: n },
      text: `<code>Split</code> bitti: <code>words</code> dizisinde ${m} kelime var. ` +
        (skipped ? `${skipped} boş parça atıldı, hiçbiri diziye girmedi.` : 'Hiç boş parça çıkmadı.'),
    });

    // 2. Array.Reverse
    i = 0;
    j = m - 1;
    if (m > 1) {
      snap({
        kind: 'revStart', lines: ['rev'], changed: ['i', 'j'], ij: true, sState: { doneTo: n },
        text: `<code>Array.Reverse(words)</code> iki uçtan başlıyor: <code>i = 0</code> ilk kelimeyi, <code>j = ${j}</code> son kelimeyi gösteriyor. Ortada buluşana kadar yer değiştirecekler.`,
      });
    }
    while (i < j) {
      const [a, b] = [words[i], words[j]];
      [words[i], words[j]] = [words[j], words[i]];
      snap({
        kind: 'swap', lines: ['rev'], ij: true, sState: { doneTo: n }, marks: { [i]: 'swap', [j]: 'swap' },
        text: `<code>words[${i}]</code> (${q(a)}) ile <code>words[${j}]</code> (${q(b)}) yer değiştirdi. Sonra <code>i</code> bir sağa, <code>j</code> bir sola geçiyor.`,
      });
      i++;
      j--;
    }
    let revText;
    const revMarks = {};
    if (m === 1) {
      revText = '<code>Array.Reverse(words)</code>: tek kelime var, <code>i</code> ve <code>j</code> ikisi de 0. Yer değiştirecek bir şey yok.';
      revMarks[0] = 'mid';
    } else if (i === j) {
      revText = `<code>i</code> ve <code>j</code> ortada buluştu (${i}). Ortadaki ${q(words[i])} zaten yerinde; dizi ters çevrildi.`;
      revMarks[i] = 'mid';
    } else {
      revText = `<code>i = ${i}</code>, <code>j = ${j}</code>: <code>i</code>, <code>j</code>'yi geçti. Her kelime karşısındakiyle yer değiştirdi; dizi ters çevrildi.`;
    }
    snap({ kind: 'revDone', lines: ['rev'], changed: ['i', 'j'], ij: true, sState: { doneTo: n }, marks: revMarks, text: revText });
    i = undefined;
    j = undefined;

    // 3. string.Join
    result = '';
    for (let k = 0; k < m; k++) {
      const before = result.length;
      if (k > 0) result += ' ';
      result += words[k];
      const marks = {};
      for (let u = 0; u < k; u++) marks[u] = 'used';
      marks[k] = 'cur';
      let text;
      if (k === 0) {
        text = `<code>string.Join(" ", words)</code> ilk kelimeyi yazıyor: ${q(words[0])}. Başına boşluk koymuyor.` +
          (m === 1 ? ' Tek kelime olduğu için sonuç bu kadar; sona da boşluk koymuyor.' : '');
      } else {
        text = `Araya tek bir boşluk, ardından ${q(words[k])}.` + (k === m - 1 ? ' Son kelimeydi; sona boşluk koymuyor.' : '');
      }
      snap({ kind: 'join', lines: ['join'], sState: { doneTo: n }, marks, fresh: result.length - before, text });
    }

    const inSpaces = s.split('').filter((c) => c === ' ').length;
    snap({
      kind: 'end', lines: ['join'], done: true, sState: { doneTo: n },
      marks: Object.fromEntries(words.map((_, k) => [k, 'used'])),
      text: `<code>return</code> ${q(result)}. ` + (inSpaces === m - 1
        ? 'Girdide fazladan boşluk yoktu.'
        : `Girdideki ${inSpaces} boşluktan ${m === 1 ? 'hiçbiri kalmadı.' : `sadece ${m - 1} tanesi kaldı: kelimelerin arasında birer tane.`}`),
    });
    return steps;
  }

  // Rendering
  const CODE = [
    ['split', '<span class="kw">string</span>[] words = s.Split(<span class="st">\' \'</span>,'],
    ['split', '    StringSplitOptions.RemoveEmptyEntries);'],
    ['', ''],
    ['rev', 'Array.Reverse(words);'],
    ['', ''],
    ['join', '<span class="kw">return string</span>.Join(<span class="st">" "</span>, words);'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = [...document.querySelectorAll('.ln[data-id]')];

  const TAGS = {
    start: ['Başlangıç', ''], split: ['Split', ''], splitDone: ['Split bitti', ''],
    revStart: ['Array.Reverse', ''], swap: ['Yer değiştir', ''], revDone: ['Ters çevrildi', ''],
    join: ['string.Join', ''], end: ['Bitti', 'ok'],
  };

  let listText = 'a good   example';
  let text = '';
  let steps = [];
  let idx = 0;
  let timer = null;

  function parse(raw) {
    if (raw.length === 0 || raw.length > MAX_LEN) return null;
    if (!/^[A-Za-z0-9 ]+$/.test(raw) || raw.trim() === '') return null;
    return raw;
  }

  const charBox = (c, st) => `<span class="ch${c === ' ' ? ' sp' : ''}"${st ? ` data-st="${st}"` : ''}>${c === ' ' ? '·' : c}</span>`;

  function render() {
    const st = steps[idx];

    // s
    let html = '';
    for (let k = 0; k < text.length; k++) {
      let state = '';
      const ss = st.sState;
      if (ss) {
        if (ss.piece && k >= ss.piece[0] && k < ss.piece[1]) state = 'piece';
        else if (k === ss.cut) state = ss.skip ? 'skip' : 'cut';
        else if (k < ss.doneTo) state = 'done';
      }
      html += charBox(text[k], state);
    }
    $('s-row').innerHTML = html;

    // words
    $('w-row').innerHTML = st.words.length === 0
      ? '<p class="empty">henüz kelime yok</p>'
      : `<div class="words">${st.words.map((w, k) => {
        const lbl = st.ij ? [k === st.i ? 'i' : '', k === st.j ? 'j' : ''].filter(Boolean).join(' ') : '';
        return `<div class="wcol"><span class="wlbl">${lbl}</span><span class="chip"${st.marks[k] ? ` data-st="${st.marks[k]}"` : ''}>${w}</span><span class="widx">[${k}]</span></div>`;
      }).join('')}</div>`;

    // result
    if (st.result === null) {
      $('r-row').innerHTML = '<p class="empty">Join henüz başlamadı</p>';
    } else {
      const r = st.result;
      $('r-row').innerHTML = `<div class="chars">${[...r].map((c, k) => charBox(c, k >= r.length - st.fresh ? 'new' : '')).join('')}</div>`;
    }

    const show = (v) => (v === undefined ? '—' : String(v));
    const vars = [['words.Length', st.wordsLen, 'len'], ['i', st.ij ? st.i : undefined, 'i'], ['j', st.ij ? st.j : undefined, 'j']];
    $('vars').innerHTML = vars.map(([name, v, key]) =>
      `<div class="var${st.changed.includes(key) ? ' changed' : ''}"><dt>${name}</dt><dd>${show(v)}</dd></div>`).join('');

    $('result').textContent = st.done ? `"${st.result}"` : '—';
    $('out').dataset.kind = st.done ? 'done' : '';

    codeLines.forEach((el) => el.classList.toggle('hl', st.lines.includes(el.dataset.id)));

    const [tagText, tagKind] = TAGS[st.kind];
    $('step-count').textContent = `Adım ${idx + 1} / ${steps.length}`;
    $('step-tag').textContent = tagText;
    $('step-tag').dataset.kind = tagKind;
    $('step-text').innerHTML = st.text;
    $('prev-btn').disabled = idx === 0;
    $('reset').disabled = idx === 0;
    $('next-btn').disabled = idx === steps.length - 1;

    document.querySelectorAll('.presets button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.l === listText)));
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Oynat';
  }

  function restart(raw) {
    stop();
    listText = raw;
    text = raw;
    steps = buildSteps(raw);
    idx = 0;
    render();
  }

  $('next-btn').addEventListener('click', () => { stop(); if (idx < steps.length - 1) { idx++; render(); } });
  $('prev-btn').addEventListener('click', () => { stop(); if (idx > 0) { idx--; render(); } });
  $('reset').addEventListener('click', () => { stop(); idx = 0; render(); });
  $('play').addEventListener('click', () => {
    if (timer) { stop(); return; }
    if (idx === steps.length - 1) { idx = 0; render(); }
    $('play').textContent = '❚❚ Durdur';
    timer = setInterval(() => {
      if (idx < steps.length - 1) { idx++; render(); }
      if (idx === steps.length - 1) stop();
    }, 1100);
  });
  document.querySelectorAll('.presets button').forEach((b) => b.addEventListener('click', () => {
    $('list').value = b.dataset.l;
    $('list-err').hidden = true;
    restart(b.dataset.l);
  }));
  $('list').addEventListener('input', (e) => {
    const parsed = parse(e.target.value);
    if (!parsed) { $('list-err').hidden = false; return; }
    $('list-err').hidden = true;
    restart(parsed);
  });
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(listText);
})();
