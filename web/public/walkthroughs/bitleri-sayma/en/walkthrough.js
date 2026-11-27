(() => {
  const $ = (id) => document.getElementById(id);

  function buildSteps(n) {
    const steps = [];
    const dp = new Array(n + 1).fill(null);
    dp[0] = 0;

    steps.push({
      kind: 'start',
      i: undefined,
      half: undefined,
      lsb: undefined,
      dp: dp.slice(),
      lines: ['alloc'],
      changed: [],
      text: `A <code>dp</code> array with <code>n + 1</code> (${n + 1}) elements was created. Initially <code>dp[0] = 0</code>.`,
    });

    for (let i = 1; i <= n; i++) {
      const half = i >> 1;
      const lsb = i & 1;
      dp[i] = dp[half] + lsb;
      const binI = i.toString(2);
      const binHalf = half.toString(2);
      steps.push({
        kind: 'step',
        i,
        half,
        lsb,
        dp: dp.slice(),
        lines: ['for', 'calc'],
        changed: ['i', 'dp[i]'],
        text: `<code>i = ${i}</code> (<code>${binI}</code>): <code>i &gt;&gt; 1 = ${half}</code> (<code>${binHalf}</code>, <code>dp[${half}] = ${dp[half]}</code>) and the last bit is <code>i &amp; 1 = ${lsb}</code>. <code>dp[${i}] = ${dp[half]} + ${lsb} = ${dp[i]}</code>.`,
      });
    }

    steps.push({
      kind: 'done',
      i: undefined,
      half: undefined,
      lsb: undefined,
      dp: dp.slice(),
      lines: ['ret'],
      changed: [],
      text: `All elements were computed in a single pass: <code>[${dp.join(', ')}]</code>.`,
    });

    return steps;
  }

  const CODE = [
    ['sig', '<span class="kw">public int</span>[] CountBits(<span class="kw">int</span> n)'],
    ['', '{'],
    ['alloc', '    <span class="kw">int</span>[] dp = <span class="kw">new int</span>[n + 1];'],
    ['', ''],
    ['for', '    <span class="kw">for</span> (<span class="kw">int</span> i = 1; i &lt;= n; i++)'],
    ['', '    {'],
    ['calc', '        dp[i] = dp[i &gt;&gt; 1] + (i &amp; 1);'],
    ['', '    }'],
    ['', ''],
    ['ret', '    <span class="kw">return</span> dp;'],
    ['', '}'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Start', ''],
    step: ['DP step', ''],
    done: ['Done', 'ok'],
  };

  let rawVal = '5';
  let steps = [];
  let idx = 0;
  let timer = null;

  function parse(raw) {
    const trimmed = raw.trim();
    if (!/^\d+$/.test(trimmed)) return null;
    const v = Number(trimmed);
    return Number.isInteger(v) && v >= 0 && v <= 15 ? v : null;
  }

  function renderBin(k) {
    if (k === 0) return '<span class="lsb">0</span>';
    const s = k.toString(2);
    const prefix = s.slice(0, -1);
    const lsb = s.slice(-1);
    return `<span class="prefix">${prefix}</span><span class="lsb">${lsb}</span>`;
  }

  function render() {
    const st = steps[idx];

    $('dp-grid').innerHTML = st.dp.map((val, k) => {
      let cls = 'dp-cell';
      if (k === st.i) cls += ' cur';
      else if (k === st.half) cls += ' ref';
      if (val === null) cls += ' pending';
      return `<div class="${cls}">
        <span class="idx">i = ${k}</span>
        <span class="bin">${renderBin(k)}</span>
        <span class="val">${val === null ? '?' : val}</span>
      </div>`;
    }).join('');

    const vars = [
      ['i', st.i === undefined ? '—' : st.i],
      ['i >> 1', st.half === undefined ? '—' : st.half],
      ['i & 1', st.lsb === undefined ? '—' : st.lsb],
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

    document.querySelectorAll('.presets button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.n === rawVal)));
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Play';
  }

  function restart(raw, num) {
    stop();
    rawVal = raw;
    steps = buildSteps(num);
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
    $('num-in').value = b.dataset.n;
    $('num-err').hidden = true;
    restart(b.dataset.n, parse(b.dataset.n));
  }));
  $('num-in').addEventListener('input', (e) => {
    const parsed = parse(e.target.value);
    if (parsed === null) { $('num-err').hidden = false; return; }
    $('num-err').hidden = true;
    restart(e.target.value.trim(), parsed);
  });
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(rawVal, parse(rawVal));
})();
