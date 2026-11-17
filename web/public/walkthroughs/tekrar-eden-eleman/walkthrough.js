(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_LEN = 10;

  function buildSteps(vals) {
    const steps = [];
    const seen = [];
    const snap = (s) => steps.push({
      seen: seen.slice(),
      idx: undefined,
      n: undefined,
      added: undefined,
      dupVal: undefined,
      changed: [],
      ...s,
    });

    snap({
      kind: 'start',
      lines: ['set'],
      text: 'Görülen sayıları tutmak için boş bir <code>HashSet&lt;int&gt; seen</code> oluşturuluyor.',
    });

    for (let k = 0; k < vals.length; k++) {
      const n = vals[k];
      if (seen.includes(n)) {
        snap({
          kind: 'dup',
          idx: k,
          n,
          added: 'false',
          dupVal: n,
          lines: ['foreach', 'if'],
          changed: ['n', 'seen.Add(n)'],
          text: `<code>n = ${n}</code>. <code>seen.Add(${n})</code> çağrıldı: <b>${n} kümede zaten var!</b> Metod <code>false</code> döndürdü; <code>!seen.Add(n)</code> doğru olduğu için hemen <code>return true</code> ile çıkıyoruz.`,
        });
        return steps;
      }

      seen.push(n);
      snap({
        kind: 'add',
        idx: k,
        n,
        added: 'true',
        lines: ['foreach', 'if'],
        changed: ['n', 'seen.Add(n)', 'seen.Count'],
        text: `<code>n = ${n}</code>. <code>seen.Add(${n})</code> çağrıldı: kümede yoktu, eklendi ve <code>true</code> döndü. Tekrar değil, sıradaki elemana geçiyoruz.`,
      });
    }

    snap({
      kind: 'done',
      idx: vals.length,
      lines: ['ret'],
      text: 'Dizideki bütün sayılar gezildi ve hiçbiri ikinci kez görülmedi. <code>return false</code>.',
    });

    return steps;
  }

  const CODE = [
    ['set', '<span class="kw">var</span> seen = <span class="kw">new</span> HashSet&lt;<span class="kw">int</span>&gt;();'],
    ['', ''],
    ['foreach', '<span class="kw">foreach</span> (<span class="kw">var</span> n <span class="kw">in</span> nums)'],
    ['', '{'],
    ['', '    // Add, eleman zaten varsa false döndürür.'],
    ['if', '    <span class="kw">if</span> (!seen.Add(n)) <span class="kw">return true</span>;'],
    ['', '}'],
    ['', ''],
    ['ret', '<span class="kw">return false</span>;'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Başlangıç', ''],
    add: ['Kümeye eklendi', ''],
    dup: ['Tekrar bulundu → true', 'ok'],
    done: ['Tekrar yok → false', 'skip'],
  };

  let listText = '1, 2, 3, 1';
  let vals = [];
  let steps = [];
  let idx = 0;
  let timer = null;

  function parse(raw) {
    const parts = raw.split(/[\s,]+/).filter(Boolean);
    if (parts.length < 1 || parts.length > MAX_LEN) return null;
    const out = parts.map(Number);
    return out.every((v) => Number.isInteger(v) && v >= -999 && v <= 999) ? out : null;
  }

  function renderNums(st) {
    return vals.map((v, k) => {
      const isCur = st.idx === k;
      const tags = isCur ? '<span class="t-num">n</span>' : '';
      let state = 'plain';
      if (st.kind === 'dup' && (isCur || (k < st.idx && v === st.dupVal))) state = 'dup';
      else if (st.idx !== undefined && k < st.idx) state = 'seen';
      else if (st.kind === 'add' && isCur) state = 'seen';
      const cls = `chip${isCur ? ' cur' : ''}`;
      return `<div class="item"><div class="tags">${tags}</div><div class="${cls}" data-state="${state}">${v}</div></div>`;
    }).join('');
  }

  function renderSet(st) {
    if (st.seen.length === 0) return '<p class="empty-note">seen kümesi henüz boş.</p>';
    return st.seen.map((v) => {
      let state = 'seen';
      if (st.kind === 'dup' && v === st.dupVal) state = 'dup';
      const isNew = st.kind === 'add' && v === st.n;
      const tags = st.kind === 'dup' && v === st.dupVal
        ? '<span class="t-probe">zaten var!</span>'
        : isNew ? '<span class="t-num">+ eklendi</span>' : '';
      return `<div class="item"><div class="tags">${tags}</div><div class="chip${isNew ? ' cur' : ''}" data-state="${state}">${v}</div></div>`;
    }).join('');
  }

  function render() {
    const st = steps[idx];
    $('nums-line').innerHTML = renderNums(st);
    $('set-line').innerHTML = renderSet(st);

    const vars = [
      ['n', st.n],
      ['seen.Add(n)', st.added],
      ['seen.Count', st.seen.length],
    ];
    $('vars').innerHTML = vars.map(([name, v]) =>
      `<div class="var${st.changed.includes(name) ? ' changed' : ''}"><dt>${name}</dt><dd>${v === undefined ? '—' : v}</dd></div>`).join('');

    Object.keys(codeLines).forEach((id) => codeLines[id].classList.toggle('hl', st.lines.includes(id)));

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

  function restart(text, parsed) {
    stop();
    listText = text;
    vals = parsed;
    steps = buildSteps(vals);
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
    restart(b.dataset.l, parse(b.dataset.l));
  }));
  $('list').addEventListener('input', (e) => {
    const parsed = parse(e.target.value);
    if (!parsed) { $('list-err').hidden = false; return; }
    $('list-err').hidden = true;
    restart(e.target.value, parsed);
  });
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(listText, parse(listText));
})();
