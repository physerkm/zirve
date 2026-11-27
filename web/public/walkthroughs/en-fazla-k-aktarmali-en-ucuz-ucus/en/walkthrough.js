(() => {
  const $ = (id) => document.getElementById(id);
  const INF = Infinity;

  const PRESETS = [
    {
      n: 4,
      flights: [[0, 1, 100], [1, 2, 100], [2, 0, 100], [1, 3, 600], [2, 3, 200]],
      src: 0,
      dst: 3,
      k: 1,
    },
    {
      n: 3,
      flights: [[0, 1, 100], [1, 2, 100], [0, 2, 500]],
      src: 0,
      dst: 2,
      k: 1,
    },
    {
      n: 3,
      flights: [[0, 1, 100], [1, 2, 100], [0, 2, 500]],
      src: 0,
      dst: 2,
      k: 0,
    },
    {
      n: 4,
      flights: [[0, 1, 1], [0, 2, 5], [1, 2, 1], [2, 3, 1]],
      src: 0,
      dst: 3,
      k: 1,
    },
  ];

  function buildSteps(cfg) {
    const { n, flights, src, dst, k } = cfg;
    const steps = [];
    let prices = new Array(n).fill(INF);
    prices[src] = 0;
    let tempPrices = prices.slice();
    let i;
    let u;
    let v;
    let price;
    let fIdx = -1;
    let updatedCities = [];

    const snap = (s) => steps.push({
      n, flights, src, dst, k,
      prices: prices.slice(),
      tempPrices: tempPrices.slice(),
      i, u, v, price, fIdx,
      updatedCities: updatedCities.slice(),
      changed: [],
      ...s,
    });

    snap({
      kind: 'start',
      lines: ['init1', 'init2', 'init3'],
      changed: [],
      text: `The starting city <code>src = ${src}</code> gets cost <code>0</code>, and every other city is set to <code>∞</code>. The loop will run for at most <code>k = ${k}</code> stops (${k + 1} flights).`,
    });

    for (i = 0; i <= k; i++) {
      tempPrices = prices.slice();
      updatedCities = [];
      u = undefined;
      v = undefined;
      price = undefined;
      fIdx = -1;

      snap({
        kind: 'begin',
        lines: ['for', 'clone'],
        changed: ['i'],
        text: `<b>Round ${i + 1} / ${k + 1}</b> (<code>i = ${i}</code>): the current <code>prices</code> array was copied into <code>tempPrices</code>.`,
      });

      for (let idx = 0; idx < flights.length; idx++) {
        fIdx = idx;
        u = flights[idx][0];
        v = flights[idx][1];
        price = flights[idx][2];

        if (prices[u] === INF) {
          snap({
            kind: 'skip',
            lines: ['foreach', 'vars', 'ifinf', 'cont'],
            changed: ['u', 'v', 'price'],
            text: `Flight <code>${u} → ${v} (${price})</code>: the departure city has <code>prices[${u}] = ∞</code>, so it cannot be reached yet; skipped.`,
          });
          continue;
        }

        const cand = prices[u] + price;
        const oldTemp = tempPrices[v];
        const oldStr = oldTemp === INF ? '∞' : String(oldTemp);

        if (cand < oldTemp) {
          tempPrices[v] = cand;
          if (!updatedCities.includes(v)) updatedCities.push(v);
          snap({
            kind: 'grow',
            lines: ['foreach', 'vars', 'ifrelax', 'relax'],
            changed: ['u', 'v', 'price'],
            text: `Flight <code>${u} → ${v} (${price})</code>: <code>prices[${u}] + ${price} = ${cand} &lt; tempPrices[${v}] (${oldStr})</code>. Found a cheaper route! <code>tempPrices[${v}] = ${cand}</code>.`,
          });
        } else {
          snap({
            kind: 'skip',
            lines: ['foreach', 'vars', 'ifrelax'],
            changed: ['u', 'v', 'price'],
            text: `Flight <code>${u} → ${v} (${price})</code>: <code>prices[${u}] + ${price} = ${cand} &gt;= tempPrices[${v}] (${oldStr})</code>. No update.`,
          });
        }
      }

      prices = tempPrices.slice();
      fIdx = -1;
      u = undefined;
      v = undefined;
      price = undefined;
      snap({
        kind: 'stop',
        lines: ['commit'],
        changed: [],
        text: `Round <code>i = ${i}</code> is done: the assignment <code>prices = tempPrices</code> makes this round's cheapest prices permanent.`,
      });
    }

    i = undefined;
    const ans = prices[dst] === INF ? -1 : prices[dst];
    snap({
      kind: 'done',
      lines: ['ret'],
      changed: [],
      text: ans === -1
        ? `All rounds are done. The destination <code>dst = ${dst}</code> is still <code>∞</code>, so <code>-1</code> is returned.`
        : `All rounds are done. The cheapest cost for the destination <code>dst = ${dst}</code> is returned: <code>prices[${dst}] = ${ans}</code>.`,
    });

    return steps;
  }

  const CODE = [
    ['init1', '<span class="kw">int</span>[] prices = <span class="kw">new int</span>[n];'],
    ['init2', 'Array.Fill(prices, <span class="kw">int</span>.MaxValue);'],
    ['init3', 'prices[src] = 0;'],
    ['', ''],
    ['for', '<span class="kw">for</span> (<span class="kw">int</span> i = 0; i &lt;= k; i++)'],
    ['', '{'],
    ['clone', '    <span class="kw">int</span>[] tempPrices = (<span class="kw">int</span>[])prices.Clone();'],
    ['foreach', '    <span class="kw">foreach</span> (<span class="kw">int</span>[] flight <span class="kw">in</span> flights)'],
    ['', '    {'],
    ['vars', '        <span class="kw">int</span> u = flight[0], v = flight[1], price = flight[2];'],
    ['ifinf', '        <span class="kw">if</span> (prices[u] == <span class="kw">int</span>.MaxValue)'],
    ['cont', '            <span class="kw">continue</span>;'],
    ['ifrelax', '        <span class="kw">if</span> (prices[u] + price &lt; tempPrices[v])'],
    ['relax', '            tempPrices[v] = prices[u] + price;'],
    ['', '    }'],
    ['commit', '    prices = tempPrices;'],
    ['', '}'],
    ['ret', '<span class="kw">return</span> prices[dst] == <span class="kw">int</span>.MaxValue ? -1 : prices[dst];'],
  ];

  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Start', ''],
    begin: ['New Round', ''],
    skip: ['No Update', 'skip'],
    grow: ['Price Updated', ''],
    stop: ['End of Round', ''],
    done: ['Done', 'ok'],
  };

  let presetIdx = 0;
  let steps = [];
  let idx = 0;
  let timer = null;

  function renderCities(arr, st, isTemp) {
    let html = '';
    for (let c = 0; c < st.n; c++) {
      const val = arr[c] === INF ? '∞' : arr[c];
      const tags = [];
      tags.push(`<span>${isTemp ? 'temp' : 'prices'}[${c}]</span>`);
      if (c === st.u && !isTemp) tags.push('<span class="t-num">u</span>');
      if (c === st.v && isTemp) tags.push('<span class="t-probe">v</span>');

      let cls = 'chip';
      let state = 'plain';
      if (isTemp && st.updatedCities.includes(c)) state = 'run';
      if (c === st.dst) state = 'best';
      if (!isTemp && c === st.u) cls += ' cur';
      if (isTemp && c === st.v) cls += ' probe';

      html += `<div class="item"><div class="tags">${tags.join('')}</div><div class="${cls}" data-state="${state}">${val}</div></div>`;
    }
    return html;
  }

  function render() {
    const st = steps[idx];

    $('flights-row').innerHTML = st.flights.map(([fu, fv, fp], k) => {
      const cls = k === st.fIdx ? ' now' : k < st.fIdx ? ' done' : '';
      return `<span class="mini${cls}">${fu} → ${fv} (${fp})</span>`;
    }).join('');

    $('prices-line').innerHTML = renderCities(st.prices, st, false);
    $('temp-line').innerHTML = renderCities(st.tempPrices, st, true);

    const vars = [
      ['i (round)', st.i],
      ['k (limit)', st.k],
      ['u', st.u],
      ['v', st.v],
      ['price', st.price],
      ['dst', st.dst],
    ];
    $('vars').innerHTML = vars.map(([name, v]) => {
      const key = name.split(' ')[0];
      return `<div class="var${st.changed.includes(key) ? ' changed' : ''}"><dt>${name}</dt><dd>${v === undefined ? '—' : v}</dd></div>`;
    }).join('');

    Object.keys(codeLines).forEach((id) => codeLines[id].classList.toggle('hl', st.lines.includes(id)));

    const [tagText, tagKind] = TAGS[st.kind];
    $('step-count').textContent = `Step ${idx + 1} / ${steps.length}`;
    $('step-tag').textContent = tagText;
    $('step-tag').dataset.kind = tagKind;
    $('step-text').innerHTML = st.text;
    $('prev-btn').disabled = idx === 0;
    $('reset').disabled = idx === 0;
    $('next-btn').disabled = idx === steps.length - 1;

    document.querySelectorAll('.presets button').forEach((b) => {
      b.setAttribute('aria-pressed', String(Number(b.dataset.p) === presetIdx));
    });
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Play';
  }

  function restart(pIdx) {
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
    $('play').textContent = '❚❚ Pause';
    timer = setInterval(() => {
      if (idx < steps.length - 1) { idx++; render(); }
      if (idx === steps.length - 1) stop();
    }, 1100);
  });
  document.querySelectorAll('.presets button').forEach((b) => b.addEventListener('click', () => {
    restart(Number(b.dataset.p));
  }));
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(0);
})();
