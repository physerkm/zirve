(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_LEN = 10;

  function buildSteps(prices) {
    const steps = [];
    let lowest = Infinity;
    let best = 0;
    let day = -1;
    let price;
    let lowestDay = -1;
    let bestBuyDay = -1;
    let bestSellDay = -1;

    const snap = (s) => steps.push({
      prices, day, price,
      lowest: lowest === Infinity ? 'int.MaxValue' : lowest,
      profit: price !== undefined && lowest !== Infinity ? price - lowest : undefined,
      best, lowestDay, bestBuyDay, bestSellDay,
      changed: [], ...s,
    });

    snap({
      kind: 'start', lines: ['lowest', 'best'], changed: ['lowest', 'best'],
      text: `Başlangıçta <code>lowest = int.MaxValue</code> ve <code>best = 0</code>. Fiyatları soldan sağa gezeceğiz.`,
    });

    for (let i = 0; i < prices.length; i++) {
      day = i;
      price = prices[i];

      const prevLowest = lowest;
      if (price < lowest) {
        lowest = price;
        lowestDay = i;
      }
      const lowChanged = lowest !== prevLowest;

      snap({
        kind: lowChanged ? 'low' : 'check',
        lines: ['foreach', 'min'],
        changed: lowChanged ? ['price', 'lowest'] : ['price'],
        text: lowChanged
          ? `Gün ${i}: <code>price = ${price}</code>. Şimdiye kadarki en düşük fiyat güncellendi: <code>lowest = ${lowest}</code>.`
          : `Gün ${i}: <code>price = ${price}</code>. En düşük fiyat değişmedi: <code>lowest = ${lowest}</code> (gün ${lowestDay}).`,
      });

      const diff = price - lowest;
      const prevBest = best;
      if (diff > best) {
        best = diff;
        bestBuyDay = lowestDay;
        bestSellDay = i;
      }
      const bestChanged = best !== prevBest;

      snap({
        kind: bestChanged ? 'best' : 'keep',
        lines: ['max'],
        changed: bestChanged ? ['profit', 'best'] : ['profit'],
        text: bestChanged
          ? `Bugün satarsak kâr: <code>${price} - ${lowest} = ${diff}</code>. Yeni rekor! <code>best = ${best}</code> (gün ${bestBuyDay}'de al, gün ${bestSellDay}'de sat).`
          : `Bugün satarsak kâr: <code>${price} - ${lowest} = ${diff}</code>. Rekor kâr değişmedi: <code>best = ${best}</code>.`,
      });
    }

    day = prices.length;
    price = undefined;
    snap({
      kind: 'done', lines: ['ret'],
      text: best > 0
        ? `Tüm günler tarandı. En yüksek kâr: gün ${bestBuyDay}'de (${prices[bestBuyDay]}) alıp gün ${bestSellDay}'de (${prices[bestSellDay]}) satarak <code>return best</code> → <b>${best}</b>.`
        : `Tüm günler tarandı; hiçbir günde kâr elde edilemedi. <code>return best</code> → <b>0</b>.`,
    });

    return steps;
  }

  const CODE = [
    ['lowest', '<span class="kw">var</span> lowest = <span class="kw">int</span>.MaxValue;'],
    ['best', '<span class="kw">var</span> best = 0;'],
    ['', ''],
    ['foreach', '<span class="kw">foreach</span> (<span class="kw">var</span> price <span class="kw">in</span> prices)'],
    ['', '{'],
    ['min', '    lowest = Math.Min(lowest, price);'],
    ['max', '    best = Math.Max(best, price - lowest);'],
    ['', '}'],
    ['', ''],
    ['ret', '<span class="kw">return</span> best;'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Başlangıç', ''],
    low: ['Yeni dip fiyat', ''],
    check: ['Fiyat kontrolü', 'skip'],
    best: ['Yeni rekor kâr', 'ok'],
    keep: ['Kâr hesabı', 'skip'],
    done: ['Bitti', 'ok'],
  };

  let listText = '7, 1, 5, 3, 6, 4';
  let vals = [];
  let steps = [];
  let idx = 0;
  let timer = null;

  function parse(raw) {
    const parts = raw.split(/[\s,]+/).filter(Boolean);
    if (parts.length < 1 || parts.length > MAX_LEN) return null;
    const out = parts.map(Number);
    return out.every((v) => Number.isInteger(v) && v >= 0 && v <= 1000) ? out : null;
  }

  function renderChart(st) {
    const maxP = Math.max(...st.prices, 1);
    return st.prices.map((p, i) => {
      const h = Math.max(8, Math.round((p / maxP) * 68));
      const tags = [];
      if (i === st.day) tags.push('<span class="t-cur">price</span>');
      if (i === st.lowestDay) tags.push('<span class="t-low">lowest</span>');
      if (i === st.bestBuyDay && st.best > 0) tags.push('<span class="t-best">al</span>');
      if (i === st.bestSellDay && st.best > 0) tags.push('<span class="t-best">sat</span>');

      let state = 'plain';
      let barCls = 'bar';
      if (i === st.bestBuyDay || i === st.bestSellDay) {
        state = 'best';
        barCls += ' best';
      } else if (i === st.lowestDay) {
        state = 'low';
        barCls += ' low';
      }
      if (i === st.day) barCls = 'bar cur';

      const chipCls = 'chip' + (i === st.day ? ' cur' : '');
      return `<div class="day-col">
        <div class="day-tags">${tags.join('')}</div>
        <div class="bar-wrap"><div class="${barCls}" style="height:${h}px"></div></div>
        <div class="${chipCls}" data-state="${state}">${p}</div>
        <span class="day-idx">gün ${i}</span>
      </div>`;
    }).join('');
  }

  function render() {
    const st = steps[idx];
    $('chart').innerHTML = renderChart(st);

    const vars = [
      ['price', st.price],
      ['lowest', st.lowest],
      ['price - lowest', st.profit],
      ['best', st.best],
    ];
    $('vars').innerHTML = vars.map(([name, v]) => {
      const key = name === 'price - lowest' ? 'profit' : name;
      return `<div class="var${st.changed.includes(key) ? ' changed' : ''}"><dt>${name}</dt><dd>${v === undefined ? '—' : v}</dd></div>`;
    }).join('');

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
