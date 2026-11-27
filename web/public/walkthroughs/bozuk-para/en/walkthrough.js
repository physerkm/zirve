(() => {
  const $ = (id) => document.getElementById(id);

  function parseInputs(coinsRaw, amountRaw) {
    const parts = coinsRaw.split(/[\s,]+/).filter(Boolean);
    if (parts.length < 1 || parts.length > 5) return null;
    const coins = [];
    for (const p of parts) {
      const n = Number(p);
      if (!Number.isInteger(n) || n < 1 || n > 20 || coins.includes(n)) return null;
      coins.push(n);
    }
    const amount = Number(amountRaw.trim());
    if (amountRaw.trim() === '' || !Number.isInteger(amount) || amount < 0 || amount > 11) return null;
    return { coins, amount };
  }

  function buildSteps(coins, amount) {
    const unreachable = amount + 1;
    const fewest = new Array(amount + 1).fill(unreachable);
    fewest[0] = 0;
    const steps = [];

    const snap = (s) => steps.push({
      fewest: fewest.slice(),
      unreachable,
      a: '—',
      coin: '—',
      refIdx: null,
      candidate: '—',
      updated: false,
      changed: [],
      ...s,
    });

    snap({
      kind: 'start',
      lines: ['unr', 'arr', 'fill', 'base'],
      changed: ['unreachable'],
      text: `<code>unreachable = ${unreachable}</code>. The <code>fewest</code> array is filled with <code>${unreachable}</code>, and the base case is <code>fewest[0] = 0</code> (amount 0 needs 0 coins).`,
    });

    for (let a = 1; a <= amount; a++) {
      for (const coin of coins) {
        if (coin <= a) {
          const oldVal = fewest[a];
          const refVal = fewest[a - coin];
          const cand = refVal + 1;
          const isBetter = cand < oldVal;
          fewest[a] = Math.min(oldVal, cand);

          snap({
            kind: isBetter ? 'update' : 'keep',
            lines: ['for-a', 'for-c', 'if-le', 'min'],
            a,
            coin,
            refIdx: a - coin,
            candidate: `${refVal} + 1 = ${cand}`,
            updated: isBetter,
            changed: isBetter ? ['a', 'coin', 'fewest[a]'] : ['a', 'coin'],
            text: `<code>a = ${a}</code>, <code>coin = ${coin}</code> (<code>${coin} &lt;= ${a}</code>). ` +
              `Remaining amount: <code>fewest[${a} - ${coin}] = fewest[${a - coin}] = ${refVal === unreachable ? `${refVal} (unreachable)` : refVal}</code>. ` +
              `<code>Math.Min(${oldVal}, ${cand})</code> → <code>fewest[${a}] = ${fewest[a]}</code>` +
              (isBetter ? ' (fewer coins found!).' : ' (unchanged).'),
          });
        } else {
          snap({
            kind: 'skip',
            lines: ['for-a', 'for-c', 'if-le'],
            a,
            coin,
            changed: ['a', 'coin'],
            text: `<code>a = ${a}</code>, <code>coin = ${coin}</code>. <code>coin &lt;= a</code> is false (${coin} &gt; ${a}), so this coin can't be used for amount ${a}.`,
          });
        }
      }
    }

    const ans = fewest[amount] === unreachable ? -1 : fewest[amount];
    snap({
      kind: ans === -1 ? 'done-bad' : 'done-ok',
      lines: ['ret'],
      a: amount,
      text: ans === -1
        ? `The table is complete. Since <code>fewest[${amount}] == ${unreachable}</code> (<code>unreachable</code>), this amount can't be made: <code>return -1</code>.`
        : `The table is complete. <code>fewest[${amount}] = ${ans}</code> (not <code>unreachable</code>): <code>return ${ans}</code>.`,
    });

    return steps;
  }

  const CODE = [
    ['unr', '<span class="kw">var</span> unreachable = amount + 1;'],
    ['arr', '<span class="kw">var</span> fewest = <span class="kw">new int</span>[amount + 1];'],
    ['fill', 'Array.Fill(fewest, unreachable);'],
    ['base', 'fewest[0] = 0;'],
    ['', ''],
    ['for-a', '<span class="kw">for</span> (<span class="kw">var</span> a = 1; a &lt;= amount; a++)'],
    ['', '{'],
    ['for-c', '    <span class="kw">foreach</span> (<span class="kw">var</span> coin <span class="kw">in</span> coins)'],
    ['', '    {'],
    ['if-le', '        <span class="kw">if</span> (coin &lt;= a)'],
    ['', '        {'],
    ['min', '            fewest[a] = Math.Min(fewest[a], fewest[a - coin] + 1);'],
    ['', '        }'],
    ['', '    }'],
    ['', '}'],
    ['', ''],
    ['ret', '<span class="kw">return</span> fewest[amount] == unreachable ? -1 : fewest[amount];'],
  ];

  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Start', ''],
    update: ['Updated', 'ok'],
    keep: ['Compare', ''],
    skip: ['Coin too big', 'skip'],
    'done-ok': ['Result found', 'ok'],
    'done-bad': ['Unreachable (-1)', 'bad'],
  };

  let coinsText = '1, 3, 4';
  let amountText = '6';
  let curCoins = [1, 3, 4];
  let curAmount = 6;
  let steps = [];
  let idx = 0;
  let timer = null;

  function render() {
    const st = steps[idx];

    $('coins-row').innerHTML = curCoins.map((c) =>
      `<div class="cchip${st.coin === c ? ' now' : ''}">${c}</div>`
    ).join('');

    $('dp-row').innerHTML = st.fewest.map((val, k) => {
      const tags = [];
      if (st.a === k && (st.kind === 'update' || st.kind === 'keep' || st.kind === 'skip')) {
        tags.push('<span class="t-a">a</span>');
      }
      if (st.refIdx === k) {
        tags.push('<span class="t-ref">a-coin</span>');
      }
      let state = '';
      if (st.kind === 'done-ok' && k === curAmount) state = 'ans-ok';
      else if (st.kind === 'done-bad' && k === curAmount) state = 'ans-bad';
      else if (st.a === k && st.updated) state = 'updated';
      else if (st.a === k) state = 'cur';
      else if (st.refIdx === k) state = 'ref';

      const isUnr = val === st.unreachable;
      return `<div class="dp-col">` +
        `<div class="dp-tag">${tags.join('')}</div>` +
        `<div class="dp-cell${isUnr ? ' unreach' : ''}" data-st="${state}">${val}</div>` +
        `<div class="dp-idx">[${k}]</div>` +
        `</div>`;
    }).join('');

    const curFewest = typeof st.a === 'number' ? st.fewest[st.a] : '—';
    const vars = [
      ['a', st.a],
      ['coin', st.coin],
      ['fewest[a]', curFewest],
      ['unreachable', st.unreachable],
    ];
    $('vars').innerHTML = vars.map(([name, v]) =>
      `<div class="var${st.changed.includes(name) ? ' changed' : ''}"><dt>${name}</dt><dd>${v}</dd></div>`
    ).join('');

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
      b.setAttribute('aria-pressed', String(b.dataset.c === coinsText && b.dataset.a === amountText));
    });
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Play';
  }

  function restart(cTxt, aTxt, parsed) {
    stop();
    coinsText = cTxt;
    amountText = aTxt;
    curCoins = parsed.coins;
    curAmount = parsed.amount;
    steps = buildSteps(curCoins, curAmount);
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
    }, 900);
  });

  document.querySelectorAll('.presets button').forEach((b) => b.addEventListener('click', () => {
    $('coins').value = b.dataset.c;
    $('amount').value = b.dataset.a;
    $('list-err').hidden = true;
    restart(b.dataset.c, b.dataset.a, parseInputs(b.dataset.c, b.dataset.a));
  }));

  const onInput = () => {
    const parsed = parseInputs($('coins').value, $('amount').value);
    if (!parsed) { $('list-err').hidden = false; return; }
    $('list-err').hidden = true;
    restart($('coins').value, $('amount').value, parsed);
  };
  $('coins').addEventListener('input', onInput);
  $('amount').addEventListener('input', onInput);

  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(coinsText, amountText, parseInputs(coinsText, amountText));
})();
