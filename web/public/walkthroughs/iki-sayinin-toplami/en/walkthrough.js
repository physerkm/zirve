(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_LEN = 10;

  function buildSteps(nums, target) {
    const steps = [];
    const entries = [];
    const findEntry = (k) => entries.find((e) => e.k === k);

    const snap = (s) => steps.push({
      entries: entries.map((e) => ({ ...e })),
      i: undefined,
      cur: undefined,
      need: undefined,
      j: undefined,
      probe: null,
      addedKey: null,
      ans: null,
      changed: [],
      ...s,
    });

    snap({
      kind: 'start',
      lines: ['dict'],
      text: `The <code>indexByValue</code> dictionary is created empty. Target sum: <code>target = ${target}</code>.`,
    });

    for (let i = 0; i < nums.length; i++) {
      const cur = nums[i];
      const need = target - cur;
      const hit = findEntry(need);

      if (hit) {
        snap({
          kind: 'found',
          i,
          cur,
          need,
          j: hit.v,
          ans: [hit.v, i],
          probe: { key: need, found: true, idx: hit.v },
          lines: ['for', 'if', 'ret-pair'],
          changed: ['i', 'nums[i]', 'target - nums[i]', 'j'],
          text: `<code>i = ${i}</code>, <code>nums[${i}] = ${cur}</code>. Complement we need: <code>${target} - (${cur}) = ${need}</code>. It <b>is</b> in the dictionary (index <code>j = ${hit.v}</code>)! <code>return new[] { ${hit.v}, ${i} }</code>.`,
        });
        return steps;
      }

      snap({
        kind: 'check',
        i,
        cur,
        need,
        probe: { key: need, found: false },
        lines: ['for', 'if'],
        changed: ['i', 'nums[i]', 'target - nums[i]'],
        text: `<code>i = ${i}</code>, <code>nums[${i}] = ${cur}</code>. Complement we need: <code>${target} - (${cur}) = ${need}</code>. It is <b>not</b> in the dictionary.`,
      });

      const existing = findEntry(cur);
      if (existing) existing.v = i;
      else entries.push({ k: cur, v: i });

      snap({
        kind: 'store',
        i,
        cur,
        need,
        addedKey: cur,
        lines: ['store'],
        changed: [],
        text: `<code>indexByValue[${cur}] = ${i}</code> is recorded. If a later number looks for the value <code>${cur}</code>, its index is ready.`,
      });
    }

    snap({
      kind: 'empty',
      lines: ['ret-empty'],
      text: 'The array is done and no two elements add up to the target. <code>return Array.Empty&lt;int&gt;()</code>.',
    });

    return steps;
  }

  const CODE = [
    ['dict', '<span class="kw">var</span> indexByValue = <span class="kw">new</span> Dictionary&lt;<span class="kw">int</span>, <span class="kw">int</span>&gt;();'],
    ['', ''],
    ['for', '<span class="kw">for</span> (<span class="kw">var</span> i = 0; i &lt; nums.Length; i++)'],
    ['', '{'],
    ['if', '    <span class="kw">if</span> (indexByValue.TryGetValue(target - nums[i], <span class="kw">out var</span> j))'],
    ['', '    {'],
    ['ret-pair', '        <span class="kw">return new</span>[] { j, i };'],
    ['', '    }'],
    ['', ''],
    ['store', '    indexByValue[nums[i]] = i;'],
    ['', '}'],
    ['', ''],
    ['ret-empty', '<span class="kw">return</span> Array.Empty&lt;<span class="kw">int</span>&gt;();'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Start', ''],
    check: ['Look up complement', ''],
    store: ['Add to dictionary', ''],
    found: ['Pair found', 'ok'],
    empty: ['Not found', 'skip'],
  };

  let listText = '2, 7, 11, 15';
  let targetText = '9';
  let vals = [];
  let targetVal = 9;
  let steps = [];
  let idx = 0;
  let timer = null;

  function parseList(raw) {
    const parts = raw.split(/[\s,]+/).filter(Boolean);
    if (parts.length < 2 || parts.length > MAX_LEN) return null;
    const out = parts.map(Number);
    return out.every((v) => Number.isInteger(v) && v >= -999 && v <= 999) ? out : null;
  }

  function parseTarget(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isInteger(n) && n >= -999 && n <= 999 ? n : null;
  }

  function renderArray(st) {
    return vals.map((v, k) => {
      const tags = [];
      if (st.ans && st.ans[0] === k) tags.push('<span class="t-good">j</span>');
      if (st.i === k) tags.push('<span class="t-num">i</span>');
      let cls = 'chip';
      let state = 'plain';
      if (st.ans && (st.ans[0] === k || st.ans[1] === k)) state = 'best';
      else if (st.i !== undefined && k < st.i) state = 'seen';
      else if (st.kind === 'store' && st.i === k) state = 'seen';
      if (st.i === k) cls += ' cur';
      return `<div class="item"><div class="tags">${tags.join('')}</div><div class="${cls}" data-state="${state}">${v}</div><div class="idx">${k}</div></div>`;
    }).join('');
  }

  function renderDict(st) {
    const items = st.entries.map((e) => {
      let state = 'plain';
      if (st.addedKey === e.k && st.kind === 'store') state = 'new';
      if (st.probe && st.probe.found && st.probe.key === e.k) state = 'match';
      return `<div class="kv" data-state="${state}"><span>${e.k}</span><span class="arrow">→</span><span class="val">index ${e.v}</span></div>`;
    });
    if (st.probe && !st.probe.found) {
      items.push(`<div class="kv ghost"><span>${st.probe.key}</span><span class="arrow">→</span><span class="val">missing ✗</span></div>`);
    }
    return items.length ? items.join('') : '<p class="empty-note">The dictionary is still empty.</p>';
  }

  function render() {
    const st = steps[idx];
    $('nline').innerHTML = renderArray(st);
    $('dict-row').innerHTML = renderDict(st);

    const vars = [
      ['i', st.i],
      ['nums[i]', st.cur],
      ['target - nums[i]', st.need],
      ['j', st.j],
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

    document.querySelectorAll('.presets button').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.l === listText && b.dataset.t === targetText));
    });
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Play';
  }

  function restart(lText, tText, parsedList, parsedTarget) {
    stop();
    listText = lText;
    targetText = tText;
    vals = parsedList;
    targetVal = parsedTarget;
    steps = buildSteps(vals, targetVal);
    idx = 0;
    render();
  }

  function onInputChange() {
    const pList = parseList($('list').value);
    const pTarget = parseTarget($('target').value);
    if (!pList || pTarget === null) {
      $('list-err').hidden = false;
      return;
    }
    $('list-err').hidden = true;
    restart($('list').value, $('target').value, pList, pTarget);
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
    $('target').value = b.dataset.t;
    $('list-err').hidden = true;
    restart(b.dataset.l, b.dataset.t, parseList(b.dataset.l), parseTarget(b.dataset.t));
  }));
  $('list').addEventListener('input', onInputChange);
  $('target').addEventListener('input', onInputChange);
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(listText, targetText, parseList(listText), parseTarget(targetText));
})();
