(() => {
  const $ = (id) => document.getElementById(id);

  function buildSteps(n) {
    const steps = [];
    const cols = [];
    const posDiag = [];
    const negDiag = [];
    const queens = []; // [{r, c}]
    const solutions = [];

    const snap = (s) => steps.push({
      n,
      cols: cols.slice(),
      posDiag: posDiag.slice(),
      negDiag: negDiag.slice(),
      queens: queens.map((q) => ({ ...q })),
      solutions: solutions.map((sol) => sol.slice()),
      r: undefined,
      c: undefined,
      probe: null,
      conflict: null,
      solvedNow: false,
      changed: [],
      ...s,
    });

    snap({
      kind: 'start',
      lines: ['init', 'call'],
      changed: ['n'],
      text: `An empty board and the <code>cols</code>, <code>posDiag</code>, <code>negDiag</code> sets are created for <code>n = ${n}</code>. We start at row 0 with <code>Backtrack(0)</code>.`,
    });

    function backtrack(r) {
      if (r === n) {
        const boardLines = [];
        for (let i = 0; i < n; i++) {
          let rowStr = '';
          for (let j = 0; j < n; j++) {
            rowStr += queens.some((q) => q.r === i && q.c === j) ? 'Q' : '.';
          }
          boardLines.push(rowStr);
        }
        solutions.push(boardLines);
        snap({
          kind: 'solved',
          r,
          lines: ['base', 'addsol', 'ret'],
          changed: ['r', 'solutions'],
          solvedNow: true,
          text: `<code>r == ${n}</code>: a queen has been placed in every row! Solution #${solutions.length} is added to the result.`,
        });
        return;
      }

      for (let c = 0; c < n; c++) {
        const pos = r + c;
        const neg = r - c;
        const colHit = cols.includes(c);
        const posHit = posDiag.includes(pos);
        const negHit = negDiag.includes(neg);

        if (colHit || posHit || negHit) {
          const reason = colHit
            ? `column <code>c = ${c}</code> is taken`
            : posHit
              ? `positive diagonal <code>r + c = ${pos}</code> is taken`
              : `negative diagonal <code>r - c = ${neg}</code> is taken`;
          snap({
            kind: 'skip',
            r,
            c,
            lines: ['for', 'if', 'cont'],
            changed: ['r', 'c'],
            probe: { r, c, ok: false },
            conflict: { colHit, posHit, negHit, c, pos, neg },
            text: `Tried <code>(r=${r}, c=${c})</code>: ${reason}. A queen can't go here, so <code>continue</code> moves on to the next column.`,
          });
          continue;
        }

        cols.push(c);
        posDiag.push(pos);
        negDiag.push(neg);
        queens.push({ r, c });

        snap({
          kind: 'place',
          r,
          c,
          lines: ['for', 'place', 'recurse'],
          changed: ['r', 'c'],
          probe: { r, c, ok: true },
          text: `<code>(r=${r}, c=${c})</code> is safe! The queen is placed (<code>c=${c}</code>, <code>r+c=${pos}</code>, <code>r-c=${neg}</code> are added to the sets). Now <code>Backtrack(${r + 1})</code> is called.`,
        });

        backtrack(r + 1);

        cols.pop();
        posDiag.pop();
        negDiag.pop();
        queens.pop();

        snap({
          kind: 'back',
          r,
          c,
          lines: ['remove'],
          changed: ['r', 'c'],
          probe: { r, c, ok: false },
          text: `Returned from the <code>(r=${r}, c=${c})</code> branch (backtrack). The queen is removed, and <code>c=${c}</code>, <code>r+c=${pos}</code>, <code>r-c=${neg}</code> are removed from the sets.`,
        });
      }
    }

    backtrack(0);

    snap({
      kind: 'done',
      lines: ['final'],
      text: solutions.length > 0
        ? `The search is complete. A total of <b>${solutions.length}</b> valid solutions were found and returned.`
        : `The search is complete. No valid arrangement exists for <code>n = ${n}</code> (<code>[]</code> is returned).`,
    });

    return steps;
  }

  const CODE = [
    ['init', '<span class="kw">void</span> Backtrack(<span class="kw">int</span> r)'],
    ['', '{'],
    ['base', '    <span class="kw">if</span> (r == n)'],
    ['', '    {'],
    ['addsol', '        result.Add(CopyBoard(board));'],
    ['ret', '        <span class="kw">return</span>;'],
    ['', '    }'],
    ['for', '    <span class="kw">for</span> (<span class="kw">int</span> c = 0; c &lt; n; c++)'],
    ['', '    {'],
    ['if', '        <span class="kw">if</span> (cols.Contains(c) || posDiag.Contains(r + c) || negDiag.Contains(r - c))'],
    ['cont', '            <span class="kw">continue</span>;'],
    ['place', '        cols.Add(c); posDiag.Add(r + c); negDiag.Add(r - c); board[r][c] = \'Q\';'],
    ['recurse', '        Backtrack(r + 1);'],
    ['remove', '        cols.Remove(c); posDiag.Remove(r + c); negDiag.Remove(r - c); board[r][c] = \'.\';'],
    ['', '    }'],
    ['', '}'],
    ['call', 'Backtrack(0);'],
    ['final', '<span class="kw">return</span> result;'],
  ];

  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Start', ''],
    place: ['Place queen', ''],
    skip: ['Conflict', 'skip'],
    back: ['Backtrack', 'back'],
    solved: ['Solution found!', 'ok'],
    done: ['Done', 'ok'],
  };

  let curN = 4;
  let steps = [];
  let idx = 0;
  let timer = null;

  function render() {
    const st = steps[idx];
    const grid = $('board-grid');
    grid.style.gridTemplateColumns = `repeat(${st.n}, 58px)`;

    let cellsHtml = '';
    for (let r = 0; r < st.n; r++) {
      for (let c = 0; c < st.n; c++) {
        const hasQ = st.queens.some((q) => q.r === r && q.c === c);
        const isProbe = st.probe && st.probe.r === r && st.probe.c === c;
        let cls = 'cell' + ((r + c) % 2 === 1 ? ' alt' : '');
        if (hasQ) {
          cls += ' queen';
          if (st.solvedNow) cls += ' solved';
        }
        if (isProbe && !st.probe.ok && st.kind === 'skip') {
          cls += ' probe-bad';
        } else if (isProbe && st.probe.ok) {
          cls += ' probe-ok';
        }
        if (st.conflict && hasQ) {
          if (
            (st.conflict.colHit && c === st.conflict.c) ||
            (st.conflict.posHit && r + c === st.conflict.pos) ||
            (st.conflict.negHit && r - c === st.conflict.neg)
          ) {
            cls += ' threat-origin';
          }
        }
        const symbol = hasQ ? '♛' : (isProbe && st.kind === 'skip' ? '✗' : '');
        cellsHtml += `<div class="${cls}"><span class="coord">${r},${c}</span>${symbol}<span class="diag-info">${r + c}/${r - c}</span></div>`;
      }
    }
    grid.innerHTML = cellsHtml;

    $('cols-row').innerHTML = st.cols.length === 0
      ? '<span class="empty-note">empty</span>'
      : st.cols.map((v) => `<span class="mini${st.conflict && st.conflict.colHit && st.conflict.c === v ? ' conflict' : ''}">${v}</span>`).join('');

    $('pos-row').innerHTML = st.posDiag.length === 0
      ? '<span class="empty-note">empty</span>'
      : st.posDiag.map((v) => `<span class="mini${st.conflict && st.conflict.posHit && st.conflict.pos === v ? ' conflict' : ''}">${v}</span>`).join('');

    $('neg-row').innerHTML = st.negDiag.length === 0
      ? '<span class="empty-note">empty</span>'
      : st.negDiag.map((v) => `<span class="mini${st.conflict && st.conflict.negHit && st.conflict.neg === v ? ' conflict' : ''}">${v}</span>`).join('');

    $('solutions-row').innerHTML = st.solutions.length === 0
      ? '<span class="empty-note">none yet</span>'
      : st.solutions.map((sol, i) => `<div class="sol-card${st.solvedNow && i === st.solutions.length - 1 ? ' latest' : ''}">${sol.join('<br>')}</div>`).join('');

    const vars = [
      ['n', st.n],
      ['r', st.r],
      ['c', st.c],
      ['r + c', st.r !== undefined && st.c !== undefined ? st.r + st.c : undefined],
      ['r - c', st.r !== undefined && st.c !== undefined ? st.r - st.c : undefined],
      ['solutions', st.solutions.length],
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

    document.querySelectorAll('.presets button').forEach((b) => {
      b.setAttribute('aria-pressed', String(Number(b.dataset.n) === curN));
    });
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Play';
  }

  function restart(nVal) {
    stop();
    curN = nVal;
    steps = buildSteps(curN);
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
    }, 850);
  });

  document.querySelectorAll('.presets button').forEach((b) => b.addEventListener('click', () => {
    restart(Number(b.dataset.n));
  }));

  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(curN);
})();
