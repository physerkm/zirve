(() => {
  const $ = (id) => document.getElementById(id);

  function buildSteps(cost) {
    const steps = [];
    const dp = new Array(cost.length).fill('—');
    let prev2 = cost[0];
    let prev1 = cost[1];
    dp[0] = prev2;
    dp[1] = prev1;
    let i;
    let cur;

    const snap = (s) => steps.push({
      cost,
      dp: dp.slice(),
      prev2,
      prev1,
      i,
      cur,
      winIdx: -1,
      changed: [],
      ...s,
    });

    snap({
      kind: 'start',
      lines: ['p2', 'p1'],
      changed: ['prev2', 'prev1'],
      text: `Either of the first two steps can be a starting point: <code>prev2 = cost[0] = ${prev2}</code>, <code>prev1 = cost[1] = ${prev1}</code>.`,
    });

    for (let k = 2; k < cost.length; k++) {
      i = k;
      const minPrev = Math.min(prev1, prev2);
      cur = cost[k] + minPrev;
      dp[k] = cur;

      snap({
        kind: 'calc',
        lines: ['for', 'cur'],
        changed: ['i', 'cur'],
        text: `<code>i = ${k}</code>: the step cost is <code>cost[${k}] = ${cost[k]}</code>. The cheaper of the previous two steps is <code>Math.Min(${prev1}, ${prev2}) = ${minPrev}</code>. <code>cur = ${cost[k]} + ${minPrev} = ${cur}</code>.`,
      });

      prev2 = prev1;
      prev1 = cur;
      snap({
        kind: 'shift',
        lines: ['s2', 's1'],
        changed: ['prev2', 'prev1'],
        text: `Sliding the window: <code>prev2 = ${prev2}</code>, <code>prev1 = ${prev1}</code>.`,
      });
    }

    i = undefined;
    cur = undefined;
    const ans = Math.min(prev1, prev2);
    const winIdx = prev1 <= prev2 ? cost.length - 1 : cost.length - 2;
    snap({
      kind: 'done',
      lines: ['ret'],
      winIdx,
      changed: [],
      text: `The loop is done. You can reach the top from the last step (<code>prev1 = ${prev1}</code>) or the second-to-last one (<code>prev2 = ${prev2}</code>). <code>Math.Min(${prev1}, ${prev2}) = ${ans}</code> is returned.`,
    });

    return steps;
  }

  const CODE = [
    ['p2', '<span class="kw">int</span> prev2 = cost[0];'],
    ['p1', '<span class="kw">int</span> prev1 = cost[1];'],
    ['', ''],
    ['for', '<span class="kw">for</span> (<span class="kw">int</span> i = 2; i &lt; cost.Length; i++)'],
    ['', '{'],
    ['cur', '    <span class="kw">int</span> cur = cost[i] + Math.Min(prev1, prev2);'],
    ['s2', '    prev2 = prev1;'],
    ['s1', '    prev1 = cur;'],
    ['', '}'],
    ['', ''],
    ['ret', '<span class="kw">return</span> Math.Min(prev1, prev2);'],
  ];

  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Start', ''],
    calc: ['Compute cost', ''],
    shift: ['Slide', ''],
    done: ['Done', 'ok'],
  };

  let listText = '10, 15, 20';
  let steps = [];
  let idx = 0;
  let timer = null;

  function parse(raw) {
    const parts = raw.split(/[\s,]+/).filter(Boolean);
    if (parts.length < 2 || parts.length > 10) return null;
    const out = parts.map(Number);
    return out.every((v) => Number.isInteger(v) && v >= 0 && v <= 999) ? out : null;
  }

  function render() {
    const st = steps[idx];

    const p2Idx = st.i !== undefined ? (st.kind === 'calc' ? st.i - 2 : st.i - 1) : st.cost.length - 2;
    const p1Idx = st.i !== undefined ? (st.kind === 'calc' ? st.i - 1 : st.i) : st.cost.length - 1;

    $('nline').innerHTML = st.cost.map((c, k) => {
      const tags = [`<span>cost[${k}]=${c}</span>`];
      if (k === st.i) tags.push('<span class="t-num">i</span>');
      if (k === p2Idx) tags.push('<span class="t-probe">prev2</span>');
      if (k === p1Idx) tags.push('<span class="t-probe">prev1</span>');

      let cls = 'chip';
      let state = st.dp[k] !== '—' ? 'run' : 'plain';
      if (k === st.winIdx) state = 'best';
      if (k === st.i) cls += ' cur';
      else if (k === p2Idx || k === p1Idx) cls += ' probe';

      return `<div class="item"><div class="tags">${tags.join('')}</div><div class="${cls}" data-state="${state}">${st.dp[k]}</div></div>`;
    }).join('');

    const vars = [
      ['i', st.i],
      ['prev2', st.prev2],
      ['prev1', st.prev1],
      ['cur', st.cur],
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
