(() => {
  const $ = (id) => document.getElementById(id);

  function buildSteps(s, t) {
    const m = s.length;
    const n = t.length;
    const dp = new Array(n + 1).fill(0);
    dp[n] = 1;
    const steps = [];

    const snap = (st) => steps.push({
      dp: dp.slice(),
      i: undefined,
      j: undefined,
      matched: false,
      changed: [],
      ...st,
    });

    snap({
      kind: 'start',
      lines: ['init', 'base'],
      changed: ['dp[0]'],
      text: `The <code>dp</code> array is created with size <code>n + 1 = ${n + 1}</code>. The empty suffix (<code>t[${n}..] = ""</code>) always matches in exactly 1 way, so <code>dp[${n}] = 1</code> is set.`,
    });

    for (let i = m - 1; i >= 0; i--) {
      for (let j = 0; j < n; j++) {
        if (s[i] === t[j]) {
          const oldVal = dp[j];
          const addVal = dp[j + 1];
          dp[j] += dp[j + 1];
          snap({
            kind: 'match',
            i,
            j,
            matched: true,
            lines: ['fori', 'forj', 'if', 'add'],
            changed: ['i', 'j', 'dp[j]', 'dp[0]'],
            text: `<code>i = ${i}</code> (<code>'${s[i]}'</code>) and <code>j = ${j}</code> (<code>'${t[j]}'</code>) match! ` +
              `Skip (<code>${oldVal}</code>) + match (<code>dp[${j + 1}] = ${addVal}</code>) → <code>dp[${j}] = ${dp[j]}</code>.`,
          });
        } else {
          snap({
            kind: 'skip',
            i,
            j,
            matched: false,
            lines: ['fori', 'forj', 'if'],
            changed: ['i', 'j'],
            text: `<code>i = ${i}</code> (<code>'${s[i]}'</code>) ≠ <code>j = ${j}</code> (<code>'${t[j]}'</code>). The characters differ, so <code>dp[${j}] = ${dp[j]}</code> stays the same.`,
          });
        }
      }
    }

    snap({
      kind: 'done',
      lines: ['ret'],
      changed: [],
      text: `The scan is complete. Number of ways to form all of <code>t</code> (<code>t[0..] = "${t}"</code>): <code>dp[0] = ${dp[0]}</code>.`,
    });

    return steps;
  }

  const CODE = [
    ['init', '<span class="kw">long</span>[] dp = <span class="kw">new</span> <span class="kw">long</span>[n + 1];'],
    ['base', 'dp[n] = 1;'],
    ['', ''],
    ['fori', '<span class="kw">for</span> (<span class="kw">int</span> i = m - 1; i &gt;= 0; i--)'],
    ['', '{'],
    ['forj', '    <span class="kw">for</span> (<span class="kw">int</span> j = 0; j &lt; n; j++)'],
    ['', '    {'],
    ['if', '        <span class="kw">if</span> (s[i] == t[j])'],
    ['add', '            dp[j] += dp[j + 1];'],
    ['', '    }'],
    ['', '}'],
    ['ret', '<span class="kw">return</span> (<span class="kw">int</span>)dp[0];'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Start', ''],
    match: ['Match', 'ok'],
    skip: ['Different letter', 'skip'],
    done: ['Done', 'ok'],
  };

  let curS = 'babgbag';
  let curT = 'bag';
  let steps = [];
  let idx = 0;
  let timer = null;

  function render() {
    const st = steps[idx];

    $('s-row').innerHTML = curS.split('').map((ch, k) => {
      let cls = 'chip';
      if (st.i !== undefined) {
        if (k === st.i) cls += st.matched ? ' match' : ' cur';
        else if (k > st.i) cls += ' done';
      }
      return `<div class="item"><span class="idx-lbl">i=${k}</span><div class="${cls}">${ch}</div></div>`;
    }).join('');

    $('dp-row').innerHTML = st.dp.map((val, j) => {
      const ch = j < curT.length ? `'${curT[j]}'` : '""';
      const suffix = j < curT.length ? curT.slice(j) : '∅';
      let cls = 'chip';
      if (st.j === j) cls += st.matched ? ' match' : ' cur';
      else if (st.matched && st.j + 1 === j) cls += ' probe';
      return `<div class="item"><span class="idx-lbl">j=${j} (${ch})</span><div class="${cls}">${val}</div><span class="sub-lbl">${suffix}</span></div>`;
    }).join('');

    const vars = [
      ['i (s)', st.i !== undefined ? `${st.i} ('${curS[st.i]}')` : '—'],
      ['j (t)', st.j !== undefined ? `${st.j} ('${curT[st.j]}')` : '—'],
      ['dp[j]', st.j !== undefined ? st.dp[st.j] : '—'],
      ['dp[0]', st.dp[0]],
    ];
    $('vars').innerHTML = vars.map(([name, v]) => {
      const key = name.split(' ')[0];
      return `<div class="var${st.changed.includes(key) ? ' changed' : ''}"><dt>${name}</dt><dd>${v}</dd></div>`;
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
      b.setAttribute('aria-pressed', String(b.dataset.s === curS && b.dataset.t === curT));
    });
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Play';
  }

  function restart(sVal, tVal) {
    stop();
    curS = sVal;
    curT = tVal;
    steps = buildSteps(curS, curT);
    idx = 0;
    render();
  }

  function validateAndRestart() {
    const sVal = $('s-in').value.trim();
    const tVal = $('t-in').value.trim();
    if (sVal.length < 1 || sVal.length > 8 || tVal.length < 1 || tVal.length > 6) {
      $('err').hidden = false;
      return;
    }
    $('err').hidden = true;
    restart(sVal, tVal);
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
    $('s-in').value = b.dataset.s;
    $('t-in').value = b.dataset.t;
    $('err').hidden = true;
    restart(b.dataset.s, b.dataset.t);
  }));

  $('s-in').addEventListener('input', validateAndRestart);
  $('t-in').addEventListener('input', validateAndRestart);

  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(curS, curT);
})();
