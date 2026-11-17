(() => {
  const $ = (id) => document.getElementById(id);

  function cloneGrid(g) {
    return g.map((r) => r.slice());
  }

  function buildSteps(w1, w2) {
    const m = w1.length;
    const n = w2.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(null));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    const steps = [];
    const snap = (s) => steps.push({
      dp: cloneGrid(dp),
      i: undefined,
      j: undefined,
      probes: [],
      matched: false,
      changed: [],
      ...s,
    });

    snap({
      kind: 'start',
      lines: ['base1', 'base2'],
      changed: [],
      text: `Tablonun ilk sütunu (<code>0..${m}</code> silme işlemi) ve ilk satırı (<code>0..${n}</code> ekleme işlemi) başlangıç değerleriyle doldurulur.`,
    });

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (w1[i - 1] === w2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
          snap({
            kind: 'match',
            i,
            j,
            matched: true,
            probes: [[i - 1, j - 1]],
            lines: ['fori', 'forj', 'if', 'copy'],
            changed: ['i', 'j', 'dp[i,j]'],
            text: `<code>word1[${i - 1}] = '${w1[i - 1]}'</code> ve <code>word2[${j - 1}] = '${w2[j - 1]}'</code> aynı! İşlem gerekmez: <code>dp[${i}, ${j}] = dp[${i - 1}, ${j - 1}] = ${dp[i][j]}</code>.`,
          });
        } else {
          const rep = dp[i - 1][j - 1];
          const del = dp[i - 1][j];
          const ins = dp[i][j - 1];
          dp[i][j] = 1 + Math.min(rep, del, ins);
          snap({
            kind: 'edit',
            i,
            j,
            matched: false,
            probes: [[i - 1, j - 1], [i - 1, j], [i, j - 1]],
            lines: ['fori', 'forj', 'else', 'min'],
            changed: ['i', 'j', 'dp[i,j]'],
            text: `<code>'${w1[i - 1]}' ≠ '${w2[j - 1]}'</code>. Değiştir (↖ ${rep}), Sil (↑ ${del}), Ekle (← ${ins}) arasından en küçüğü + 1 → <code>dp[${i}, ${j}] = ${dp[i][j]}</code>.`,
          });
        }
      }
    }

    snap({
      kind: 'done',
      i: m,
      j: n,
      matched: true,
      lines: ['ret'],
      changed: [],
      text: `Tablo tamamlandı. <code>"${w1}"</code> → <code>"${w2}"</code> için en az işlem sayısı: <code>dp[${m}, ${n}] = ${dp[m][n]}</code>.`,
    });

    return steps;
  }

  const CODE = [
    ['base1', '<span class="kw">for</span> (<span class="kw">int</span> i = 0; i &lt;= m; i++) dp[i, 0] = i;'],
    ['base2', '<span class="kw">for</span> (<span class="kw">int</span> j = 0; j &lt;= n; j++) dp[0, j] = j;'],
    ['', ''],
    ['fori', '<span class="kw">for</span> (<span class="kw">int</span> i = 1; i &lt;= m; i++)'],
    ['forj', '    <span class="kw">for</span> (<span class="kw">int</span> j = 1; j &lt;= n; j++)'],
    ['if', '        <span class="kw">if</span> (word1[i - 1] == word2[j - 1])'],
    ['copy', '            dp[i, j] = dp[i - 1, j - 1];'],
    ['else', '        <span class="kw">else</span>'],
    ['min', '            dp[i, j] = 1 + Math.Min(dp[i - 1, j - 1], Math.Min(dp[i - 1, j], dp[i, j - 1]));'],
    ['', ''],
    ['ret', '<span class="kw">return</span> dp[m, n];'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Başlangıç', ''],
    match: ['Eşleşme (+0)', 'ok'],
    edit: ['Düzenleme (+1)', ''],
    done: ['Tamamlandı', 'ok'],
  };

  let w1 = 'horse';
  let w2 = 'ros';
  let steps = [];
  let idx = 0;
  let timer = null;

  function render() {
    const st = steps[idx];
    const m = w1.length;
    const n = w2.length;

    let html = '<thead><tr><th></th><th>""</th>';
    for (let j = 0; j < n; j++) html += `<th>${w2[j]}</th>`;
    html += '</tr></thead><tbody>';

    for (let i = 0; i <= m; i++) {
      const rowHdr = i === 0 ? '""' : w1[i - 1];
      html += `<tr><th>${rowHdr}</th>`;
      for (let j = 0; j <= n; j++) {
        const v = st.dp[i][j];
        let cls = v === null ? 'empty' : '';
        if (st.i === i && st.j === j) cls = st.matched ? 'match' : 'cur';
        else if (st.probes.some(([pi, pj]) => pi === i && pj === j)) cls = 'probe';
        html += `<td class="${cls}">${v === null ? '·' : v}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody>';
    $('matrix').innerHTML = html;

    const vars = [
      ['i', st.i !== undefined ? st.i : '—'],
      ['j', st.j !== undefined ? st.j : '—'],
      ['dp[i,j]', st.i !== undefined && st.j !== undefined ? st.dp[st.i][st.j] : '—'],
    ];
    $('vars').innerHTML = vars.map(([name, v]) =>
      `<div class="var${st.changed.includes(name) ? ' changed' : ''}"><dt>${name}</dt><dd>${v}</dd></div>`).join('');

    Object.keys(codeLines).forEach((id) => codeLines[id].classList.toggle('hl', st.lines.includes(id)));

    const [tagText, tagKind] = TAGS[st.kind];
    $('step-count').textContent = `Adım ${idx + 1} / ${steps.length}`;
    $('step-tag').textContent = tagText;
    $('step-tag').dataset.kind = tagKind;
    $('step-text').innerHTML = st.text;
    $('prev-btn').disabled = idx === 0;
    $('reset').disabled = idx === 0;
    $('next-btn').disabled = idx === steps.length - 1;

    document.querySelectorAll('.presets button').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.w1 === w1 && b.dataset.w2 === w2));
    });
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Oynat';
  }

  function restart(nw1, nw2) {
    stop();
    w1 = nw1;
    w2 = nw2;
    steps = buildSteps(w1, w2);
    idx = 0;
    render();
  }

  function onInput() {
    const nw1 = $('w1-in').value.trim();
    const nw2 = $('w2-in').value.trim();
    if (nw1.length > 6 || nw2.length > 6) {
      $('err').hidden = false;
      return;
    }
    $('err').hidden = true;
    restart(nw1, nw2);
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
    }, 900);
  });

  document.querySelectorAll('.presets button').forEach((b) => b.addEventListener('click', () => {
    $('w1-in').value = b.dataset.w1;
    $('w2-in').value = b.dataset.w2;
    $('err').hidden = true;
    restart(b.dataset.w1, b.dataset.w2);
  }));

  $('w1-in').addEventListener('input', onInput);
  $('w2-in').addEventListener('input', onInput);

  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(w1, w2);
})();
