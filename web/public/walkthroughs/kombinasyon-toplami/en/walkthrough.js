(() => {
  const $ = (id) => document.getElementById(id);

  const PRESETS = [
    { candidates: [2, 3, 6, 7], target: 7 },
    { candidates: [2, 3, 5], target: 8 },
    { candidates: [3, 4], target: 5 },
  ];

  function buildSteps(candidates, target) {
    const steps = [];
    const path = [];
    const result = [];

    const snap = (s) => steps.push({
      candidates,
      target,
      path: path.slice(),
      result: result.map((r) => r.slice()),
      start: 0,
      i: undefined,
      remaining: target,
      changed: [],
      ...s,
    });

    snap({
      kind: 'start',
      lines: ['init', 'call'],
      changed: ['remaining'],
      text: `Start: <code>candidates = [${candidates.join(', ')}]</code>, <code>target = ${target}</code>. We start the search with <code>Backtrack(0, ${target})</code>.`,
    });

    function backtrack(start, remaining) {
      if (remaining === 0) {
        result.push(path.slice());
        snap({
          kind: 'ok',
          start,
          remaining,
          lines: ['base-zero', 'add-res'],
          changed: ['result'],
          text: `<code>remaining == 0</code>! The target is reached. The combination <code>[${path.join(', ')}]</code> is added to the result.`,
        });
        return;
      }

      if (remaining < 0) {
        snap({
          kind: 'skip',
          start,
          remaining,
          lines: ['base-neg', 'ret-neg'],
          text: `<code>remaining = ${remaining} &lt; 0</code>. The target was exceeded; we prune this branch and backtrack.`,
        });
        return;
      }

      for (let i = start; i < candidates.length; i++) {
        const val = candidates[i];
        path.push(val);
        snap({
          kind: 'choose',
          start,
          i,
          remaining: remaining - val,
          lines: ['for', 'push', 'recurse'],
          changed: ['i', 'path', 'remaining'],
          text: `<code>i = ${i}</code> (candidate <code>${val}</code>) is chosen. <code>path = [${path.join(', ')}]</code>, new remaining: <code>${remaining} - ${val} = ${remaining - val}</code>.`,
        });

        backtrack(i, remaining - val);

        path.pop();
        snap({
          kind: 'back',
          start,
          i,
          remaining,
          lines: ['pop'],
          changed: ['path', 'remaining'],
          text: `Backtrack: <code>${val}</code> is removed from the path. <code>path = [${path.join(', ')}]</code>, <code>remaining = ${remaining}</code>.`,
        });
      }
    }

    backtrack(0, target);

    snap({
      kind: 'done',
      lines: ['ret'],
      text: `The search is complete. <b>${result.length}</b> valid combinations were found in total.`,
    });

    return steps;
  }

  const CODE = [
    ['init', 'IList&lt;IList&lt;<span class="kw">int</span>&gt;&gt; result = <span class="kw">new</span> List&lt;IList&lt;<span class="kw">int</span>&gt;&gt;();'],
    ['', '<span class="kw">void</span> Backtrack(<span class="kw">int</span> start, <span class="kw">int</span> remaining)'],
    ['', '{'],
    ['base-zero', '    <span class="kw">if</span> (remaining == 0)'],
    ['', '    {'],
    ['add-res', '        result.Add(<span class="kw">new</span> List&lt;<span class="kw">int</span>&gt;(path)); <span class="kw">return</span>;'],
    ['', '    }'],
    ['base-neg', '    <span class="kw">if</span> (remaining &lt; 0)'],
    ['ret-neg', '        <span class="kw">return</span>;'],
    ['', ''],
    ['for', '    <span class="kw">for</span> (<span class="kw">int</span> i = start; i &lt; candidates.Length; i++)'],
    ['', '    {'],
    ['push', '        path.Add(candidates[i]);'],
    ['recurse', '        Backtrack(i, remaining - candidates[i]);'],
    ['pop', '        path.RemoveAt(path.Count - 1);'],
    ['', '    }'],
    ['', '}'],
    ['call', 'Backtrack(0, target);'],
    ['ret', '<span class="kw">return</span> result;'],
  ];

  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Start', ''],
    choose: ['Choose candidate', ''],
    ok: ['Combination found', 'ok'],
    skip: ['Target exceeded (prune)', 'skip'],
    back: ['Backtrack (pop)', ''],
    done: ['Done', 'ok'],
  };

  let presetIdx = 0;
  let steps = [];
  let idx = 0;
  let timer = null;

  function render() {
    const st = steps[idx];

    $('cand-row').innerHTML = st.candidates.map((c, k) => {
      let cls = 'chip';
      if (k === st.i) cls += ' cur';
      else if (k < st.start) cls += ' dim';
      return `<div class="${cls}">${c}</div>`;
    }).join('');

    $('path-row').innerHTML = st.path.length === 0
      ? '<p class="empty-note">empty []</p>'
      : st.path.map((v) => {
        let cls = 'chip path-item';
        if (st.kind === 'ok') cls = 'chip ok-item';
        else if (st.kind === 'skip') cls = 'chip bad-item';
        return `<div class="${cls}">${v}</div>`;
      }).join('');

    $('res-row').innerHTML = st.result.length === 0
      ? '<p class="empty-note">none yet</p>'
      : st.result.map((r) => `<span class="res-badge">[${r.join(', ')}]</span>`).join('');

    const vars = [
      ['start', st.start],
      ['i', st.i],
      ['remaining', st.remaining],
      ['path', `[${st.path.join(', ')}]`],
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
    const { candidates, target } = PRESETS[presetIdx];
    steps = buildSteps(candidates, target);
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
