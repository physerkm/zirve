(() => {
  const $ = (id) => document.getElementById(id);

  function parseGrid(raw) {
    const rows = raw.split('/').map((s) => s.replace(/\s+/g, '')).filter(Boolean);
    if (rows.length < 1 || rows.length > 5) return null;
    const cols = rows[0].length;
    if (cols < 1 || cols > 6) return null;
    for (const r of rows) {
      if (r.length !== cols || !/^[01]+$/.test(r)) return null;
    }
    return rows.map((r) => r.split(''));
  }

  function cloneGrid(g) {
    return g.map((r) => r.slice());
  }

  function buildSteps(initialGrid) {
    const grid = cloneGrid(initialGrid);
    const R = grid.length;
    const C = grid[0].length;
    const islandId = Array.from({ length: R }, () => Array(C).fill(0));
    const steps = [];
    let count = 0;

    const snap = (s) => steps.push({
      grid: cloneGrid(grid),
      islandId: cloneGrid(islandId),
      count,
      row: '—',
      col: '—',
      cellVal: '—',
      scanPos: null,
      sinkPos: null,
      changed: [],
      ...s,
    });

    snap({
      kind: 'start',
      lines: ['count'],
      changed: ['count'],
      text: `Başlangıç: <code>count = 0</code>. Izgarayı sol üstten başlayarak satır satır tarayacağız.`,
    });

    function sink(r, c, id) {
      if (r < 0 || c < 0 || r >= R || c >= C || grid[r][c] !== '1') {
        return;
      }

      grid[r][c] = '0';
      islandId[r][c] = id;

      snap({
        kind: 'sink',
        lines: ['sink-sig', 'sink-zero', 'sink-down', 'sink-up', 'sink-right', 'sink-left'],
        row: r,
        col: c,
        cellVal: "'0'",
        sinkPos: [r, c],
        changed: ['grid[r][c]'],
        text: `<code>Sink(${r}, ${c})</code>: Kara hücresi <code>grid[${r}][${c}] = '0'</code> yapılarak batırıldı (Ada #${id}) ve 4 komşusuna DFS ile bakılıyor.`,
      });

      sink(r + 1, c, id);
      sink(r - 1, c, id);
      sink(r, c + 1, id);
      sink(r, c - 1, id);
    }

    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        const val = grid[r][c];
        if (val !== '1') {
          const wasSunk = islandId[r][c] > 0;
          snap({
            kind: 'skip',
            lines: ['for-r', 'for-c', 'if-not1'],
            row: r,
            col: c,
            cellVal: `'${val}'`,
            scanPos: [r, c],
            changed: ['row', 'col'],
            text: `<code>grid[${r}][${c}] == '0'</code> (${wasSunk ? `Ada #${islandId[r][c]} batırılırken sıfırlanmıştı` : 'su'}). <code>continue</code> ile geçiyoruz.`,
          });
          continue;
        }

        count++;
        snap({
          kind: 'found',
          lines: ['for-r', 'for-c', 'inc', 'call-sink'],
          row: r,
          col: c,
          cellVal: "'1'",
          scanPos: [r, c],
          changed: ['row', 'col', 'count'],
          text: `<code>grid[${r}][${c}] == '1'</code>! Yeni bir ada keşfedildi: <code>count = ${count}</code>. Şimdi <code>Sink(grid, ${r}, ${c})</code> ile bu adanın tamamını batırıyoruz.`,
        });

        sink(r, c, count);
      }
    }

    snap({
      kind: 'done',
      lines: ['ret'],
      text: `Izgaradaki bütün hücreler tarandı. Toplam ada sayısı: <code>return ${count}</code>.`,
    });

    return steps;
  }

  const CODE = [
    ['count', '<span class="kw">var</span> count = 0;'],
    ['for-r', '<span class="kw">for</span> (<span class="kw">var</span> row = 0; row &lt; grid.Length; row++)'],
    ['for-c', '    <span class="kw">for</span> (<span class="kw">var</span> col = 0; col &lt; grid[row].Length; col++)'],
    ['', '    {'],
    ['if-not1', '        <span class="kw">if</span> (grid[row][col] != \'1\') <span class="kw">continue</span>;'],
    ['inc', '        count++;'],
    ['call-sink', '        Sink(grid, row, col);'],
    ['', '    }'],
    ['ret', '<span class="kw">return</span> count;'],
    ['', ''],
    ['sink-sig', '<span class="kw">private void</span> Sink(<span class="kw">char</span>[][] grid, <span class="kw">int</span> row, <span class="kw">int</span> col)'],
    ['', '{'],
    ['sink-chk', '    <span class="kw">if</span> (row &lt; 0 || col &lt; 0 || row &gt;= grid.Length || col &gt;= grid[row].Length || grid[row][col] != \'1\') <span class="kw">return</span>;'],
    ['sink-zero', '    grid[row][col] = \'0\';'],
    ['sink-down', '    Sink(grid, row + 1, col);'],
    ['sink-up', '    Sink(grid, row - 1, col);'],
    ['sink-right', '    Sink(grid, row, col + 1);'],
    ['sink-left', '    Sink(grid, row, col - 1);'],
    ['', '}'],
  ];

  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Başlangıç', ''],
    skip: ['Su / Batırılmış', 'skip'],
    found: ['Yeni Ada!', 'ok'],
    sink: ['Adayı Batır (DFS)', ''],
    done: ['Tamamlandı', 'ok'],
  };

  let listText = '11000 / 11000 / 00100 / 00011';
  let steps = [];
  let idx = 0;
  let timer = null;

  function renderGrid(st) {
    const R = st.grid.length;
    const C = st.grid[0].length;
    const el = $('grid-viz');
    el.style.gridTemplateColumns = `auto repeat(${C}, 56px)`;

    let html = '<div></div>';
    for (let c = 0; c < C; c++) html += `<div class="gh">c=${c}</div>`;

    for (let r = 0; r < R; r++) {
      html += `<div class="gr">r=${r}</div>`;
      for (let c = 0; c < C; c++) {
        const val = st.grid[r][c];
        const id = st.islandId[r][c];
        let state = 'water';
        if (val === '1') state = 'land';
        else if (id > 0) state = 'sunk';

        let cls = 'gcell';
        if (st.sinkPos && st.sinkPos[0] === r && st.sinkPos[1] === c) cls += ' sink-cur';
        else if (st.scanPos && st.scanPos[0] === r && st.scanPos[1] === c) cls += ' scan';

        const badge = id > 0 ? `<span class="badge">#${id}</span>` : '';
        html += `<div class="${cls}" data-st="${state}">${badge}${val}</div>`;
      }
    }
    el.innerHTML = html;
  }

  function render() {
    const st = steps[idx];
    renderGrid(st);

    const vars = [
      ['row', st.row],
      ['col', st.col],
      ['grid[r][c]', st.cellVal],
      ['count', st.count],
    ];
    $('vars').innerHTML = vars.map(([name, v]) =>
      `<div class="var${st.changed.includes(name) ? ' changed' : ''}"><dt>${name}</dt><dd>${v}</dd></div>`
    ).join('');

    Object.keys(codeLines).forEach((id) => codeLines[id].classList.toggle('hl', st.lines.includes(id)));

    const [tagText, tagKind] = TAGS[st.kind];
    $('step-count').textContent = `Adım ${idx + 1} / ${steps.length}`;
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
    $('play').textContent = '▶ Oynat';
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
    $('play').textContent = '❚❚ Durdur';
    timer = setInterval(() => {
      if (idx < steps.length - 1) { idx++; render(); }
      if (idx === steps.length - 1) stop();
    }, 850);
  });

  document.querySelectorAll('.presets button').forEach((b) => b.addEventListener('click', () => {
    $('list').value = b.dataset.l;
    $('list-err').hidden = true;
    restart(b.dataset.l, parseGrid(b.dataset.l));
  }));

  $('list').addEventListener('input', (e) => {
    const parsed = parseGrid(e.target.value);
    if (!parsed) { $('list-err').hidden = false; return; }
    $('list-err').hidden = true;
    restart(e.target.value, parsed);
  });

  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(listText, parseGrid(listText));
})();
