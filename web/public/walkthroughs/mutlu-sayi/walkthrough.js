(() => {
  const $ = (id) => document.getElementById(id);

  function sumOfSquares(num) {
    let sum = 0;
    while (num > 0) {
      const d = num % 10;
      sum += d * d;
      num = Math.floor(num / 10);
    }
    return sum;
  }

  function explainSq(num) {
    const digits = String(num).split('').map(Number);
    return `${digits.map((d) => `${d}²`).join(' + ')} = ${sumOfSquares(num)}`;
  }

  function buildChain(n) {
    const chain = [];
    const seen = new Map();
    let cur = n;
    while (!seen.has(cur)) {
      seen.set(cur, chain.length);
      chain.push(cur);
      if (cur === 1) break;
      cur = sumOfSquares(cur);
    }
    const cycleStart = cur === 1 ? -1 : seen.get(cur);
    return { chain, cycleStart };
  }

  function buildSteps(n) {
    const { chain, cycleStart } = buildChain(n);
    const steps = [];
    let slow = n;
    let fast = sumOfSquares(n);

    const snap = (s) => steps.push({
      chain,
      cycleStart,
      n,
      slow,
      fast,
      changed: [],
      ...s,
    });

    snap({
      kind: 'start',
      lines: ['slow', 'fast'],
      changed: ['slow', 'fast'],
      text: `<code>slow = ${slow}</code> ile başlar. <code>fast = SumOfSquares(${n})</code> (${explainSq(n)}) → <code>${fast}</code> olarak ayarlanır.`,
    });

    while (fast !== 1 && slow !== fast) {
      const prevSlow = slow;
      const prevFast = fast;
      const midFast = sumOfSquares(fast);
      slow = sumOfSquares(slow);
      fast = sumOfSquares(midFast);

      snap({
        kind: 'move',
        lines: ['while', 'mslow', 'mfast'],
        changed: ['slow', 'fast'],
        text: `<code>slow</code> 1 adım ilerler: ${explainSq(prevSlow)} → <code>${slow}</code>. ` +
          `<code>fast</code> 2 adım ilerler: ${prevFast} → ${midFast} → <code>${fast}</code>.`,
      });
    }

    if (fast === 1) {
      snap({
        kind: 'happy',
        lines: ['while', 'ret'],
        text: `<code>fast == 1</code> oldu! Zincir 1'e ulaştığı için döngü biter ve <code>return true</code> döner: <b>${n} mutlu bir sayıdır.</b>`,
      });
    } else {
      snap({
        kind: 'cycle',
        lines: ['while', 'ret'],
        text: `<code>slow == fast == ${slow}</code>! İki işaretçi 1 dışındaki döngü içinde çarpıştı. <code>return false</code> döner: <b>${n} mutlu sayı değildir.</b>`,
      });
    }

    return steps;
  }

  const CODE = [
    ['slow', '<span class="kw">int</span> slow = n;'],
    ['fast', '<span class="kw">int</span> fast = SumOfSquares(n);'],
    ['', ''],
    ['while', '<span class="kw">while</span> (fast != 1 &amp;&amp; slow != fast)'],
    ['', '{'],
    ['mslow', '    slow = SumOfSquares(slow);'],
    ['mfast', '    fast = SumOfSquares(SumOfSquares(fast));'],
    ['', '}'],
    ['', ''],
    ['ret', '<span class="kw">return</span> fast == 1;'],
  ];

  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Başlangıç', ''],
    move: ['İlerle', ''],
    happy: ['Mutlu Sayı (1)', 'ok'],
    cycle: ['Döngü Yakalandı', 'bad'],
  };

  let curN = 19;
  let steps = [];
  let idx = 0;
  let timer = null;

  function renderChain(st) {
    let html = '';
    st.chain.forEach((v, k) => {
      if (k > 0) {
        html += '<div class="item"><div class="tags"></div><div class="arrow" aria-hidden="true">→</div></div>';
      }
      const tags = [];
      const isSlow = v === st.slow;
      const isFast = v === st.fast;
      if (isSlow) tags.push('<span class="t-num">slow</span>');
      if (isFast) tags.push('<span class="t-probe">fast</span>');

      let cls = 'chip';
      if (isSlow && isFast && v !== 1) cls += ' both';
      else if (isSlow) cls += ' cur';
      else if (isFast) cls += ' probe';

      let state = 'plain';
      if (v === 1) state = 'one';
      else if (st.cycleStart !== -1 && k >= st.cycleStart) state = 'cycle';

      html += `<div class="item"><div class="tags">${tags.join('')}</div><div class="${cls}" data-state="${state}">${v}</div></div>`;
    });

    if (st.cycleStart !== -1) {
      const target = st.chain[st.cycleStart];
      html += `<div class="item"><div class="tags"></div><div class="arrow" aria-hidden="true">↩ ${target}</div></div>`;
    }
    return html;
  }

  function render() {
    const st = steps[idx];
    $('nline').innerHTML = renderChain(st);

    const vars = [
      ['n', st.n],
      ['slow', st.slow],
      ['fast', st.fast],
    ];
    $('vars').innerHTML = vars.map(([name, v]) =>
      `<div class="var${st.changed.includes(name) ? ' changed' : ''}"><dt>${name}</dt><dd>${v}</dd></div>`
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

    document.querySelectorAll('.presets button').forEach((b) =>
      b.setAttribute('aria-pressed', String(Number(b.dataset.n) === curN))
    );
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Oynat';
  }

  function restart(nVal) {
    stop();
    curN = nVal;
    steps = buildSteps(curN);
    idx = 0;
    render();
  }

  function parseN(raw) {
    const trimmed = raw.trim();
    if (!/^\d+$/.test(trimmed)) return null;
    const val = Number(trimmed);
    return val >= 1 && val <= 9999 ? val : null;
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
    b.addEventListener('click', () => {
      $('num-in').value = b.dataset.n;
      $('num-err').hidden = true;
      restart(Number(b.dataset.n));
    })
  );

  $('num-in').addEventListener('input', (e) => {
    const parsed = parseN(e.target.value);
    if (!parsed) { $('num-err').hidden = false; return; }
    $('num-err').hidden = true;
    restart(parsed);
  });

  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(19);
})();
