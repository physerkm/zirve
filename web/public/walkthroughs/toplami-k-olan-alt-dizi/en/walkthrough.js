(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_LEN = 10;

  function buildSteps(vals, k) {
    const steps = [];
    const map = new Map([[0, 1]]);
    const prefixes = [];
    let curSum = 0;
    let count = 0;
    let curIdx = -1;
    let num;
    let need;

    const cloneMap = () => Array.from(map.entries());
    const snap = (s) => steps.push({
      vals, k,
      prefixes: prefixes.slice(),
      mapEntries: cloneMap(),
      curIdx, num, curSum, need, count,
      probe: null,
      updatedKey: null,
      matchedIdx: false,
      changed: [],
      ...s,
    });

    snap({
      kind: 'start',
      lines: ['dict', 'cur', 'cnt'],
      changed: ['curSum', 'count'],
      updatedKey: 0,
      text: `Start the dictionary with <code>{0: 1}</code>, which represents the empty prefix. <code>curSum = 0</code>, <code>count = 0</code>, target <code>k = ${k}</code>.`,
    });

    for (let i = 0; i < vals.length; i++) {
      curIdx = i;
      num = vals[i];
      curSum += num;
      prefixes[i] = curSum;
      need = curSum - k;
      const freq = map.get(need) || 0;

      if (freq > 0) {
        count += freq;
        snap({
          kind: 'hit',
          lines: ['foreach', 'add', 'if', 'inc-cnt'],
          changed: ['num', 'curSum', 'need', 'count'],
          probe: { key: need, found: true, freq },
          matchedIdx: true,
          text: `<code>num = ${num}</code> added → <code>curSum = ${curSum}</code>. Is <code>curSum - k = ${curSum} - (${k}) = ${need}</code> in the dictionary? <b>Yes (${freq} times).</b> So <b>${freq}</b> valid subarrays end here! <code>count</code> → <b>${count}</b>.`,
        });
      } else {
        snap({
          kind: 'miss',
          lines: ['foreach', 'add', 'if'],
          changed: ['num', 'curSum', 'need'],
          probe: { key: need, found: false, freq: 0 },
          text: `<code>num = ${num}</code> added → <code>curSum = ${curSum}</code>. Is <code>curSum - k = ${need}</code> in the dictionary? <b>No.</b> <code>count</code> is unchanged (${count}).`,
        });
      }

      const newFreq = (map.get(curSum) || 0) + 1;
      map.set(curSum, newFreq);
      snap({
        kind: 'save',
        lines: ['save'],
        updatedKey: curSum,
        text: `The current prefix sum <code>${curSum}</code> is recorded in the dictionary: <code>prefixCounts[${curSum}] = ${newFreq}</code>.`,
      });
    }

    curIdx = vals.length;
    num = undefined;
    need = undefined;
    snap({
      kind: 'done',
      lines: ['ret'],
      text: `The scan of the array is done. Found <b>${count}</b> subarrays in total that sum to <code>${k}</code>; <code>return ${count}</code>.`,
    });

    return steps;
  }

  const CODE = [
    ['dict', '<span class="kw">var</span> prefixCounts = <span class="kw">new</span> Dictionary&lt;<span class="kw">int</span>, <span class="kw">int</span>&gt; { [0] = 1 };'],
    ['cur', '<span class="kw">int</span> curSum = 0;'],
    ['cnt', '<span class="kw">int</span> count = 0;'],
    ['', ''],
    ['foreach', '<span class="kw">foreach</span> (<span class="kw">int</span> num <span class="kw">in</span> nums)'],
    ['', '{'],
    ['add', '    curSum += num;'],
    ['', ''],
    ['if', '    <span class="kw">if</span> (prefixCounts.TryGetValue(curSum - k, <span class="kw">out int</span> freq))'],
    ['inc-cnt', '        count += freq;'],
    ['', ''],
    ['save', '    prefixCounts[curSum] = prefixCounts.GetValueOrDefault(curSum, 0) + 1;'],
    ['', '}'],
    ['', ''],
    ['ret', '<span class="kw">return</span> count;'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Start', ''],
    hit: ['Subarray Found', 'ok'],
    miss: ['No Match', 'skip'],
    save: ['Update Dictionary', ''],
    done: ['Done', 'ok'],
  };

  let listText = '3, 4, 7, 2, -3, 1, 4, 2';
  let kText = '7';
  let steps = [];
  let idx = 0;
  let timer = null;

  function parseInputs(rawList, rawK) {
    const parts = rawList.split(/[\s,]+/).filter(Boolean);
    if (parts.length === 0 || parts.length > MAX_LEN) return null;
    const nums = parts.map(Number);
    if (!nums.every((v) => Number.isInteger(v) && v >= -99 && v <= 99)) return null;
    const kVal = Number(rawK.trim());
    if (rawK.trim() === '' || !Number.isInteger(kVal) || kVal < -999 || kVal > 999) return null;
    return { nums, k: kVal };
  }

  function renderNums(st) {
    return st.vals.map((v, i) => {
      const isCur = i === st.curIdx;
      const isDone = i < st.curIdx;
      const tag = isCur ? '<span class="t-num">num</span>' : '';
      let state = 'plain';
      if (isCur) state = st.matchedIdx ? 'best' : 'run';
      else if (isDone) state = 'done';
      const cls = `chip${isCur ? ' cur' : ''}`;
      const pSum = i < st.prefixes.length ? `Σ=${st.prefixes[i]}` : '';
      return `<div class="item"><div class="tags">${tag}</div><div class="${cls}" data-state="${state}">${v}</div><div class="sub-sum">${pSum}</div></div>`;
    }).join('');
  }

  function renderMap(st) {
    const items = st.mapEntries.map(([key, freq]) => ({ key, freq, ghost: false }));
    if (st.probe && !st.probe.found) {
      items.push({ key: st.probe.key, freq: 0, ghost: true });
    }
    return items.map((it) => {
      const isProbe = st.probe && st.probe.key === it.key;
      const isUpdated = st.updatedKey !== null && st.updatedKey === it.key && !it.ghost;
      const tags = [];
      if (isProbe) tags.push(`<span class="t-probe">curSum - k ${it.ghost ? '✗' : '✓'}</span>`);
      if (isUpdated) tags.push('<span class="t-num">+1</span>');

      let cls = 'chip';
      let state = 'plain';
      if (it.ghost) {
        cls += ' ghost';
      } else {
        if (isProbe && st.probe.found) state = 'best';
        else if (isUpdated) state = 'run';
        if (isProbe) cls += ' probe';
        else if (isUpdated) cls += ' cur';
      }
      const label = it.ghost ? `${it.key} : 0` : `${it.key} : ${it.freq}`;
      return `<div class="item"><div class="tags">${tags.join('')}</div><div class="${cls}" data-state="${state}">${label}</div></div>`;
    }).join('');
  }

  function render() {
    const st = steps[idx];
    $('nums-line').innerHTML = renderNums(st);
    $('map-line').innerHTML = renderMap(st);

    const vars = [
      ['num', st.num],
      ['curSum', st.curSum],
      ['curSum - k', st.need],
      ['count', st.count],
    ];
    $('vars').innerHTML = vars.map(([name, v]) => {
      const key = name === 'curSum - k' ? 'need' : name;
      return `<div class="var${st.changed.includes(key) ? ' changed' : ''}"><dt>${name}</dt><dd>${v === undefined ? '—' : v}</dd></div>`;
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
      b.setAttribute('aria-pressed', String(b.dataset.l === listText && b.dataset.k === kText));
    });
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Play';
  }

  function restart(lRaw, kRaw, parsed) {
    stop();
    listText = lRaw;
    kText = kRaw;
    steps = buildSteps(parsed.nums, parsed.k);
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
    $('k-input').value = b.dataset.k;
    $('list-err').hidden = true;
    restart(b.dataset.l, b.dataset.k, parseInputs(b.dataset.l, b.dataset.k));
  }));

  function onInputChange() {
    const parsed = parseInputs($('list').value, $('k-input').value);
    if (!parsed) { $('list-err').hidden = false; return; }
    $('list-err').hidden = true;
    restart($('list').value, $('k-input').value, parsed);
  }
  $('list').addEventListener('input', onInputChange);
  $('k-input').addEventListener('input', onInputChange);

  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(listText, kText, parseInputs(listText, kText));
})();
