(() => {
  const $ = (id) => document.getElementById(id);

  const PRESETS = [
    [[1, 1, 1], [1, 0, 1], [1, 1, 1]],
    [[0, 1, 2, 0], [3, 4, 5, 2], [1, 3, 1, 5]],
    [[1, 2, 3], [0, 4, 5]],
    [[1, 0, 3], [4, 5, 6]],
  ];

  function cloneMat(m) {
    return m.map((row) => row.slice());
  }

  function buildSteps(initial) {
    const mat = cloneMat(initial);
    const rows = mat.length;
    const cols = mat[0].length;
    let firstRowZero = false;
    let r;
    let c;
    const filled = Array.from({ length: rows }, () => Array(cols).fill(false));
    const steps = [];

    const snap = (s) => steps.push({
      mat: cloneMat(mat),
      filled: cloneMat(filled),
      r,
      c,
      firstRowZero,
      probes: [],
      changed: [],
      ...s,
    });

    snap({
      kind: 'start',
      lines: ['dims', 'flag'],
      changed: ['firstRowZero'],
      text: `The ${rows}×${cols} matrix is ready. We start with <code>firstRowZero = false</code>, which records whether the first row should be zeroed.`,
    });

    for (r = 0; r < rows; r++) {
      for (c = 0; c < cols; c++) {
        if (mat[r][c] === 0) {
          const oldFirst = firstRowZero;
          mat[0][c] = 0;
          if (r > 0) {
            mat[r][0] = 0;
          } else {
            firstRowZero = true;
          }
          const ch = ['r', 'c'];
          if (firstRowZero !== oldFirst) ch.push('firstRowZero');
          snap({
            kind: 'mark',
            lines: r > 0 ? ['for1', 'ifzero', 'markc', 'markr'] : ['for1', 'ifzero', 'markc', 'markf'],
            changed: ch,
            probes: r > 0 ? [[0, c], [r, 0]] : [[0, c]],
            text: `Found <code>matrix[${r}][${c}] == 0</code>! The column marker <code>matrix[0][${c}] = 0</code> is set, and ` +
              (r > 0
                ? `the row marker is set as <code>matrix[${r}][0] = 0</code>.`
                : `since the cell is in row 0, <code>firstRowZero = true</code> is set.`),
          });
        }
      }
    }

    r = undefined;
    c = undefined;
    snap({
      kind: 'phase',
      lines: ['for2'],
      text: `Phase 1 is complete: all the markers are ready in row 0, column 0 and <code>firstRowZero</code>. Now we update the inner cells starting from <code>(1, 1)</code>.`,
    });

    for (r = 1; r < rows; r++) {
      for (c = 1; c < cols; c++) {
        const rowZero = mat[r][0] === 0;
        const colZero = mat[0][c] === 0;
        if (rowZero || colZero) {
          mat[r][c] = 0;
          filled[r][c] = true;
          snap({
            kind: 'zero',
            lines: ['for2', 'ifflag', 'setinner'],
            changed: ['r', 'c'],
            probes: [[r, 0], [0, c]],
            text: `Inner cell <code>(${r}, ${c})</code>: ` +
              (rowZero ? `the row marker is <code>matrix[${r}][0] == 0</code>` : `the column marker is <code>matrix[0][${c}] == 0</code>`) +
              `, so <code>matrix[${r}][${c}] = 0</code> is set.`,
          });
        } else {
          snap({
            kind: 'skip',
            lines: ['for2', 'ifflag'],
            changed: ['r', 'c'],
            probes: [[r, 0], [0, c]],
            text: `Inner cell <code>(${r}, ${c})</code>: <code>matrix[${r}][0] = ${mat[r][0]}</code> and <code>matrix[0][${c}] = ${mat[0][c]}</code> (neither is 0), so the cell stays as it is.`,
          });
        }
      }
    }

    r = undefined;
    c = undefined;
    if (mat[0][0] === 0) {
      for (let rr = 0; rr < rows; rr++) {
        if (mat[rr][0] !== 0) filled[rr][0] = true;
        mat[rr][0] = 0;
      }
      snap({
        kind: 'zero',
        lines: ['ifcol0', 'setcol0'],
        probes: [[0, 0]],
        text: `Since <code>matrix[0][0] == 0</code>, all of column 0 is zeroed.`,
      });
    } else {
      snap({
        kind: 'skip',
        lines: ['ifcol0'],
        probes: [[0, 0]],
        text: `<code>matrix[0][0] = ${mat[0][0]}</code> (not 0); column 0 is not zeroed.`,
      });
    }

    if (firstRowZero) {
      for (let cc = 0; cc < cols; cc++) {
        if (mat[0][cc] !== 0) filled[0][cc] = true;
        mat[0][cc] = 0;
      }
      snap({
        kind: 'zero',
        lines: ['ifrow0', 'setrow0'],
        text: `Since <code>firstRowZero == true</code>, all of row 0 is zeroed.`,
      });
    } else {
      snap({
        kind: 'skip',
        lines: ['ifrow0'],
        text: `<code>firstRowZero == false</code>; row 0 is not zeroed.`,
      });
    }

    snap({
      kind: 'done',
      lines: ['ret'],
      text: `Done with O(1) extra memory! The updated <code>matrix</code> is returned.`,
    });

    return steps;
  }

  const CODE = [
    ['dims', '<span class="kw">int</span> rows = matrix.Length, cols = matrix[0].Length;'],
    ['flag', '<span class="kw">bool</span> firstRowZero = <span class="kw">false</span>;'],
    ['', ''],
    ['for1', '<span class="kw">for</span> (<span class="kw">int</span> r = 0; r &lt; rows; r++)'],
    ['', '    <span class="kw">for</span> (<span class="kw">int</span> c = 0; c &lt; cols; c++)'],
    ['ifzero', '        <span class="kw">if</span> (matrix[r][c] == 0) {'],
    ['markc', '            matrix[0][c] = 0;'],
    ['markr', '            <span class="kw">if</span> (r &gt; 0) matrix[r][0] = 0;'],
    ['markf', '            <span class="kw">else</span> firstRowZero = <span class="kw">true</span>;'],
    ['', '        }'],
    ['', ''],
    ['for2', '<span class="kw">for</span> (<span class="kw">int</span> r = 1; r &lt; rows; r++)'],
    ['', '    <span class="kw">for</span> (<span class="kw">int</span> c = 1; c &lt; cols; c++)'],
    ['ifflag', '        <span class="kw">if</span> (matrix[r][0] == 0 || matrix[0][c] == 0)'],
    ['setinner', '            matrix[r][c] = 0;'],
    ['', ''],
    ['ifcol0', '<span class="kw">if</span> (matrix[0][0] == 0)'],
    ['setcol0', '    <span class="kw">for</span> (<span class="kw">int</span> r = 0; r &lt; rows; r++) matrix[r][0] = 0;'],
    ['ifrow0', '<span class="kw">if</span> (firstRowZero)'],
    ['setrow0', '    <span class="kw">for</span> (<span class="kw">int</span> c = 0; c &lt; cols; c++) matrix[0][c] = 0;'],
    ['ret', '<span class="kw">return</span> matrix;'],
  ];

  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Start', ''],
    mark: ['Set marker', ''],
    phase: ['Next phase', ''],
    zero: ['Zero', ''],
    skip: ['Kept', 'skip'],
    done: ['Done', 'ok'],
  };

  let presetIdx = 0;
  let steps = [];
  let idx = 0;
  let timer = null;

  function renderMatrix(st) {
    const rows = st.mat.length;
    const cols = st.mat[0].length;
    const grid = $('matrix-grid');
    grid.style.gridTemplateColumns = `repeat(${cols + 1}, auto)`;

    let html = '<div class="mhdr"></div>';
    for (let cc = 0; cc < cols; cc++) {
      html += `<div class="mhdr">c=${cc}</div>`;
    }

    for (let rr = 0; rr < rows; rr++) {
      html += `<div class="mhdr">r=${rr}</div>`;
      for (let cc = 0; cc < cols; cc++) {
        const val = st.mat[rr][cc];
        const isCur = st.r === rr && st.c === cc;
        const isProbe = st.probes.some(([pr, pc]) => pr === rr && pc === cc);
        let cls = 'chip';
        if (rr === 0 || cc === 0) cls += ' marker-zone';
        if (isCur) cls += ' cur';
        else if (isProbe) cls += ' probe';

        let state = 'plain';
        if (st.filled[rr][cc]) state = 'filled';
        else if (val === 0) state = 'zero';

        html += `<div class="${cls}" data-state="${state}">${val}</div>`;
      }
    }
    grid.innerHTML = html;

    const flagEl = $('flag-val');
    flagEl.textContent = String(st.firstRowZero);
    flagEl.classList.toggle('active', st.firstRowZero);
  }

  function render() {
    const st = steps[idx];
    renderMatrix(st);

    const vars = [
      ['r', st.r],
      ['c', st.c],
      ['firstRowZero', String(st.firstRowZero)],
      ['matrix[0][0]', st.mat[0][0]],
    ];
    $('vars').innerHTML = vars.map(([name, v]) =>
      `<div class="var${st.changed.includes(name) ? ' changed' : ''}"><dt>${name}</dt><dd>${v === undefined ? '—' : v}</dd></div>`
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

  function restart(pIdx) {
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
    }, 1050);
  });

  document.querySelectorAll('.presets button').forEach((b) =>
    b.addEventListener('click', () => restart(Number(b.dataset.p)))
  );

  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(0);
})();
