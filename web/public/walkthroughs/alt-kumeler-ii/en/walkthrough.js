(() => {
  const $ = (id) => document.getElementById(id);

  const PRESETS = [
    [1, 2, 2],
    [2, 1, 2],
    [5, 5, 5],
  ];

  function buildSteps(rawNums) {
    const nums = rawNums.slice().sort((a, b) => a - b);
    const steps = [];
    const path = [];
    const result = [];

    const snap = (s) => steps.push({
      nums,
      path: path.slice(),
      result: result.map((r) => r.slice()),
      start: 0,
      i: undefined,
      changed: [],
      ...s,
    });

    snap({
      kind: 'start',
      lines: ['sort', 'call'],
      text: `The input <code>[${rawNums.join(', ')}]</code> is sorted → <code>nums = [${nums.join(', ')}]</code>. We start with <code>Backtrack(0)</code>.`,
    });

    function backtrack(start) {
      result.push(path.slice());
      snap({
        kind: 'ok',
        start,
        lines: ['add-res'],
        changed: ['result'],
        text: `The current path <code>[${path.join(', ')}]</code> is a valid subset; it is added to the <code>result</code> list.`,
      });

      for (let i = start; i < nums.length; i++) {
        if (i > start && nums[i] === nums[i - 1]) {
          snap({
            kind: 'skip',
            start,
            i,
            lines: ['for', 'dup-if', 'dup-cont'],
            changed: ['i'],
            text: `<code>i = ${i} &gt; start (${start})</code> and <code>nums[${i}] == nums[${i - 1}] (${nums[i]})</code>. <code>${nums[i]}</code> was already tried on this level; we skip it with <code>continue</code> to avoid a duplicate subset.`,
          });
          continue;
        }

        path.push(nums[i]);
        snap({
          kind: 'choose',
          start,
          i,
          lines: ['for', 'push', 'recurse'],
          changed: ['i', 'path'],
          text: `<code>i = ${i}</code> (element <code>${nums[i]}</code>) is chosen → <code>path = [${path.join(', ')}]</code>. Now <code>Backtrack(${i + 1})</code> is called.`,
        });

        backtrack(i + 1);

        const popped = path.pop();
        snap({
          kind: 'back',
          start,
          i,
          lines: ['pop'],
          changed: ['path'],
          text: `Backtrack: <code>${popped}</code> removed → <code>path = [${path.join(', ')}]</code>.`,
        });
      }
    }

    backtrack(0);

    snap({
      kind: 'done',
      lines: ['ret'],
      text: `The search is complete. <b>${result.length}</b> unique subsets were generated in total.`,
    });

    return steps;
  }

  const CODE = [
    ['sort', 'Array.Sort(nums);'],
    ['', '<span class="kw">void</span> Backtrack(<span class="kw">int</span> start)'],
    ['', '{'],
    ['add-res', '    result.Add(<span class="kw">new</span> List&lt;<span class="kw">int</span>&gt;(path));'],
    ['', ''],
    ['for', '    <span class="kw">for</span> (<span class="kw">int</span> i = start; i &lt; nums.Length; i++)'],
    ['', '    {'],
    ['dup-if', '        <span class="kw">if</span> (i &gt; start &amp;&amp; nums[i] == nums[i - 1])'],
    ['dup-cont', '            <span class="kw">continue</span>;'],
    ['', ''],
    ['push', '        path.Add(nums[i]);'],
    ['recurse', '        Backtrack(i + 1);'],
    ['pop', '        path.RemoveAt(path.Count - 1);'],
    ['', '    }'],
    ['', '}'],
    ['call', 'Backtrack(0);'],
    ['ret', '<span class="kw">return</span> result;'],
  ];

  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Start', ''],
    ok: ['Subset Added', 'ok'],
    choose: ['Choose Element', ''],
    skip: ['Duplicate Skipped', 'skip'],
    back: ['Backtrack (Pop)', ''],
    done: ['Done', 'ok'],
  };

  let presetIdx = 0;
  let steps = [];
  let idx = 0;
  let timer = null;

  function render() {
    const st = steps[idx];

    $('nums-row').innerHTML = st.nums.map((v, k) => {
      let cls = 'chip';
      if (k === st.i) {
        cls += st.kind === 'skip' ? ' skip-dup' : ' cur';
      } else if (k < st.start) {
        cls += ' dim';
      }
      return `<div class="item"><span class="idx-lbl">i=${k}</span><div class="${cls}">${v}</div></div>`;
    }).join('');

    $('path-row').innerHTML = st.path.length === 0
      ? '<p class="empty-note">[] (empty set)</p>'
      : st.path.map((v) => `<div class="chip path-item">${v}</div>`).join('');

    $('res-row').innerHTML = st.result.map((r) => `<span class="res-badge">[${r.join(', ')}]</span>`).join('');

    const vars = [
      ['start', st.start],
      ['i', st.i],
      ['path', `[${st.path.join(', ')}]`],
      ['result.Count', st.result.length],
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

    document.querySelectorAll('.presets button').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.idx) === presetIdx)));
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Play';
  }

  function loadPreset(pIdx) {
    stop();
    presetIdx = pIdx;
    steps = buildSteps(PRESETS[presetIdx]);
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
    }, 950);
  });
  document.querySelectorAll('.presets button').forEach((b) => b.addEventListener('click', () => {
    loadPreset(Number(b.dataset.idx));
  }));
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  loadPreset(0);
})();
