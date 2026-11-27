(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_LEN = 10;

  function buildSteps(vals, k) {
    const steps = [];
    const count = new Map();
    const buckets = Array.from({ length: vals.length + 1 }, () => []);
    const result = [];
    let activeNumIdx = -1;
    let activePairKey = undefined;
    let activeBucket = -1;
    let numVar = undefined;
    let freqVar = undefined;
    let fVar = undefined;

    const snap = (s) => steps.push({
      count: Array.from(count.entries()),
      buckets: buckets.map((b) => b.slice()),
      result: result.slice(),
      activeNumIdx,
      activePairKey,
      activeBucket,
      numVar,
      freqVar,
      fVar,
      kVar: k,
      changed: [],
      ...s,
    });

    snap({
      kind: 'start',
      lines: ['dict', 'b-init'],
      changed: [],
      text: `Start: <code>nums</code> has ${vals.length} elements, and we are looking for the <code>k = ${k}</code> most frequent ones. The frequency table <code>count</code> is empty.`,
    });

    for (let i = 0; i < vals.length; i++) {
      activeNumIdx = i;
      const v = vals[i];
      numVar = v;
      const nextFreq = (count.get(v) || 0) + 1;
      count.set(v, nextFreq);
      freqVar = nextFreq;
      snap({
        kind: 'count',
        lines: ['loop1', 'inc'],
        changed: ['num', 'freq'],
        text: `Read <code>nums[${i}] = ${v}</code>. <code>count[${v}]</code> is now <b>${nextFreq}</b>.`,
      });
    }

    activeNumIdx = -1;
    for (const [key, freq] of count.entries()) {
      activePairKey = key;
      numVar = key;
      freqVar = freq;
      activeBucket = freq;
      buckets[freq].push(key);
      snap({
        kind: 'bucket',
        lines: ['loop2', 'b-add'],
        changed: ['num', 'freq'],
        text: `<code>${key}</code> appears <b>${freq}</b> times in total, so it was added to bucket <code>buckets[${freq}]</code>.`,
      });
    }

    activePairKey = undefined;
    numVar = undefined;
    freqVar = undefined;

    for (let f = buckets.length - 1; f >= 1 && result.length < k; f--) {
      fVar = f;
      activeBucket = f;
      if (buckets[f].length === 0) {
        snap({
          kind: 'skip',
          lines: ['loop3', 'b-null'],
          changed: ['f'],
          text: `Bucket <code>f = ${f}</code> is empty; we move to the next lower frequency.`,
        });
        continue;
      }

      for (const item of buckets[f]) {
        numVar = item;
        result.push(item);
        snap({
          kind: 'collect',
          lines: ['loop3', 'res-add', 'check-k'],
          changed: ['f', 'num'],
          text: `Took <b>${item}</b> from bucket <code>buckets[${f}]</code> and added it to <code>result</code> (${result.length}/${k}).`,
        });
        if (result.length === k) break;
      }
    }

    activeBucket = -1;
    snap({
      kind: 'done',
      lines: ['ret'],
      changed: [],
      text: `Collected <code>k = ${k}</code> elements! Result: <code>[${result.join(', ')}]</code>.`,
    });

    return steps;
  }

  const CODE = [
    ['dict', 'Dictionary&lt;<span class="kw">int</span>, <span class="kw">int</span>&gt; count = <span class="kw">new</span>();'],
    ['loop1', '<span class="kw">foreach</span> (<span class="kw">int</span> num <span class="kw">in</span> nums)'],
    ['inc', '    count[num] = count.GetValueOrDefault(num, 0) + 1;'],
    ['', ''],
    ['b-init', 'List&lt;<span class="kw">int</span>&gt;[] buckets = <span class="kw">new</span> List&lt;<span class="kw">int</span>&gt;[nums.Length + 1];'],
    ['loop2', '<span class="kw">foreach</span> (<span class="kw">var</span> (num, freq) <span class="kw">in</span> count)'],
    ['b-add', '    (buckets[freq] ??= <span class="kw">new</span>()).Add(num);'],
    ['', ''],
    ['loop3', '<span class="kw">for</span> (<span class="kw">int</span> f = buckets.Length - 1; f &gt;= 1; f--)'],
    ['b-null', '    <span class="kw">if</span> (buckets[f] != <span class="kw">null</span>)'],
    ['res-add', '        <span class="kw">foreach</span> (<span class="kw">int</span> num <span class="kw">in</span> buckets[f]) { result[idx++] = num;'],
    ['check-k', '            <span class="kw">if</span> (idx == k) <span class="kw">return</span> result; }'],
    ['ret', '<span class="kw">return</span> result;'],
  ];

  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Start', ''],
    count: ['Count frequency', ''],
    bucket: ['Place in bucket', ''],
    skip: ['Empty bucket', 'skip'],
    collect: ['Add to result', ''],
    done: ['Done', 'ok'],
  };

  let vals = [1, 1, 1, 2, 2, 3];
  let kVal = 2;
  let steps = [];
  let idx = 0;
  let timer = null;

  function parseInputs(rawList, rawK) {
    const parts = rawList.split(/[\s,]+/).filter(Boolean);
    if (parts.length === 0 || parts.length > MAX_LEN) return null;
    const nums = parts.map(Number);
    if (!nums.every((v) => Number.isInteger(v) && v >= -999 && v <= 999)) return null;
    const uniqueCount = new Set(nums).size;
    const k = Number(rawK);
    if (!Number.isInteger(k) || k < 1 || k > uniqueCount) return null;
    return { nums, k };
  }

  function render() {
    const st = steps[idx];

    $('nums-row').innerHTML = vals.map((v, i) => {
      let cls = 'mini';
      if (i === st.activeNumIdx) cls += ' now';
      else if (st.activeNumIdx > i || st.kind !== 'count' && st.kind !== 'start') cls += ' done';
      return `<span class="${cls}">${v}</span>`;
    }).join('');

    $('count-row').innerHTML = st.count.length === 0
      ? '<span class="empty-note">empty so far</span>'
      : st.count.map(([num, freq]) => {
        const active = st.activePairKey === num || (st.kind === 'count' && st.numVar === num);
        return `<span class="mini${active ? ' now' : ''}">${num}<span class="sub">×${freq}</span></span>`;
      }).join('');

    let bHtml = '';
    for (let f = 1; f < st.buckets.length; f++) {
      const items = st.buckets[f];
      const isCur = st.activeBucket === f;
      let cls = 'bucket';
      if (isCur) cls += ' cur';
      const chips = items.length === 0
        ? '<span class="empty-note">—</span>'
        : items.map((v) => `<span class="b-chip${st.result.includes(v) ? ' taken' : ''}">${v}</span>`).join('');
      bHtml += `<div class="${cls}"><div class="bucket-hdr">f = ${f}</div><div class="bucket-items">${chips}</div></div>`;
    }
    $('buckets-row').innerHTML = bHtml;

    $('result-row').innerHTML = st.result.length === 0
      ? '<span class="empty-note">[ ]</span>'
      : st.result.map((v) => `<span class="mini good">${v}</span>`).join('');

    const vars = [
      ['num', st.numVar],
      ['freq', st.freqVar],
      ['f (kova)', st.fVar],
      ['result.Len / k', `${st.result.length} / ${st.kVar}`],
    ];
    $('vars').innerHTML = vars.map(([name, v]) =>
      `<div class="var${st.changed.includes(name.split(' ')[0]) ? ' changed' : ''}"><dt>${name}</dt><dd>${v === undefined ? '—' : v}</dd></div>`
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

    const curRaw = $('list').value.trim();
    const curK = $('k-input').value.trim();
    document.querySelectorAll('.presets button').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.l === curRaw && b.dataset.k === curK));
    });
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Play';
  }

  function restart(nums, k) {
    stop();
    vals = nums;
    kVal = k;
    steps = buildSteps(vals, kVal);
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
    }, 1000);
  });

  document.querySelectorAll('.presets button').forEach((b) => b.addEventListener('click', () => {
    $('list').value = b.dataset.l;
    $('k-input').value = b.dataset.k;
    $('list-err').hidden = true;
    const parsed = parseInputs(b.dataset.l, b.dataset.k);
    if (parsed) restart(parsed.nums, parsed.k);
  }));

  function handleInput() {
    const parsed = parseInputs($('list').value, $('k-input').value);
    if (!parsed) { $('list-err').hidden = false; return; }
    $('list-err').hidden = true;
    restart(parsed.nums, parsed.k);
  }

  $('list').addEventListener('input', handleInput);
  $('k-input').addEventListener('input', handleInput);
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(vals, kVal);
})();
