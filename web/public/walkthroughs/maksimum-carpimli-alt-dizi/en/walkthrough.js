(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_LEN = 10;

  function buildSteps(vals) {
    const steps = [];
    const history = vals.map(() => null);
    let curMax = vals[0];
    let curMin = vals[0];
    let result = vals[0];
    let i = 0;
    let n = vals[0];
    let bestIdx = 0;
    history[0] = { max: curMax, min: curMin };

    const snap = (extra) => steps.push({
      vals, history: history.map((h) => (h ? { ...h } : null)),
      i, n, curMax, curMin, result, bestIdx, changed: [], ...extra,
    });

    snap({
      kind: 'start',
      lines: ['init1', 'init2', 'init3'],
      changed: ['curMax', 'curMin', 'result'],
      text: `We start with the first element: <code>curMax = ${curMax}</code>, <code>curMin = ${curMin}</code>, <code>result = ${result}</code>.`,
    });

    for (let idx = 1; idx < vals.length; idx++) {
      i = idx;
      n = vals[idx];

      if (n < 0) {
        const oldMax = curMax;
        const oldMin = curMin;
        curMax = oldMin;
        curMin = oldMax;
        snap({
          kind: 'swap',
          lines: ['for', 'n', 'if', 'sw1', 'sw2', 'sw3'],
          changed: ['n', 'curMax', 'curMin'],
          text: `<code>i = ${i}</code>, <code>n = ${n}</code> (negative). Since multiplying by a negative number flips the sign, <code>curMax</code> (${oldMax}) and <code>curMin</code> (${oldMin}) are swapped.`,
        });
      }

      const prevMax = curMax;
      const prevMin = curMin;
      const prevRes = result;
      curMax = Math.max(n, curMax * n);
      curMin = Math.min(n, curMin * n);
      result = Math.max(result, curMax);
      const isNewBest = result > prevRes;
      if (isNewBest) bestIdx = i;
      history[i] = { max: curMax, min: curMin };

      snap({
        kind: isNewBest ? 'best' : 'step',
        lines: ['for', 'n', 'upMax', 'upMin', 'upRes'],
        changed: isNewBest ? ['n', 'curMax', 'curMin', 'result'] : ['n', 'curMax', 'curMin'],
        text: `<code>n = ${n}</code>: <code>curMax = max(${n}, ${prevMax} * ${n}) = ${curMax}</code>, ` +
          `<code>curMin = min(${n}, ${prevMin} * ${n}) = ${curMin}</code>. ` +
          `<code>result = max(${prevRes}, ${curMax}) = <b>${result}</b></code>.` +
          (isNewBest ? ' New largest product!' : ''),
      });
    }

    i = undefined;
    n = undefined;
    snap({
      kind: 'done',
      lines: ['ret'],
      changed: [],
      text: `The array is done. <code>return result</code> → <b>${result}</b>.`,
    });

    return steps;
  }

  const CODE = [
    ['init1', '<span class="kw">int</span> curMax = nums[0];'],
    ['init2', '<span class="kw">int</span> curMin = nums[0];'],
    ['init3', '<span class="kw">int</span> result = nums[0];'],
    ['', ''],
    ['for', '<span class="kw">for</span> (<span class="kw">int</span> i = 1; i &lt; nums.Length; i++)'],
    ['', '{'],
    ['n', '    <span class="kw">int</span> n = nums[i];'],
    ['if', '    <span class="kw">if</span> (n &lt; 0)'],
    ['', '    {'],
    ['sw1', '        <span class="kw">int</span> temp = curMax;'],
    ['sw2', '        curMax = curMin;'],
    ['sw3', '        curMin = temp;'],
    ['', '    }'],
    ['upMax', '    curMax = Math.Max(n, curMax * n);'],
    ['upMin', '    curMin = Math.Min(n, curMin * n);'],
    ['upRes', '    result = Math.Max(result, curMax);'],
    ['', '}'],
    ['ret', '<span class="kw">return</span> result;'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Start', ''],
    swap: ['Negative: swap', 'swap'],
    step: ['Update', ''],
    best: ['New record', 'ok'],
    done: ['Done', 'ok'],
  };

  let listText = '2, 3, -2, 4';
  let steps = [];
  let idx = 0;
  let timer = null;

  function parse(raw) {
    const parts = raw.split(/[\s,]+/).filter(Boolean);
    if (parts.length < 1 || parts.length > MAX_LEN) return null;
    const out = parts.map(Number);
    return out.every((v) => Number.isInteger(v) && v >= -10 && v <= 10) ? out : null;
  }

  function renderLine(st) {
    return st.vals.map((v, k) => {
      const tags = [];
      if (k === st.i) tags.push('<span class="t-num">n = nums[' + k + ']</span>');
      let cls = 'chip';
      if (v < 0) cls += ' neg';
      if (k === st.i) cls += ' cur';

      let state = 'plain';
      if (st.history[k]) {
        state = k === st.bestIdx ? 'best' : 'seen';
      }

      const h = st.history[k];
      const trackHtml = h
        ? `<div class="track-box"><span class="max-v">max: ${h.max}</span><span class="min-v">min: ${h.min}</span></div>`
        : `<div class="track-box">max: —<br>min: —</div>`;

      return `<div class="item">
        <div class="tags">${tags.join('')}</div>
        <div class="${cls}" data-state="${state}">${v}</div>
        ${trackHtml}
      </div>`;
    }).join('');
  }

  function render() {
    const st = steps[idx];
    $('nline').innerHTML = renderLine(st);

    const vars = [
      ['n', st.n],
      ['curMax', st.curMax],
      ['curMin', st.curMin],
      ['result', st.result],
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

    document.querySelectorAll('.presets button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.l === listText)));
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Play';
  }

  function restart(text, parsed) {
    stop();
    listText = text;
    steps = buildSteps(parsed);
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
