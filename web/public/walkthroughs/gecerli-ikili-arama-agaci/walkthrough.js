(() => {
  const $ = (id) => document.getElementById(id);

  const fmtBound = (v) => {
    if (v === -Infinity) return '-∞';
    if (v === Infinity) return '+∞';
    return String(v);
  };

  function parseTree(raw) {
    const parts = raw.split(/[\s,]+/).filter(Boolean);
    if (parts.length < 1 || parts.length > 7) return null;
    const arr = [];
    for (const p of parts) {
      if (p.toLowerCase() === 'null') {
        arr.push(null);
      } else {
        const n = Number(p);
        if (!Number.isInteger(n) || n < -999 || n > 999) return null;
        arr.push(n);
      }
    }
    if (arr[0] === null) return null;
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] !== null) {
        const parentIdx = Math.floor((i - 1) / 2);
        if (arr[parentIdx] === null) return null;
      }
    }
    return arr;
  }

  function buildSteps(arr) {
    const steps = [];
    const nodeState = {};
    const nodeRange = {};
    const callStack = [];

    const snap = (s) => steps.push({
      nodeState: { ...nodeState },
      nodeRange: { ...nodeRange },
      stack: callStack.slice(),
      curIdx: null,
      nodeVal: '—',
      low: '—',
      high: '—',
      changed: [],
      ...s,
    });

    snap({
      kind: 'start',
      lines: ['entry', 'entry-ret'],
      text: `<code>IsValidBST(root)</code> çağrılıyor. Kök düğüm (${arr[0]}) için başlangıç sınırları <code>(long.MinValue, long.MaxValue)</code> yani <code>(-∞, +∞)</code>.`,
    });

    function dfs(idx, low, high) {
      const label = idx < arr.length && arr[idx] !== null ? String(arr[idx]) : 'null';
      const frame = `IsValid(${label}, ${fmtBound(low)}, ${fmtBound(high)})`;
      callStack.unshift(frame);

      if (idx >= arr.length || arr[idx] === null) {
        snap({
          kind: 'base',
          lines: ['sig', 'null-chk'],
          nodeVal: 'null',
          low: fmtBound(low),
          high: fmtBound(high),
          changed: ['node', 'low', 'high'],
          text: `<code>node == null</code>. Boş alt ağaç her zaman geçerlidir; <code>true</code> döner.`,
        });
        callStack.shift();
        return true;
      }

      const val = arr[idx];
      nodeRange[idx] = `(${fmtBound(low)}, ${fmtBound(high)})`;
      nodeState[idx] = 'cur';

      if (val <= low || val >= high) {
        nodeState[idx] = 'bad';
        const reason = val <= low
          ? `${val} &lt;= alt sınır (${fmtBound(low)})`
          : `${val} &gt;= üst sınır (${fmtBound(high)})`;
        snap({
          kind: 'fail',
          lines: ['sig', 'bound-chk'],
          curIdx: idx,
          nodeVal: val,
          low: fmtBound(low),
          high: fmtBound(high),
          changed: ['node', 'low', 'high'],
          text: `Düğüm <code>${val}</code>, izin verilen <code>(${fmtBound(low)}, ${fmtBound(high)})</code> aralığında mı? <b>Hayır!</b> (${reason}). <code>return false</code>.`,
        });
        callStack.shift();
        return false;
      }

      snap({
        kind: 'check',
        lines: ['sig', 'bound-chk', 'rec'],
        curIdx: idx,
        nodeVal: val,
        low: fmtBound(low),
        high: fmtBound(high),
        changed: ['node', 'low', 'high'],
        text: `Düğüm <code>${val}</code>, <code>(${fmtBound(low)}, ${fmtBound(high)})</code> aralığının içinde. Şimdi sol alt ağacı <code>(${fmtBound(low)}, ${val})</code> ve sağ alt ağacı <code>(${val}, ${fmtBound(high)})</code> aralığıyla kontrol ediyoruz.`,
      });

      nodeState[idx] = 'path';
      const leftOk = dfs(2 * idx + 1, low, val);
      if (!leftOk) {
        nodeState[idx] = 'bad';
        callStack.shift();
        return false;
      }

      nodeState[idx] = 'path';
      const rightOk = dfs(2 * idx + 2, val, high);
      if (!rightOk) {
        nodeState[idx] = 'bad';
        callStack.shift();
        return false;
      }

      nodeState[idx] = 'ok';
      snap({
        kind: 'ok',
        lines: ['rec'],
        curIdx: idx,
        nodeVal: val,
        low: fmtBound(low),
        high: fmtBound(high),
        changed: [],
        text: `Düğüm <code>${val}</code>'in sol ve sağ alt ağaçları geçerli. Bu düğümden <code>true</code> döner.`,
      });

      callStack.shift();
      return true;
    }

    const ans = dfs(0, -Infinity, Infinity);
    snap({
      kind: ans ? 'done-ok' : 'done-bad',
      lines: ['entry-ret'],
      text: ans
        ? `Tüm düğümler kendi <code>(low, high)</code> aralıklarına uydu. Sonuç: <code>true</code> (geçerli BST).`
        : `Aralık kuralını bozan bir düğüm bulundu. Sonuç: <code>false</code> (geçersiz BST).`,
    });

    return steps;
  }

  const CODE = [
    ['entry', '<span class="kw">public bool</span> IsValidBST(TreeNode root)'],
    ['', '{'],
    ['entry-ret', '    <span class="kw">return</span> IsValid(root, <span class="kw">long</span>.MinValue, <span class="kw">long</span>.MaxValue);'],
    ['', '}'],
    ['', ''],
    ['sig', '<span class="kw">private bool</span> IsValid(TreeNode node, <span class="kw">long</span> low, <span class="kw">long</span> high)'],
    ['', '{'],
    ['null-chk', '    <span class="kw">if</span> (node == <span class="kw">null</span>) <span class="kw">return true</span>;'],
    ['bound-chk', '    <span class="kw">if</span> (node.val &lt;= low || node.val &gt;= high) <span class="kw">return false</span>;'],
    ['', ''],
    ['rec', '    <span class="kw">return</span> IsValid(node.left, low, node.val) &amp;&amp; IsValid(node.right, node.val, high);'],
    ['', '}'],
  ];

  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Başlangıç', ''],
    check: ['Aralık kontrolü', ''],
    base: ['Boş düğüm (null)', ''],
    ok: ['Alt ağaç geçerli', 'ok'],
    fail: ['Kural bozuldu!', 'bad'],
    'done-ok': ['Geçerli BST (true)', 'ok'],
    'done-bad': ['Geçersiz BST (false)', 'bad'],
  };

  const POS = [
    { x: 260, y: 46 },
    { x: 140, y: 124 },
    { x: 380, y: 124 },
    { x: 80, y: 204 },
    { x: 200, y: 204 },
    { x: 320, y: 204 },
    { x: 440, y: 204 },
  ];

  let listText = '5, 1, 4, null, null, 3, 6';
  let treeArr = [];
  let steps = [];
  let idx = 0;
  let timer = null;

  function renderTree(st) {
    let edges = '';
    let nodes = '';

    for (let i = 0; i < treeArr.length; i++) {
      if (treeArr[i] === null) continue;
      if (i > 0) {
        const p = Math.floor((i - 1) / 2);
        const stChild = st.nodeState[i] || 'todo';
        let edgeCls = 'edge';
        if (stChild === 'cur' || stChild === 'path') edgeCls += ' active';
        else if (stChild === 'ok') edgeCls += ' ok';
        else if (stChild === 'bad') edgeCls += ' bad';
        edges += `<line class="${edgeCls}" x1="${POS[p].x}" y1="${POS[p].y}" x2="${POS[i].x}" y2="${POS[i].y}"></line>`;
      }
    }

    for (let i = 0; i < treeArr.length; i++) {
      if (treeArr[i] === null) continue;
      const stNode = st.nodeState[i] || 'todo';
      const rangeTxt = st.nodeRange[i] || '';
      const { x, y } = POS[i];
      nodes += `<g class="node" data-st="${stNode}">` +
        (rangeTxt ? `<text class="node-range" x="${x}" y="${y - 28}">${rangeTxt}</text>` : '') +
        `<circle class="node-circle" cx="${x}" cy="${y}" r="20"></circle>` +
        `<text class="node-val" x="${x}" y="${y}">${treeArr[i]}</text>` +
        `</g>`;
    }

    return `<svg class="tree-svg" viewBox="0 0 520 245" width="520" height="245" role="img" aria-label="İkili ağaç">${edges}${nodes}</svg>`;
  }

  function render() {
    const st = steps[idx];
    $('tree-box').innerHTML = renderTree(st);

    const vars = [
      ['node', st.nodeVal],
      ['low', st.low],
      ['high', st.high],
    ];
    $('vars').innerHTML = vars.map(([name, v]) =>
      `<div class="var${st.changed.includes(name) ? ' changed' : ''}"><dt>${name}</dt><dd>${v}</dd></div>`
    ).join('');

    $('stack').innerHTML = st.stack.length === 0
      ? '<li>— (çağrı tamamlandı)</li>'
      : st.stack.map((f, k) => `<li class="${k === 0 ? 'top' : ''}">${f}</li>`).join('');

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
    treeArr = parsed;
    steps = buildSteps(treeArr);
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
    }, 1100);
  });

  document.querySelectorAll('.presets button').forEach((b) => b.addEventListener('click', () => {
    $('list').value = b.dataset.l;
    $('list-err').hidden = true;
    restart(b.dataset.l, parseTree(b.dataset.l));
  }));

  $('list').addEventListener('input', (e) => {
    const parsed = parseTree(e.target.value);
    if (!parsed) { $('list-err').hidden = false; return; }
    $('list-err').hidden = true;
    restart(e.target.value, parsed);
  });

  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(listText, parseTree(listText));
})();
