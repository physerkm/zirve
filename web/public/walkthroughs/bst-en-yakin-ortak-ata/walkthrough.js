(() => {
  const $ = (id) => document.getElementById(id);

  const NODES = [
    { val: 6, x: 300, y: 42, left: 2, right: 8 },
    { val: 2, x: 165, y: 112, left: 0, right: 4 },
    { val: 8, x: 435, y: 112, left: 7, right: 9 },
    { val: 0, x: 95, y: 185, left: null, right: null },
    { val: 4, x: 235, y: 185, left: 3, right: 5 },
    { val: 7, x: 375, y: 185, left: null, right: null },
    { val: 9, x: 495, y: 185, left: null, right: null },
    { val: 3, x: 190, y: 252, left: null, right: null },
    { val: 5, x: 280, y: 252, left: null, right: null },
  ];
  const NODE_MAP = new Map(NODES.map((n) => [n.val, n]));

  const PRESETS = [
    { p: 2, q: 8 },
    { p: 2, q: 4 },
    { p: 3, q: 5 },
    { p: 7, q: 9 },
  ];

  function buildSteps(p, q) {
    const steps = [];
    const visited = [];
    let curr = 6;

    const snap = (s) => steps.push({
      p,
      q,
      curr,
      visited: visited.slice(),
      lca: null,
      changed: [],
      lines: [],
      ...s,
    });

    visited.push(curr);
    snap({
      kind: 'start',
      changed: ['curr', 'p', 'q'],
      lines: ['init', 'while'],
      text: `Aranan düğümler: <code>p = ${p}</code> ve <code>q = ${q}</code>. Aramaya kökten başlıyoruz: <code>curr = ${curr}</code>.`,
    });

    while (curr !== null) {
      const node = NODE_MAP.get(curr);
      if (p < curr && q < curr) {
        const nextVal = node.left;
        snap({
          kind: 'left',
          changed: [],
          lines: ['if-left', 'go-left'],
          text: `<code>p = ${p} &lt; ${curr}</code> ve <code>q = ${q} &lt; ${curr}</code>. Her ikisi de <code>${curr}</code>'dan küçük olduğu için sol alt ağaca iniyoruz: <code>curr = ${nextVal}</code>.`,
        });
        curr = nextVal;
        visited.push(curr);
      } else if (p > curr && q > curr) {
        const nextVal = node.right;
        snap({
          kind: 'right',
          changed: [],
          lines: ['if-right', 'go-right'],
          text: `<code>p = ${p} &gt; ${curr}</code> ve <code>q = ${q} &gt; ${curr}</code>. Her ikisi de <code>${curr}</code>'dan büyük olduğu için sağ alt ağaca iniyoruz: <code>curr = ${nextVal}</code>.`,
        });
        curr = nextVal;
        visited.push(curr);
      } else {
        const reason = (p === curr || q === curr)
          ? `Aranan düğümlerden biri doğrudan <code>curr = ${curr}</code> düğümünün kendisidir (bir düğüm kendisinin de atası sayılır).`
          : `<code>${ Math.min(p, q) } &lt; ${curr} &lt; ${ Math.max(p, q) }</code>: düğümler <code>${curr}</code>'ın iki farklı yakasına düşüyor; yollar ilk kez burada ayrıldı.`;
        snap({
          kind: 'done',
          lca: curr,
          changed: ['lca'],
          lines: ['else', 'ret'],
          text: `${reason} En yakın ortak ata bulundu: <code>return ${curr}</code>.`,
        });
        break;
      }
    }

    return steps;
  }

  const CODE = [
    ['', '<span class="kw">public int</span> LowestCommonAncestor(TreeNode root, <span class="kw">int</span> p, <span class="kw">int</span> q)'],
    ['', '{'],
    ['init', '    TreeNode curr = root;'],
    ['', ''],
    ['while', '    <span class="kw">while</span> (curr != <span class="kw">null</span>)'],
    ['', '    {'],
    ['if-left', '        <span class="kw">if</span> (p &lt; curr.val &amp;&amp; q &lt; curr.val)'],
    ['go-left', '            curr = curr.left;'],
    ['if-right', '        <span class="kw">else if</span> (p &gt; curr.val &amp;&amp; q &gt; curr.val)'],
    ['go-right', '            curr = curr.right;'],
    ['else', '        <span class="kw">else</span>'],
    ['ret', '            <span class="kw">return</span> curr.val;'],
    ['', '    }'],
    ['', '    <span class="kw">return</span> root.val;'],
    ['', '}'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Başlangıç', ''],
    left: ['Sola İn', ''],
    right: ['Sağa İn', ''],
    done: ['Ortak Ata (LCA)', 'ok'],
  };

  let presetIdx = 0;
  let steps = [];
  let idx = 0;
  let timer = null;

  function drawBst(st) {
    let edges = '';
    NODES.forEach((n) => {
      [n.left, n.right].forEach((cVal) => {
        if (cVal !== null) {
          const c = NODE_MAP.get(cVal);
          const onPath = st.visited.includes(n.val) && st.visited.includes(cVal);
          edges += `<line class="edge${onPath ? ' path' : ''}" x1="${n.x}" y1="${n.y}" x2="${c.x}" y2="${c.y}"/>`;
        }
      });
    });

    let boxes = '';
    NODES.forEach((n) => {
      let cls = 'nd-box';
      if (st.lca === n.val) cls += ' lca';
      else {
        if (st.visited.includes(n.val)) cls += ' visited';
        if (st.curr === n.val) cls += ' cur';
        if (n.val === st.p || n.val === st.q) cls += ' target';
      }

      const labels = [];
      if (st.lca === n.val) labels.push('LCA');
      else if (st.curr === n.val) labels.push('curr');
      if (n.val === st.p) labels.push('p');
      if (n.val === st.q) labels.push('q');

      const tagCls = st.lca === n.val ? 'nd-tag lca' : (st.curr === n.val ? 'nd-tag' : 'nd-tag pq');
      const tag = labels.length > 0
        ? `<text class="${tagCls}" x="${n.x}" y="${n.y - 25}">${labels.join(' · ')}</text>`
        : '';

      boxes += `<g>${tag}<rect class="${cls}" x="${n.x - 22}" y="${n.y - 19}" width="44" height="38"/><text class="nd-txt" x="${n.x}" y="${n.y}">${n.val}</text></g>`;
    });

    $('bst-svg').innerHTML = edges + boxes;
  }

  function render() {
    const st = steps[idx];
    drawBst(st);

    const vList = [
      ['curr.val', st.curr, 'curr'],
      ['p', st.p, 'p'],
      ['q', st.q, 'q'],
      ['döndürülen', st.lca === null ? '—' : st.lca, 'lca'],
    ];
    $('vars').innerHTML = vList.map(([label, val, key]) =>
      `<div class="var${st.changed.includes(key) ? ' changed' : ''}"><dt>${label}</dt><dd>${val}</dd></div>`).join('');

    Object.keys(codeLines).forEach((id) => codeLines[id].classList.toggle('hl', st.lines.includes(id)));

    const [tagText, tagKind] = TAGS[st.kind];
    $('step-count').textContent = `Adım ${idx + 1} / ${steps.length}`;
    $('step-tag').textContent = tagText;
    $('step-tag').dataset.kind = tagKind;
    $('step-text').innerHTML = st.text;
    $('prev-btn').disabled = idx === 0;
    $('reset').disabled = idx === 0;
    $('next-btn').disabled = idx === steps.length - 1;

    document.querySelectorAll('.presets button').forEach((b) =>
      b.setAttribute('aria-pressed', String(Number(b.dataset.p) === presetIdx)));
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Oynat';
  }

  function loadPreset(pIdx) {
    stop();
    presetIdx = pIdx;
    const { p, q } = PRESETS[presetIdx];
    steps = buildSteps(p, q);
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
  document.querySelectorAll('.presets button').forEach((b) =>
    b.addEventListener('click', () => loadPreset(Number(b.dataset.p))));
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  loadPreset(0);
})();
