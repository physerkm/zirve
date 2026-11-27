(() => {
  const $ = (id) => document.getElementById(id);

  const PRESETS = [
    { s: 'leetcode', dict: ['leet', 'code'] },
    { s: 'cars', dict: ['car', 'ca', 'rs'] },
    { s: 'catsandog', dict: ['cats', 'dog', 'sand', 'and', 'cat'] },
    { s: 'applepen', dict: ['apple', 'pen'] },
  ];

  function buildSteps(s, dict) {
    const n = s.length;
    const dp = new Array(n + 1).fill(false);
    dp[n] = true;
    const steps = [];
    let i;
    let w;

    const snap = (extra) => steps.push({
      s, dict, dp: dp.slice(), i, w,
      spanStart: null, spanEnd: null, matched: false, changed: [], ...extra,
    });

    snap({
      kind: 'start',
      lines: ['dp', 'base'],
      changed: [],
      text: `The <code>dp</code> array was created and <code>dp[${n}] = true</code> was set for the empty suffix.`,
    });

    for (let idx = n - 1; idx >= 0; idx--) {
      i = idx;
      let matchedAny = false;

      for (let k = 0; k < dict.length; k++) {
        w = dict[k];
        const end = i + w.length;

        if (end <= n && dp[end] && s.slice(i, end) === w) {
          dp[i] = true;
          matchedAny = true;
          snap({
            kind: 'match',
            lines: ['for', 'foreach', 'if', 'set', 'brk'],
            changed: ['i', 'w', 'dp[i]'],
            spanStart: i,
            spanEnd: end,
            matched: true,
            text: `<code>i = ${i}</code>, <code>w = "${w}"</code>: <code>s[${i}..${end}] == "${w}"</code> and <code>dp[${end}] == true</code>! <code>dp[${i}] = true</code> is set and we exit with <code>break</code>.`,
          });
          break;
        }
      }

      if (!matchedAny) {
        w = dict[dict.length - 1];
        snap({
          kind: 'skip',
          lines: ['for', 'foreach', 'if'],
          changed: ['i'],
          text: `<code>i = ${i}</code> (<code>"${s.slice(i)}"</code>): No dictionary word could connect position <code>i</code> to a valid <code>dp[i + w.Length]</code> point; <code>dp[${i}] = false</code> stays.`,
        });
      }
    }

    i = undefined;
    w = undefined;
    snap({
      kind: dp[0] ? 'done' : 'skip',
      lines: ['ret'],
      changed: [],
      text: `All positions have been scanned. <code>return dp[0]</code> → <b>${dp[0]}</b>.`,
    });

    return steps;
  }

  const CODE = [
    ['dp', '<span class="kw">bool</span>[] dp = <span class="kw">new bool</span>[s.Length + 1];'],
    ['base', 'dp[s.Length] = <span class="kw">true</span>;'],
    ['', ''],
    ['for', '<span class="kw">for</span> (<span class="kw">int</span> i = s.Length - 1; i &gt;= 0; i--)'],
    ['', '{'],
    ['foreach', '    <span class="kw">foreach</span> (<span class="kw">string</span> w <span class="kw">in</span> wordDict)'],
    ['', '    {'],
    ['if', '        <span class="kw">if</span> (i + w.Length &lt;= s.Length &amp;&amp; dp[i + w.Length] &amp;&amp; s.Substring(i, w.Length) == w)'],
    ['', '        {'],
    ['set', '            dp[i] = <span class="kw">true</span>;'],
    ['brk', '            <span class="kw">break</span>;'],
    ['', '        }'],
    ['', '    }'],
    ['', '}'],
    ['ret', '<span class="kw">return</span> dp[0];'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Start', ''],
    match: ['Word matched', 'ok'],
    skip: ['No match', 'skip'],
    done: ['Done', 'ok'],
  };

  let presetIdx = 0;
  let steps = [];
  let idx = 0;
  let timer = null;

  function renderDict(st) {
    return st.dict.map((word) => {
      let cls = 'word-pill';
      if (word === st.w && st.matched) cls += ' match active';
      else if (word === st.w) cls += ' active';
      return `<span class="${cls}">"${word}"</span>`;
    }).join('');
  }

  function renderLine(st) {
    const chars = st.s.split('');
    let html = '';
    for (let k = 0; k <= chars.length; k++) {
      const isBase = k === chars.length;
      const tags = [];
      if (k === st.i) tags.push('<span class="t-num">i</span>');
      if (st.spanEnd !== null && k === st.spanEnd) tags.push('<span class="t-probe">i + |w|</span>');

      let cls = 'chip';
      let state = 'plain';
      if (st.spanStart !== null && k >= st.spanStart && k < st.spanEnd) {
        state = st.matched ? 'match' : 'span';
      }
      if (k === st.i) cls += ' cur';
      else if (k === st.spanEnd) cls += ' end';

      const label = isBase ? '$' : chars[k];
      const badgeCls = st.dp[k] ? 'dp-badge true' : 'dp-badge';

      html += `<div class="item">
        <div class="tags">${tags.join('')}</div>
        <div class="${cls}" data-state="${state}">
          <span>${label}</span>
          <span class="sub">[${k}]</span>
        </div>
        <div class="${badgeCls}">${st.dp[k] ? 'true' : 'false'}</div>
      </div>`;
    }
    return html;
  }

  function render() {
    const st = steps[idx];
    $('dict-row').innerHTML = renderDict(st);
    $('nline').innerHTML = renderLine(st);

    const dpI = st.i !== undefined ? String(st.dp[st.i]) : undefined;
    const vars = [
      ['i', st.i],
      ['w', st.w ? `"${st.w}"` : undefined],
      ['dp[i]', dpI],
      ['dp[0]', String(st.dp[0])],
    ];
    $('vars').innerHTML = vars.map(([name, v]) =>
      `<div class="var${st.changed.includes(name) ? ' changed' : ''}"><dt>${name}</dt><dd>${v === undefined ? '—' : v}</dd></div>`).join('');

    Object.keys(codeLines).forEach((id) => codeLines[id].classList.toggle('hl', st.lines.includes(id)));

    const [tagText, tagKind] = TAGS[st.kind];
    $('step-count').textContent = `Step ${idx + 1} / ${steps.length}`;
    $('step-tag').textContent = tagText;
    $('step-tag').dataset.kind = tagKind;
    $('step-text').innerHTML = st.text;
    $('prev-btn').disabled = idx === 0;
    $('reset').disabled = idx === 0;
    $('next-btn').disabled = idx === steps.length - 1;

    document.querySelectorAll('.presets button').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.p) === presetIdx)));
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Play';
  }

  function restart(pIdx) {
    stop();
    presetIdx = pIdx;
    const p = PRESETS[pIdx];
    steps = buildSteps(p.s, p.dict);
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
