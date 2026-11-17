(() => {
  const $ = (id) => document.getElementById(id);

  function buildSteps(strs) {
    const steps = [];
    let encoded = '';
    const result = [];
    let activeStrIdx = -1;
    let iVar = undefined;
    let jVar = undefined;
    let lenVar = undefined;
    let lenRange = null;
    let sepIdx = -1;
    let payRange = null;

    const snap = (s) => steps.push({
      encoded,
      result: result.slice(),
      activeStrIdx,
      iVar,
      jVar,
      lenVar,
      lenRange,
      sepIdx,
      payRange,
      changed: [],
      ...s,
    });

    snap({
      kind: 'start',
      lines: ['enc-sb'],
      text: `<code>Encode</code> başlıyor: ${strs.length} adet dizgiyi <code>&lt;uzunluk&gt;#&lt;dizgi&gt;</code> biçiminde birleştireceğiz.`,
    });

    for (let idx = 0; idx < strs.length; idx++) {
      activeStrIdx = idx;
      const str = strs[idx];
      const startPos = encoded.length;
      const prefix = `${str.length}#`;
      encoded += prefix + str;
      lenRange = [startPos, startPos + String(str.length).length];
      sepIdx = startPos + String(str.length).length;
      payRange = [sepIdx + 1, sepIdx + 1 + str.length];
      snap({
        kind: 'encode',
        lines: ['enc-loop', 'enc-app'],
        text: `<code>strs[${idx}] = "${str}"</code> (uzunluk ${str.length}) → <code>"${prefix}${str}"</code> eklendi.`,
      });
    }

    activeStrIdx = -1;
    lenRange = null;
    sepIdx = -1;
    payRange = null;
    iVar = 0;
    snap({
      kind: 'dec-start',
      lines: ['enc-ret', 'dec-init'],
      changed: ['i'],
      text: `<code>Encode</code> tamamlandı: <code>s = "${encoded}"</code>. Şimdi <code>Decode(s)</code> ile <code>i = 0</code>'dan başlayarak geri çözelim.`,
    });

    let i = 0;
    while (i < encoded.length) {
      iVar = i;
      let j = i;
      while (encoded[j] !== '#') j++;
      jVar = j;
      const length = parseInt(encoded.slice(i, j), 10);
      lenVar = length;
      lenRange = [i, j];
      sepIdx = j;
      payRange = null;

      snap({
        kind: 'find-sep',
        lines: ['dec-while', 'dec-j', 'dec-len'],
        changed: ['j', 'length'],
        text: `<code>i = ${i}</code>'den itibaren ilk <code>'#'</code> karakteri <code>j = ${j}</code> konumunda bulundu. Uzunluk: <code>length = ${length}</code>.`,
      });

      const start = j + 1;
      const piece = encoded.slice(start, start + length);
      payRange = [start, start + length];
      result.push(piece);
      i = start + length;
      iVar = i;

      snap({
        kind: 'extract',
        lines: ['dec-add', 'dec-adv'],
        changed: ['i'],
        text: `<code>j + 1 = ${start}</code> konumundan itibaren <b>${length}</b> karakter okundu: <code>"${piece}"</code> listeye eklendi. <code>i = ${i}</code> konumuna ilerledi.`,
      });
    }

    lenRange = null;
    sepIdx = -1;
    payRange = null;
    snap({
      kind: 'done',
      lines: ['dec-ret'],
      text: `<code>i == s.Length</code> (${encoded.length}) oldu, tüm paketler çözüldü! Sonuç: <code>[${result.map((x) => `"${x}"`).join(', ')}]</code>.`,
    });

    return steps;
  }

  const CODE = [
    ['enc-sb', 'StringBuilder sb = <span class="kw">new</span>();'],
    ['enc-loop', '<span class="kw">foreach</span> (<span class="kw">string</span> str <span class="kw">in</span> strs)'],
    ['enc-app', '    sb.Append(str.Length).Append(<span class="kw">\'#\'</span>).Append(str);'],
    ['enc-ret', '<span class="kw">return</span> sb.ToString();'],
    ['', ''],
    ['dec-init', '<span class="kw">int</span> i = 0;'],
    ['dec-while', '<span class="kw">while</span> (i &lt; s.Length) {'],
    ['dec-j', '    <span class="kw">int</span> j = i; <span class="kw">while</span> (s[j] != <span class="kw">\'#\'</span>) j++;'],
    ['dec-len', '    <span class="kw">int</span> length = <span class="kw">int</span>.Parse(s.Substring(i, j - i));'],
    ['dec-add', '    result.Add(s.Substring(j + 1, length));'],
    ['dec-adv', '    i = j + 1 + length;'],
    ['', '}'],
    ['dec-ret', '<span class="kw">return</span> result;'],
  ];

  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Başlangıç', ''],
    encode: ['Encode', ''],
    'dec-start': ['Decode Başlangıcı', ''],
    'find-sep': ['Uzunluk Oku', ''],
    extract: ['Dizgiyi Kes', ''],
    done: ['Tamamlandı', 'ok'],
  };

  let strs = ['zirve', 'kod', 'a#b'];
  let steps = [];
  let idx = 0;
  let timer = null;

  function parseInput(raw) {
    const parts = raw.split('|').map((s) => s.trim());
    if (parts.length === 0 || parts.length > 5) return null;
    const encLen = parts.reduce((acc, s) => acc + String(s.length).length + 1 + s.length, 0);
    if (encLen > 32) return null;
    return parts;
  }

  function render() {
    const st = steps[idx];

    $('strs-row').innerHTML = strs.map((s, k) =>
      `<span class="str-chip${k === st.activeStrIdx ? ' now' : ''}">"${s}"</span>`
    ).join('');

    $('res-row').innerHTML = st.result.length === 0
      ? '<span class="empty-note">[ ]</span>'
      : st.result.map((s) => `<span class="str-chip good">"${s}"</span>`).join('');

    if (st.encoded.length === 0) {
      $('tape').innerHTML = '<span class="empty-note">henüz boş</span>';
    } else {
      let tHtml = '';
      for (let c = 0; c < st.encoded.length; c++) {
        let cls = 'cell';
        if (st.lenRange && c >= st.lenRange[0] && c < st.lenRange[1]) cls += ' len';
        else if (c === st.sepIdx) cls += ' sep';
        else if (st.payRange && c >= st.payRange[0] && c < st.payRange[1]) cls += ' pay';

        let ptrText = '';
        if (st.iVar === c && st.jVar === c) ptrText = 'i,j';
        else if (st.iVar === c) ptrText = 'i';
        else if (st.jVar === c) ptrText = 'j';

        tHtml += `<div class="cell-wrap"><div class="ptr${ptrText === 'j' ? ' j' : ''}">${ptrText}</div><div class="${cls}">${st.encoded[c]}</div><div class="idx">${c}</div></div>`;
      }
      $('tape').innerHTML = tHtml;
    }

    const vars = [
      ['i', st.iVar],
      ['j', st.jVar],
      ['length', st.lenVar],
      ['result.Count', st.result.length],
    ];
    $('vars').innerHTML = vars.map(([name, v]) =>
      `<div class="var${st.changed.includes(name) ? ' changed' : ''}"><dt>${name}</dt><dd>${v === undefined ? '—' : v}</dd></div>`
    ).join('');

    Object.keys(codeLines).forEach((id) => codeLines[id].classList.toggle('hl', st.lines.includes(id)));

    const [tagText, tagKind] = TAGS[st.kind];
    $('step-count').textContent = `Adım ${idx + 1} / ${steps.length}`;
    $('step-tag').textContent = tagText;
    $('step-tag').dataset.kind = tagKind;
    $('step-text').innerHTML = st.text;
    $('prev-btn').disabled = idx === 0;
    $('reset').disabled = idx === 0;
    $('next-btn').disabled = idx === steps.length - 1;

    const curRaw = $('list').value;
    document.querySelectorAll('.presets button').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.l === curRaw));
    });
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Oynat';
  }

  function restart(parsed) {
    stop();
    strs = parsed;
    steps = buildSteps(strs);
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
    }, 1050);
  });

  document.querySelectorAll('.presets button').forEach((b) => b.addEventListener('click', () => {
    $('list').value = b.dataset.l;
    $('list-err').hidden = true;
    const parsed = parseInput(b.dataset.l);
    if (parsed) restart(parsed);
  }));

  $('list').addEventListener('input', (e) => {
    const parsed = parseInput(e.target.value);
    if (!parsed) { $('list-err').hidden = false; return; }
    $('list-err').hidden = true;
    restart(parsed);
  });

  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(strs);
})();
