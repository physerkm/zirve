(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_LEN = 7;

  function buildSteps(rawIntervals) {
    const sorted = rawIntervals.map((iv) => [iv[0], iv[1]]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    const states = sorted.map(() => 'pending');
    const steps = [];
    let removed = 0;
    let prevEnd = sorted[0][1];
    let curIdx = 0;

    const snap = (s) => steps.push({
      sorted: sorted.map((x) => x.slice()),
      states: states.slice(),
      removed,
      prevEnd,
      curIdx,
      changed: [],
      ...s,
    });

    states[0] = 'kept';
    snap({
      kind: 'start',
      lines: ['sort', 'removed', 'prev'],
      changed: ['removed', 'prevEnd'],
      text: `The intervals were sorted by end time. The first interval, which ends earliest, <code>[${sorted[0][0]}, ${sorted[0][1]}]</code>, was kept and <code>prevEnd</code> was set to <code>${prevEnd}</code>.`,
    });

    for (let i = 1; i < sorted.length; i++) {
      curIdx = i;
      const [s, e] = sorted[i];
      if (s < prevEnd) {
        removed++;
        states[i] = 'removed';
        snap({
          kind: 'skip',
          lines: ['for', 'if', 'inc'],
          changed: ['i', 'removed'],
          text: `<code>i = ${i}</code> → <code>[${s}, ${e}]</code>. Its start <code>${s} &lt; prevEnd (${prevEnd})</code>, so it overlaps the previous interval! We remove this interval: <code>removed = ${removed}</code>.`,
        });
      } else {
        const oldEnd = prevEnd;
        prevEnd = e;
        states[i] = 'kept';
        snap({
          kind: 'keep',
          lines: ['for', 'if', 'else', 'upd'],
          changed: ['i', 'prevEnd'],
          text: `<code>i = ${i}</code> → <code>[${s}, ${e}]</code>. Its start <code>${s} &ge; prevEnd (${oldEnd})</code>, so there's no overlap. We keep the interval and set <code>prevEnd = ${prevEnd}</code>.`,
        });
      }
    }

    curIdx = -1;
    snap({
      kind: 'done',
      lines: ['ret'],
      changed: [],
      text: `All intervals were scanned. The minimum number of intervals to remove so that none overlap: <code>return ${removed}</code>.`,
    });

    return steps;
  }

  const CODE = [
    ['sort', 'Array.Sort(intervals, (a, b) => a[1].CompareTo(b[1]));'],
    ['removed', '<span class="kw">int</span> removed = 0;'],
    ['prev', '<span class="kw">int</span> prevEnd = intervals[0][1];'],
    ['', ''],
    ['for', '<span class="kw">for</span> (<span class="kw">int</span> i = 1; i &lt; intervals.Length; i++)'],
    ['', '{'],
    ['if', '    <span class="kw">if</span> (intervals[i][0] &lt; prevEnd)'],
    ['inc', '        removed++;'],
    ['else', '    <span class="kw">else</span>'],
    ['upd', '        prevEnd = intervals[i][1];'],
    ['', '}'],
    ['ret', '<span class="kw">return</span> removed;'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Start', ''],
    skip: ['Overlap · Remove', 'skip'],
    keep: ['No overlap · Keep', ''],
    done: ['Done', 'ok'],
  };

  let listText = '1-2, 2-3, 3-4, 1-3';
  let steps = [];
  let idx = 0;
  let timer = null;

  function parse(raw) {
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length < 1 || parts.length > MAX_LEN) return null;
    const out = [];
    for (const p of parts) {
      const m = p.match(/^(-?\d+)\s*-\s*(-?\d+)$/);
      if (!m) return null;
      const a = Number(m[1]);
      const b = Number(m[2]);
      if (!Number.isInteger(a) || !Number.isInteger(b) || a >= b || a < -99 || b > 99) return null;
      out.push([a, b]);
    }
    return out;
  }

  function renderTimeline(st) {
    const mins = st.sorted.map((x) => x[0]);
    const maxs = st.sorted.map((x) => x[1]);
    const minV = Math.min(...mins);
    const maxV = Math.max(...maxs);
    const span = Math.max(1, maxV - minV);
    const pct = (v) => ((v - minV) / span) * 100;

    let html = `<div class="axis"><span>${minV}</span><span>prevEnd = ${st.prevEnd}</span><span>${maxV}</span></div>`;
    st.sorted.forEach(([s, e], i) => {
      const left = pct(s);
      const width = Math.max(6, pct(e) - left);
      const curCls = i === st.curIdx ? ' cur' : '';
      const prevLeft = pct(st.prevEnd);
      html += `<div class="bar-row">
        <div class="bar-lbl">[${s}, ${e}]</div>
        <div class="bar-track">
          <div class="prev-line" style="left:${prevLeft}%"></div>
          <div class="bar${curCls}" data-state="${st.states[i]}" style="left:${left}%;width:${width}%">[${s},${e}]</div>
        </div>
      </div>`;
    });
    return html;
  }

  function render() {
    const st = steps[idx];
    $('timeline').innerHTML = renderTimeline(st);

    const curStr = st.curIdx >= 0 ? `[${st.sorted[st.curIdx][0]}, ${st.sorted[st.curIdx][1]}]` : '—';
    const vars = [
      ['i', st.curIdx >= 0 ? st.curIdx : '—'],
      ['intervals[i]', curStr],
      ['prevEnd', st.prevEnd],
      ['removed', st.removed],
    ];
    $('vars').innerHTML = vars.map(([name, v]) =>
      `<div class="var${st.changed.includes(name) ? ' changed' : ''}"><dt>${name}</dt><dd>${v}</dd></div>`).join('');

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
