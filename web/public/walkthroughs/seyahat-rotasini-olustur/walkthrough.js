(() => {
  const $ = (id) => document.getElementById(id);

  const PRESETS = [
    [['JFK', 'KUL'], ['JFK', 'NRT'], ['NRT', 'JFK']],
    [['JFK', 'SFO'], ['JFK', 'ATL'], ['SFO', 'ATL'], ['ATL', 'JFK'], ['ATL', 'SFO']],
    [['MUC', 'LHR'], ['JFK', 'MUC'], ['SFO', 'SJC'], ['LHR', 'SFO']],
  ];

  function buildSteps(tickets) {
    const initialAdj = {};
    const activeAdj = {};
    tickets.forEach(([from, to]) => {
      if (!initialAdj[from]) initialAdj[from] = [];
      initialAdj[from].push(to);
    });
    const keys = Object.keys(initialAdj).sort();
    keys.forEach((k) => {
      initialAdj[k].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
      activeAdj[k] = initialAdj[k].slice();
    });

    const steps = [];
    const stack = [];
    const route = [];
    let curAirport;
    let nextAirport;
    let reversed = false;

    const cloneAdj = () => {
      const out = {};
      keys.forEach((k) => { out[k] = activeAdj[k].slice(); });
      return out;
    };

    const snap = (s) => steps.push({
      keys,
      initialAdj,
      adj: cloneAdj(),
      stack: stack.slice(),
      route: route.slice(),
      curAirport,
      nextAirport,
      reversed,
      changed: [],
      ...s,
    });

    snap({
      kind: 'start',
      lines: ['buildAdj', 'sortAdj', 'callDfs'],
      text: `Her havalimanının varış listesi <b>ters alfabetik</b> sıralandı; böylece her listenin en sonundaki eleman alfabetik olarak en küçük bilettir. <code>Dfs("JFK")</code> ile başlıyoruz.`,
    });

    function dfs(airport) {
      stack.push(airport);
      curAirport = airport;
      nextAirport = undefined;

      const dests = activeAdj[airport];
      while (dests && dests.length > 0) {
        const nxt = dests.pop();
        curAirport = airport;
        nextAirport = nxt;
        snap({
          kind: 'pick',
          lines: ['whileDests', 'popNext', 'recDfs'],
          changed: ['airport', 'next'],
          text: `<code>airport = "${airport}"</code> için kalan en küçük bilet: <b>"${nxt}"</b>. Bileti listeden çıkarıp <code>Dfs("${nxt}")</code> çağrısına ilerliyoruz.`,
        });
        dfs(nxt);
        curAirport = airport;
        nextAirport = undefined;
      }

      route.push(airport);
      snap({
        kind: 'post',
        lines: ['whileDests', 'addRoute'],
        changed: ['route.Count'],
        text: `<code>"${airport}"</code> havalimanından gidecek başka bilet kalmadı! Post-order olarak <code>route</code> listesine <b>"${airport}"</b> eklendi.`,
      });
      stack.pop();
    }

    dfs('JFK');

    route.reverse();
    curAirport = undefined;
    nextAirport = undefined;
    reversed = true;
    snap({
      kind: 'done',
      lines: ['revRoute', 'retRoute'],
      changed: ['route.Count'],
      text: `Tüm biletler kullanıldı. <code>route.Reverse()</code> ile liste ters çevrildi ve kesin seyahat rotası elde edildi: <b>${route.join(' → ')}</b>.`,
    });

    return steps;
  }

  const CODE = [
    ['buildAdj', '<span class="kw">foreach</span> (<span class="kw">var</span> t <span class="kw">in</span> tickets) adj[t[0]].Add(t[1]);'],
    ['sortAdj', '<span class="kw">foreach</span> (<span class="kw">var</span> list <span class="kw">in</span> adj.Values)'],
    ['', '    list.Sort((a, b) =&gt; <span class="kw">string</span>.CompareOrdinal(b, a));'],
    ['', ''],
    ['', '<span class="kw">void</span> Dfs(<span class="kw">string</span> airport) {'],
    ['whileDests', '    <span class="kw">while</span> (adj.TryGetValue(airport, <span class="kw">out var</span> dests) &amp;&amp; dests.Count &gt; 0) {'],
    ['popNext', '        <span class="kw">string</span> next = dests[dests.Count - 1]; dests.RemoveAt(dests.Count - 1);'],
    ['recDfs', '        Dfs(next);'],
    ['', '    }'],
    ['addRoute', '    route.Add(airport);'],
    ['', '}'],
    ['', ''],
    ['callDfs', 'Dfs("JFK");'],
    ['revRoute', 'route.Reverse();'],
    ['retRoute', '<span class="kw">return</span> route;'],
  ];

  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Hazırlık', ''],
    pick: ['Bilet Seç (DFS)', ''],
    post: ['Çıkmaz / Post-order', 'skip'],
    done: ['Tamamlandı', 'ok'],
  };

  let presetIdx = 0;
  let steps = [];
  let idx = 0;
  let timer = null;

  function render() {
    const st = steps[idx];

    $('adj-grid').innerHTML = st.keys.map((k) => {
      const initList = st.initialAdj[k];
      const remCount = st.adj[k].length;
      const isCur = st.curAirport === k;
      const chips = initList.map((dest, i) => {
        let cls = 'mini';
        if (i >= remCount) cls += ' used';
        else if (i === remCount - 1 && isCur) cls += ' next';
        return `<span class="${cls}">${dest}</span>`;
      }).join('');
      return `<div class="adj-card${isCur ? ' active' : ''}"><span class="adj-from">${k}:</span><div class="adj-list">${chips}</div></div>`;
    }).join('');

    $('stack-row').innerHTML = st.stack.length === 0
      ? '<span class="empty-note">çağrı yığını boş</span>'
      : st.stack.map((a, i) =>
        `${i > 0 ? '<span class="arrow">→</span>' : ''}<span class="mini${i === st.stack.length - 1 ? ' now' : ''}">${a}</span>`).join('');

    $('route-row').innerHTML = st.route.length === 0
      ? '<span class="empty-note">henüz havalimanı eklenmedi</span>'
      : st.route.map((a, i) =>
        `${i > 0 && st.reversed ? '<span class="arrow">→</span>' : ''}<span class="mini${st.reversed ? ' good' : i === st.route.length - 1 && st.kind === 'post' ? ' now' : ''}">${a}</span>`).join('');

    const vars = [
      ['airport', st.curAirport ? `"${st.curAirport}"` : '—'],
      ['next', st.nextAirport ? `"${st.nextAirport}"` : '—'],
      ['stack.Count', st.stack.length],
      ['route.Count', st.route.length],
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

    document.querySelectorAll('.presets button').forEach((b) =>
      b.setAttribute('aria-pressed', String(Number(b.dataset.p) === presetIdx)));
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Oynat';
  }

  function loadPreset(pIdx) {
    stop();
    presetIdx = pIdx;
    steps = buildSteps(PRESETS[pIdx]);
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
  document.querySelectorAll('.presets button').forEach((b) =>
    b.addEventListener('click', () => loadPreset(Number(b.dataset.p))));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  loadPreset(0);
})();
