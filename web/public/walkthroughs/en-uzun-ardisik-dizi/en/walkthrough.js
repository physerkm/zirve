(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_LEN = 10;

  // Steps: mirrors Solution.cs line by line.
  // set keeps first-seen order, the order a .NET HashSet<int> built from nums enumerates in.
  // probe: the number checked with set.Contains on this step ({ value, found, kind: 'prev' | 'next' }).
  function buildSteps(vals) {
    const set = [];
    vals.forEach((v) => { if (!set.includes(v)) set.push(v); });
    const has = (v) => set.includes(v);
    const steps = [];
    let longest = 0;
    let num;
    let length;
    let run = [];
    let best = [];
    let visited = -1;
    const snap = (s) => steps.push({
      set, num, length, longest, run: run.slice(), best: best.slice(), visited,
      probe: null, newBest: false, changed: [], ...s,
    });

    const dupCount = vals.length - set.length;
    snap({
      kind: 'start', lines: ['set', 'longest'], changed: ['longest'],
      text: vals.length === 0
        ? 'The array is empty, so the set is empty too. <code>longest = 0</code>.'
        : `All the numbers go into the <code>HashSet</code>` +
          (dupCount > 0 ? `; ${dupCount} duplicate number(s) do not enter the set a second time` : '') +
          `. Set: <code>{${set.join(', ')}}</code>. <code>longest = 0</code>.`,
    });

    for (let k = 0; k < set.length; k++) {
      visited = k;
      num = set[k];
      length = undefined;
      run = [];

      if (has(num - 1)) {
        snap({
          kind: 'skip', lines: ['foreach', 'if', 'continue'], changed: ['num'],
          probe: { value: num - 1, found: true, kind: 'prev' },
          text: `<code>num = ${num}</code>. Is ${num - 1} in the set? <b>Yes.</b> So ${num} does not start a run; we will count this run when we reach its start. We skip it with <code>continue</code>.`,
        });
        continue;
      }

      length = 1;
      run = [num];
      snap({
        kind: 'begin', lines: ['foreach', 'if', 'length'], changed: ['num', 'length'],
        probe: { value: num - 1, found: false, kind: 'prev' },
        text: `<code>num = ${num}</code>. Is ${num - 1} in the set? <b>No.</b> So ${num} starts a run. We start counting with <code>length = 1</code>.`,
      });

      while (has(num + length)) {
        const v = num + length;
        length++;
        run = [...run, v];
        snap({
          kind: 'grow', lines: ['while', 'inc'], changed: ['length'],
          probe: { value: v, found: true, kind: 'next' },
          text: `Is ${v} in the set? <b>Yes.</b> The run continues: <code>length++</code> → ${length}.`,
        });
      }

      const missing = num + length;
      const old = longest;
      longest = Math.max(longest, length);
      const isNewBest = length > old;
      if (isNewBest) best = run.slice();
      snap({
        kind: 'stop', lines: ['while', 'max'], changed: isNewBest ? ['longest'] : [], newBest: isNewBest,
        probe: { value: missing, found: false, kind: 'next' },
        text: `Is ${missing} in the set? <b>No.</b> The run is over: ${run.join(', ')} → length ${length}. ` +
          `<code>longest = Math.Max(${old}, ${length})</code> → ${longest}.` +
          (isNewBest ? ' This is the longest run so far.' : ''),
      });
    }

    visited = set.length;
    num = undefined;
    length = undefined;
    run = [];
    snap({
      kind: 'done', lines: ['ret'],
      text: set.length === 0
        ? 'The set is empty, so the loop never ran. <code>return longest</code> → 0.'
        : `Every number in the set has been checked. <code>return longest</code> → ${longest}. Longest run: ${best.join(', ')}.`,
    });
    return steps;
  }

  // Rendering
  const CODE = [
    ['set', 'HashSet&lt;<span class="kw">int</span>&gt; set = <span class="kw">new</span> HashSet&lt;<span class="kw">int</span>&gt;(nums);'],
    ['longest', '<span class="kw">int</span> longest = 0;'],
    ['', ''],
    ['foreach', '<span class="kw">foreach</span> (<span class="kw">int</span> num <span class="kw">in</span> set)'],
    ['', '{'],
    ['if', '    <span class="kw">if</span> (set.Contains(num - 1))'],
    ['continue', '        <span class="kw">continue</span>;'],
    ['', ''],
    ['length', '    <span class="kw">int</span> length = 1;'],
    ['while', '    <span class="kw">while</span> (set.Contains(num + length))'],
    ['inc', '        length++;'],
    ['', ''],
    ['max', '    longest = Math.Max(longest, length);'],
    ['', '}'],
    ['', ''],
    ['ret', '<span class="kw">return</span> longest;'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Start', ''], skip: ['Not a run start', 'skip'], begin: ['Run start', ''],
    grow: ['Count', ''], stop: ['Run over', ''], done: ['Done', 'ok'],
  };

  let listText = '100, 4, 200, 1, 3, 2';
  let vals = [];
  let steps = [];
  let idx = 0;
  let timer = null;

  function parse(raw) {
    const parts = raw.split(/[\s,]+/).filter(Boolean);
    if (parts.length > MAX_LEN) return null;
    const out = parts.map(Number);
    return out.every((v) => Number.isInteger(v) && v >= -999 && v <= 999) ? out : null;
  }

  function renderLine(st) {
    if (st.set.length === 0) return '<p class="empty-note">The set is empty.</p>';
    // Sorted set, plus a dashed "ghost" for a probed number that is missing.
    const items = st.set.slice().sort((a, b) => a - b).map((v) => ({ v, ghost: false }));
    if (st.probe && !st.probe.found) {
      items.push({ v: st.probe.value, ghost: true });
      items.sort((a, b) => a.v - b.v);
    }
    let html = '';
    items.forEach((it, k) => {
      if (k > 0 && it.v - items[k - 1].v > 1) html += '<div class="item"><div class="tags"></div><div class="gap" aria-hidden="true">…</div></div>';
      const tags = [];
      if (it.v === st.num && !it.ghost) tags.push('<span class="t-num">num</span>');
      const isProbe = st.probe && st.probe.value === it.v;
      if (isProbe) tags.push(`<span class="t-probe">${st.probe.kind === 'prev' ? 'num - 1' : 'num + length'} ${st.probe.found ? '✓' : '✗'}</span>`);
      let cls = 'chip';
      let state = 'plain';
      if (it.ghost) cls += ' ghost';
      else {
        if (st.run.includes(it.v)) state = st.kind === 'stop' && st.newBest ? 'best' : 'run';
        else if (st.best.includes(it.v)) state = 'best';
        if (isProbe) cls += ' probe';
        else if (it.v === st.num) cls += ' cur';
      }
      html += `<div class="item"><div class="tags">${tags.join('')}</div><div class="${cls}" data-state="${state}">${it.v}</div></div>`;
    });
    return html;
  }

  function render() {
    const st = steps[idx];

    const seen = [];
    $('nums-row').innerHTML = vals.length === 0
      ? '<span class="empty-note">empty</span>'
      : vals.map((v) => {
        const dup = seen.includes(v);
        seen.push(v);
        return `<span class="mini${dup ? ' dup' : ''}">${v}</span>`;
      }).join('');
    $('order-row').innerHTML = st.set.length === 0
      ? '<span class="empty-note">empty</span>'
      : st.set.map((v, k) => `<span class="mini${k === st.visited ? ' now' : k < st.visited ? ' done' : ''}">${v}</span>`).join('');

    $('nline').innerHTML = renderLine(st);

    const vars = [['num', st.num], ['length', st.length], ['longest', st.longest]];
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
