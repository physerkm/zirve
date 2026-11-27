(() => {
  const $ = (id) => document.getElementById(id);
  const INF = 2147483647;

  const PRESETS = [
    [
      [INF, -1, 0, INF],
      [INF, INF, INF, -1],
      [INF, -1, INF, -1],
      [0, -1, INF, INF],
    ],
    [
      [0, -1, INF],
      [INF, -1, INF],
    ],
    [
      [0, INF, INF, INF, 0],
    ],
  ];

  function cloneGrid(g) {
    return g.map((row) => row.slice());
  }

  function buildSteps(initialGrid) {
    const rooms = cloneGrid(initialGrid);
    const rows = rooms.length;
    const cols = rooms[0].length;
    const queue = [];
    const steps = [];

    let cur = null;
    let probe = null;
    let lastEnqueued = null;

    const snap = (s) => steps.push({
      rooms: cloneGrid(rooms),
      queue: queue.map((q) => [q[0], q[1]]),
      cur,
      probe,
      lastEnqueued,
      changed: [],
      ...s,
    });

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (rooms[r][c] === 0) queue.push([r, c]);
      }
    }

    snap({
      kind: 'start',
      lines: ['init-q', 'for-r', 'if-gate', 'enq-gate'],
      changed: ['queue.Count'],
      text: `Scanned the grid and added every gate (<code>0</code>) to the queue at the start: <code>${queue.map(([r, c]) => `(${r},${c})`).join(', ')}</code>.`,
    });

    const dirs = [
      [-1, 0, 'upper'],
      [1, 0, 'lower'],
      [0, -1, 'left'],
      [0, 1, 'right'],
    ];

    while (queue.length > 0) {
      const [r, c] = queue.shift();
      cur = [r, c];
      probe = null;
      lastEnqueued = null;

      snap({
        kind: 'deq',
        lines: ['while', 'deq'],
        changed: ['(r, c)', 'queue.Count'],
        text: `Cell <code>(${r}, ${c})</code> was taken off the queue (current distance: <code>${rooms[r][c]}</code>). Its four neighbors will be checked.`,
      });

      for (const [dr, dc, dirName] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;

        probe = [nr, nc];
        lastEnqueued = null;

        if (rooms[nr][nc] !== INF) {
          const reason = rooms[nr][nc] === -1 ? 'a wall (-1)' : `its distance is already known (${rooms[nr][nc]})`;
          snap({
            kind: 'skip',
            lines: ['foreach', 'if-skip', 'continue'],
            changed: ['(nr, nc)'],
            text: `Checking the ${dirName} neighbor <code>(${nr}, ${nc})</code>: ${reason}, so it is skipped with <code>continue</code>.`,
          });
          continue;
        }

        rooms[nr][nc] = rooms[r][c] + 1;
        queue.push([nr, nc]);
        lastEnqueued = [nr, nc];

        snap({
          kind: 'fill',
          lines: ['foreach', 'set-dist', 'enq-next'],
          changed: ['(nr, nc)', 'rooms[nr][nc]', 'queue.Count'],
          text: `The ${dirName} neighbor <code>(${nr}, ${nc})</code> is an empty room (<code>INF</code>). Its distance to the nearest gate was set to <code>${rooms[r][c]} + 1 = ${rooms[nr][nc]}</code> and it was added to the queue.`,
        });
      }
    }

    cur = null;
    probe = null;
    lastEnqueued = null;
    snap({
      kind: 'done',
      lines: ['ret'],
      changed: [],
      text: 'The queue is empty! Every reachable empty room now holds the distance to its nearest gate.',
    });

    return steps;
  }

  const CODE = [
    ['init-q', 'Queue&lt;(<span class="kw">int</span> r, <span class="kw">int</span> c)&gt; queue = <span class="kw">new</span>();'],
    ['for-r', '<span class="kw">for</span> (<span class="kw">int</span> r = 0; r &lt; rows; r++)'],
    ['', '    <span class="kw">for</span> (<span class="kw">int</span> c = 0; c &lt; cols; c++)'],
    ['if-gate', '        <span class="kw">if</span> (rooms[r][c] == 0)'],
    ['enq-gate', '            queue.Enqueue((r, c));'],
    ['', ''],
    ['while', '<span class="kw">while</span> (queue.Count &gt; 0)'],
    ['', '{'],
    ['deq', '    <span class="kw">var</span> (r, c) = queue.Dequeue();'],
    ['foreach', '    <span class="kw">foreach</span> (<span class="kw">int</span>[] d <span class="kw">in</span> dirs)'],
    ['', '    {'],
    ['', '        <span class="kw">int</span> nr = r + d[0], nc = c + d[1];'],
    ['if-skip', '        <span class="kw">if</span> (OutOfBounds || rooms[nr][nc] != INF)'],
    ['continue', '            <span class="kw">continue</span>;'],
    ['set-dist', '        rooms[nr][nc] = rooms[r][c] + 1;'],
    ['enq-next', '        queue.Enqueue((nr, nc));'],
    ['', '    }'],
    ['', '}'],
    ['ret', '<span class="kw">return</span> rooms;'],
  ];

  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Start', ''],
    deq: ['Dequeue', ''],
    skip: ['Skip', 'skip'],
    fill: ['Write Distance', 'ok'],
    done: ['Done', 'ok'],
  };

  let presetIdx = 0;
  let steps = [];
  let idx = 0;
  let timer = null;

  function renderMatrix(st) {
    const rows = st.rooms.length;
    const cols = st.rooms[0].length;
    const mat = $('matrix');
    mat.style.gridTemplateColumns = `repeat(${cols}, 66px)`;
    let html = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = st.rooms[r][c];
        const disp = v === INF ? 'INF' : String(v);
        let type = 'empty';
        if (v === -1) type = 'wall';
        else if (v === 0) type = 'gate';
        else if (v !== INF) type = 'filled';

        let cls = 'cell';
        if (st.cur && st.cur[0] === r && st.cur[1] === c) cls += ' cur';
        if (st.probe && st.probe[0] === r && st.probe[1] === c) cls += ' probe';

        html += `<div class="${cls}" data-type="${type}"><span class="coord">(${r},${c})</span><span class="val">${disp}</span></div>`;
      }
    }
    mat.innerHTML = html;
  }

  function render() {
    const st = steps[idx];
    renderMatrix(st);

    $('queue-row').innerHTML = st.queue.length === 0
      ? '<span class="empty-note">Queue is empty</span>'
      : st.queue.map(([r, c], i) => {
        const isNew = st.lastEnqueued && st.lastEnqueued[0] === r && st.lastEnqueued[1] === c && i === st.queue.length - 1;
        return `<span class="mini${i === 0 ? ' now' : ''}${isNew ? ' new' : ''}">(${r},${c})</span>`;
      }).join('');

    const curStr = st.cur ? `(${st.cur[0]}, ${st.cur[1]})` : '—';
    const probeStr = st.probe ? `(${st.probe[0]}, ${st.probe[1]})` : '—';
    const distVal = st.probe
      ? (st.rooms[st.probe[0]][st.probe[1]] === INF ? 'INF' : st.rooms[st.probe[0]][st.probe[1]])
      : '—';

    const vars = [
      ['(r, c)', curStr],
      ['(nr, nc)', probeStr],
      ['rooms[nr][nc]', distVal],
      ['queue.Count', st.queue.length],
    ];
    $('vars').innerHTML = vars.map(([name, v]) =>
      `<div class="var${st.changed.includes(name) ? ' changed' : ''}"><dt>${name}</dt><dd>${v}</dd></div>`
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

    document.querySelectorAll('.presets button').forEach((b) =>
      b.setAttribute('aria-pressed', String(Number(b.dataset.p) === presetIdx))
    );
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Play';
  }

  function loadPreset(p) {
    stop();
    presetIdx = p;
    steps = buildSteps(PRESETS[p]);
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

  document.querySelectorAll('.presets button').forEach((b) =>
    b.addEventListener('click', () => loadPreset(Number(b.dataset.p)))
  );

  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  loadPreset(0);
})();
