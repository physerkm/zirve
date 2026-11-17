(() => {
  const $ = (id) => document.getElementById(id);

  const NODES = {
    3: { val: 3, left: 5, right: 1, x: 320, y: 38 },
    5: { val: 5, left: 6, right: 2, x: 170, y: 108 },
    1: { val: 1, left: 0, right: 8, x: 470, y: 108 },
    6: { val: 6, left: null, right: null, x: 95, y: 178 },
    2: { val: 2, left: 7, right: 4, x: 245, y: 178 },
    0: { val: 0, left: null, right: null, x: 395, y: 178 },
    8: { val: 8, left: null, right: null, x: 545, y: 178 },
    7: { val: 7, left: null, right: null, x: 195, y: 242 },
    4: { val: 4, left: null, right: null, x: 295, y: 242 },
  };
  const VALID_VALS = [3, 5, 1, 6, 2, 0, 8, 7, 4];
  const EDGES = [
    [3, 5], [3, 1],
    [5, 6], [5, 2],
    [1, 0], [1, 8],
    [2, 7], [2, 4],
  ];

  function buildSteps(p, q) {
    const steps = [];
    const stack = [];
    const returns = {};
    let lcaVal = null;

    const snap = (s) => steps.push({
      p, q,
      cur: stack.length > 0 ? stack[stack.length - 1] : undefined,
      leftVal: undefined,
      rightVal: undefined,
      stack: stack.slice(),
      returns: { ...returns },
      lcaVal,
      changed: [],
      ...s,
    });

    snap({
      kind: 'start',
      lines: ['sig'],
      changed: ['p', 'q'],
      text: `Kök düğüm <code>3</code>'ten başlayarak <code>p = ${p}</code> ve <code>q = ${q}</code> için <code>FindLca(3, ${p}, ${q})</code> çağrısını başlatıyoruz.`,
    });

    function dfs(val) {
      if (val === null) return null;
      stack.push(val);

      if (val === p || val === q) {
        returns[val] = val;
        snap({
          kind: 'hit',
          lines: ['base', 'ret-base'],
          changed: ['node'],
          text: `Düğüm <code>${val}</code> hedef değerlerden birine eşit (<code>node.val == ${val}</code>). Alt ağaçlarına inmeden doğrudan <code>${val}</code> döndürüyoruz.`,
        });
        stack.pop();
        return val;
      }

      snap({
        kind: 'enter',
        lines: ['base', 'left'],
        changed: ['node'],
        text: `Düğüm <code>${val}</code> hedef değil. Önce sol alt ağacını (<code>${NODES[val].left === null ? 'null' : NODES[val].left}</code>) arıyoruz.`,
      });

      const left = dfs(NODES[val].left);

      snap({
        kind: 'mid',
        lines: ['right'],
        leftVal: left === null ? 'null' : left,
        changed: ['left'],
        text: `Düğüm <code>${val}</code> için sol alt ağaçtan <code>left = ${left === null ? 'null' : left}</code> döndü. Şimdi sağ alt ağacı (<code>${NODES[val].right === null ? 'null' : NODES[val].right}</code>) arıyoruz.`,
      });

      const right = dfs(NODES[val].right);

      if (left !== null && right !== null) {
        returns[val] = val;
        lcaVal = val;
        snap({
          kind: 'lca',
          lines: ['both', 'ret-both'],
          leftVal: left,
          rightVal: right,
          changed: ['right'],
          text: `Düğüm <code>${val}</code>'de hem <code>left = ${left}</code> hem <code>right = ${right}</code> dolu döndü! İki hedef ilk kez burada birleşti: ortak ata <b>${val}</b>.`,
        });
        stack.pop();
        return val;
      }

      const res = left !== null ? left : right;
      returns[val] = res;
      snap({
        kind: res === null ? 'skip' : ' relay',
        lines: ['both', 'ret-one'],
        leftVal: left === null ? 'null' : left,
        rightVal: right === null ? 'null' : right,
        changed: ['right'],
        text: res === null
          ? `Düğüm <code>${val}</code>'in iki alt ağacından da <code>null</code> döndü; yukarıya <code>null</code> iletiliyor.`
          : `Düğüm <code>${val}</code>'de tek taraftan sonuç geldi (<code>${res}</code>); <code>left ?? right</code> ile <code>${res}</code> yukarı taşınıyor.`,
      });
      stack.pop();
      return res;
    }

    const finalAns = dfs(3);
    if (lcaVal === null) lcaVal = finalAns;

    snap({
      kind: 'done',
      lines: ['ret-one'],
      lcaVal: finalAns,
      text: `Arama tamamlandı. Köke ulaşan sonuç <code>${finalAns}</code>; <code>${p}</code> ve <code>${q}</code> düğümlerinin en yakın ortak atası <b>${finalAns}</b> olarak döndürülür.`,
    });

    return steps;
  }

  const CODE = [
    ['sig', '<span class="kw">private</span> TreeNode FindLca(TreeNode node, <span class="kw">int</span> p, <span class="kw">int</span> q)'],
    ['', '{'],
    ['base', '    <span class="kw">if</span> (node == <span class="kw">null</span> || node.val == p || node.val == q)'],
    ['ret-base', '        <span class="kw">return</span> node;'],
    ['', ''],
    ['left', '    TreeNode left = FindLca(node.left, p, q);'],
    ['right', '    TreeNode right = FindLca(node.right, p, q);'],
    ['', ''],
    ['both', '    <span class="kw">if</span> (left != <span class="kw">null</span> &amp;&amp; right != <span class="kw">null</span>)'],
    ['ret-both', '        <span class="kw">return</span> node;'],
    ['', ''],
    ['ret-one', '    <span class="kw">return</span> left ?? right;'],
    ['', '}'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Başlangıç', ''],
    enter: ['İniş (DFS)', ''],
    mid: ['Sağ Kola Geç', ''],
    hit: ['Hedef Bulundu', 'ok'],
    lca: ['Ortak Ata (LCA)', 'ok'],
    ' relay': ['Yukarı Taşı', ''],
    skip: ['Bulunamadı', 'skip'],
    done: ['Tamamlandı', 'ok'],
  };

  let rawText = '5, 1';
  let steps = [];
  let idx = 0;
  let timer = null;

  function parsePair(raw) {
    const parts = raw.split(/[\s,]+/).filter(Boolean).map(Number);
    if (parts.length !== 2) return null;
    const [p, q] = parts;
    if (p === q) return null;
    if (!VALID_VALS.includes(p) || !VALID_VALS.includes(q)) return null;
    return [p, q];
  }

  function renderTree(st) {
    const svgLines = EDGES.map(([u, v]) => {
      const a = NODES[u];
      const b = NODES[v];
      return `<line class="tree-edge" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" />`;
    }).join('');

    const nodesHtml = VALID_VALS.map((v) => {
      const n = NODES[v];
      const hasRet = Object.prototype.hasOwnProperty.call(st.returns, v);
      const retVal = st.returns[v];
      let retHtml = '';
      if (hasRet) {
        retHtml = `<div class="node-ret${retVal === null ? ' null' : ''}">↑ ${retVal === null ? 'null' : retVal}</div>`;
      } else {
        retHtml = '<div class="node-ret"></div>';
      }

      let state = 'plain';
      if (st.lcaVal === v) state = 'lca';
      else if (hasRet && retVal !== null) state = 'visited';
      else if (v === st.p || v === st.q) state = 'target';

      const cls = `chip${st.cur === v ? ' cur' : ''}`;
      const sub = v === st.p ? 'p' : v === st.q ? 'q' : '';

      return `<div class="tree-node" style="left:${n.x}px;top:${n.y}px">` +
        retHtml +
        `<div class="${cls}" data-state="${state}">${v}</div>` +
        `<div class="node-sub">${sub}</div>` +
        `</div>`;
    }).join('');

    return `<svg class="tree-svg" viewBox="0 0 640 270" aria-hidden="true">${svgLines}</svg>${nodesHtml}`;
  }

  function render() {
    const st = steps[idx];

    $('stack-row').innerHTML = st.stack.length === 0
      ? '<span class="empty-note">boş</span>'
      : st.stack.map((v, i) => `<span class="mini${i === st.stack.length - 1 ? ' now' : ''}">FindLca(${v})</span>`).join('');

    $('tree-stage').innerHTML = renderTree(st);

    const vars = [
      ['node', st.cur],
      ['p, q', `${st.p}, ${st.q}`],
      ['left', st.leftVal],
      ['right', st.rightVal],
    ];
    $('vars').innerHTML = vars.map(([name, v]) => {
      const key = name === 'p, q' ? 'p' : name;
      return `<div class="var${st.changed.includes(key) ? ' changed' : ''}"><dt>${name}</dt><dd>${v === undefined ? '—' : v}</dd></div>`;
    }).join('');

    Object.keys(codeLines).forEach((id) => codeLines[id].classList.toggle('hl', st.lines.includes(id)));

    const [tagText, tagKind] = TAGS[st.kind];
    $('step-count').textContent = `Adım ${idx + 1} / ${steps.length}`;
    $('step-tag').textContent = tagText;
    $('step-tag').dataset.kind = tagKind;
    $('step-text').innerHTML = st.text;
    $('prev-btn').disabled = idx === 0;
    $('reset').disabled = idx === 0;
    $('next-btn').disabled = idx === steps.length - 1;

    document.querySelectorAll('.presets button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.p === rawText)));
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Oynat';
  }

  function restart(text, pair) {
    stop();
    rawText = text;
    steps = buildSteps(pair[0], pair[1]);
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
    $('pair-input').value = b.dataset.p;
    $('pair-err').hidden = true;
    restart(b.dataset.p, parsePair(b.dataset.p));
  }));
  $('pair-input').addEventListener('input', (e) => {
    const pair = parsePair(e.target.value);
    if (!pair) { $('pair-err').hidden = false; return; }
    $('pair-err').hidden = true;
    restart(e.target.value, pair);
  });
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(rawText, parsePair(rawText));
})();
