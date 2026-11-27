(() => {
  const $ = (id) => document.getElementById(id);

  const PRESETS = [
    {
      rootNodes: [
        { id: 0, val: 3, x: 190, y: 40, left: 1, right: 2 },
        { id: 1, val: 4, x: 110, y: 110, left: 3, right: 4 },
        { id: 2, val: 5, x: 270, y: 110, left: null, right: null },
        { id: 3, val: 1, x: 65, y: 185, left: null, right: null },
        { id: 4, val: 2, x: 155, y: 185, left: null, right: null },
      ],
      subNodes: [
        { id: 0, val: 4, x: 140, y: 65, left: 1, right: 2 },
        { id: 1, val: 1, x: 85, y: 145, left: null, right: null },
        { id: 2, val: 2, x: 195, y: 145, left: null, right: null },
      ],
    },
    {
      rootNodes: [
        { id: 0, val: 3, x: 190, y: 34, left: 1, right: 2 },
        { id: 1, val: 4, x: 115, y: 92, left: 3, right: 4 },
        { id: 2, val: 5, x: 270, y: 92, left: null, right: null },
        { id: 3, val: 1, x: 65, y: 150, left: null, right: null },
        { id: 4, val: 2, x: 165, y: 150, left: 5, right: null },
        { id: 5, val: 0, x: 130, y: 204, left: null, right: null },
      ],
      subNodes: [
        { id: 0, val: 4, x: 140, y: 65, left: 1, right: 2 },
        { id: 1, val: 1, x: 85, y: 145, left: null, right: null },
        { id: 2, val: 2, x: 195, y: 145, left: null, right: null },
      ],
    },
    {
      rootNodes: [
        { id: 0, val: 1, x: 190, y: 60, left: 1, right: null },
        { id: 1, val: 1, x: 115, y: 145, left: null, right: null },
      ],
      subNodes: [
        { id: 0, val: 1, x: 140, y: 95, left: null, right: null },
      ],
    },
  ];

  function buildSteps(preset) {
    const { rootNodes, subNodes } = preset;
    const rMap = new Map(rootNodes.map((n) => [n.id, n]));
    const sMap = new Map(subNodes.map((n) => [n.id, n]));
    const steps = [];
    let matchedR = [];
    let matchedS = [];

    const snap = (s) => steps.push({
      candId: null,
      probeR: null,
      probeS: null,
      failR: null,
      failS: null,
      matchedR: matchedR.slice(),
      matchedS: matchedS.slice(),
      vars: { root: '—', a: '—', b: '—', result: '—' },
      changed: [],
      lines: [],
      ...s,
    });

    function fmt(map, id) {
      if (id === null || id === undefined) return 'null';
      return String(map.get(id).val);
    }

    function checkSame(candId, aId, bId, localR, localS) {
      const aVal = fmt(rMap, aId);
      const bVal = fmt(sMap, bId);

      if (aId === null && bId === null) {
        snap({
          kind: 'same',
          candId,
          matchedR: localR.slice(),
          matchedS: localS.slice(),
          vars: { root: fmt(rMap, candId), a: 'null', b: 'null', result: 'true' },
          changed: ['a', 'b', 'result'],
          lines: ['same-null'],
          text: 'Both branches are <code>null</code>; this leaf branch matches (<code>true</code>).',
        });
        return true;
      }

      if (aId === null || bId === null || rMap.get(aId).val !== sMap.get(bId).val) {
        const why = aId === null || bId === null
          ? `one is <code>${aVal}</code> while the other is <code>${bVal}</code>`
          : `<code>${aVal} != ${bVal}</code>`;
        snap({
          kind: 'fail',
          candId,
          probeR: aId,
          probeS: bId,
          failR: aId,
          failS: bId,
          matchedR: localR.slice(),
          matchedS: localS.slice(),
          vars: { root: fmt(rMap, candId), a: aVal, b: bVal, result: 'false' },
          changed: ['a', 'b', 'result'],
          lines: ['same-diff'],
          text: `<code>IsSameTree(${aVal}, ${bVal})</code>: ${why}. The match is broken; it returns <code>false</code>.`,
        });
        return false;
      }

      localR.push(aId);
      localS.push(bId);
      snap({
        kind: 'probe',
        candId,
        probeR: aId,
        probeS: bId,
        matchedR: localR.slice(),
        matchedS: localS.slice(),
        vars: { root: fmt(rMap, candId), a: aVal, b: bVal, result: '…' },
        changed: ['a', 'b'],
        lines: ['same-rec'],
        text: `<code>IsSameTree(${aVal}, ${bVal})</code>: the values are equal (<code>${aVal} == ${bVal}</code>). Now let's compare the left and right children.`,
      });

      const leftOk = checkSame(candId, rMap.get(aId).left, sMap.get(bId).left, localR, localS);
      if (!leftOk) return false;
      return checkSame(candId, rMap.get(aId).right, sMap.get(bId).right, localR, localS);
    }

    function dfs(rId) {
      if (rId === null) {
        snap({
          kind: 'skip',
          vars: { root: 'null', a: '—', b: '—', result: 'false' },
          changed: ['root', 'result'],
          lines: ['sub-null'],
          text: '<code>root == null</code>: an empty branch can\'t contain the subtree; it returns <code>false</code>.',
        });
        return false;
      }

      const rNode = rMap.get(rId);
      snap({
        kind: 'cand',
        candId: rId,
        vars: { root: String(rNode.val), a: String(rNode.val), b: String(sMap.get(0).val), result: '…' },
        changed: ['root'],
        lines: ['sub-same'],
        text: `Candidate root <code>root = ${rNode.val}</code> is chosen. We try the subtree starting here with <code>IsSameTree(${rNode.val}, ${sMap.get(0).val})</code>.`,
      });

      const localR = [];
      const localS = [];
      if (checkSame(rId, rId, 0, localR, localS)) {
        matchedR = localR;
        matchedS = localS;
        snap({
          kind: 'done',
          candId: rId,
          matchedR: matchedR.slice(),
          matchedS: matchedS.slice(),
          vars: { root: String(rNode.val), a: '—', b: '—', result: 'true' },
          changed: ['result'],
          lines: ['sub-true'],
          text: `The subtree starting at node <code>${rNode.val}</code> is exactly the same as <code>subRoot</code>! <code>return true</code>.`,
        });
        return true;
      }

      snap({
        kind: 'next',
        candId: rId,
        vars: { root: String(rNode.val), a: '—', b: '—', result: '…' },
        changed: [],
        lines: ['sub-rec'],
        text: `No match at root <code>${rNode.val}</code>. We continue the search in the <code>root.left</code> and <code>root.right</code> subtrees.`,
      });

      if (dfs(rNode.left)) return true;
      if (dfs(rNode.right)) return true;
      return false;
    }

    const finalRes = dfs(0);
    if (!finalRes) {
      snap({
        kind: 'notfound',
        vars: { root: '—', a: '—', b: '—', result: 'false' },
        changed: ['result'],
        lines: ['sub-rec'],
        text: 'Every node of the main tree was tried, and none of them gave an exact match. Result: <code>false</code>.',
      });
    }
    return steps;
  }

  const CODE = [
    ['', '<span class="kw">public bool</span> IsSubtree(TreeNode root, TreeNode subRoot)'],
    ['', '{'],
    ['', '    <span class="kw">if</span> (subRoot == <span class="kw">null</span>) <span class="kw">return true</span>;'],
    ['sub-null', '    <span class="kw">if</span> (root == <span class="kw">null</span>) <span class="kw">return false</span>;'],
    ['sub-same', '    <span class="kw">if</span> (IsSameTree(root, subRoot))'],
    ['sub-true', '        <span class="kw">return true</span>;'],
    ['sub-rec', '    <span class="kw">return</span> IsSubtree(root.left, subRoot) || IsSubtree(root.right, subRoot);'],
    ['', '}'],
    ['', ''],
    ['', '<span class="kw">private bool</span> IsSameTree(TreeNode a, TreeNode b)'],
    ['', '{'],
    ['same-null', '    <span class="kw">if</span> (a == <span class="kw">null</span> &amp;&amp; b == <span class="kw">null</span>) <span class="kw">return true</span>;'],
    ['same-diff', '    <span class="kw">if</span> (a == <span class="kw">null</span> || b == <span class="kw">null</span> || a.val != b.val) <span class="kw">return false</span>;'],
    ['same-rec', '    <span class="kw">return</span> IsSameTree(a.left, b.left) &amp;&amp; IsSameTree(a.right, b.right);'],
    ['', '}'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    cand: ['Candidate root', ''],
    probe: ['Compare', ''],
    same: ['Branch matches', ''],
    fail: ['Mismatch', 'bad'],
    next: ['Go down', 'skip'],
    skip: ['Empty branch', 'skip'],
    done: ['Match!', 'ok'],
    notfound: ['Not found', 'bad'],
  };

  let presetIdx = 0;
  let steps = [];
  let idx = 0;
  let timer = null;

  function drawTree(svgEl, nodes, opts) {
    const map = new Map(nodes.map((n) => [n.id, n]));
    let edges = '';
    nodes.forEach((n) => {
      [n.left, n.right].forEach((cid) => {
        if (cid !== null) {
          const c = map.get(cid);
          edges += `<line class="edge" x1="${n.x}" y1="${n.y}" x2="${c.x}" y2="${c.y}"/>`;
        }
      });
    });
    let boxes = '';
    nodes.forEach((n) => {
      let cls = 'nd-box';
      if (opts.fail === n.id) cls += ' fail';
      else if (opts.probe === n.id) cls += ' probe';
      else if (opts.matched.includes(n.id)) cls += ' match';
      if (opts.cand === n.id) cls += ' cand';

      let tag = '';
      if (opts.cand === n.id && opts.probe === n.id) {
        tag = `<text class="nd-tag probe" x="${n.x}" y="${n.y - 26}">root / a</text>`;
      } else if (opts.cand === n.id) {
        tag = `<text class="nd-tag" x="${n.x}" y="${n.y - 26}">root</text>`;
      } else if (opts.probe === n.id) {
        tag = `<text class="nd-tag probe" x="${n.x}" y="${n.y - 26}">${opts.probeLabel}</text>`;
      }

      boxes += `<g>${tag}<rect class="${cls}" x="${n.x - 21}" y="${n.y - 19}" width="42" height="38"/><text class="nd-txt" x="${n.x}" y="${n.y}">${n.val}</text></g>`;
    });
    svgEl.innerHTML = edges + boxes;
  }

  function render() {
    const st = steps[idx];
    const preset = PRESETS[presetIdx];

    drawTree($('root-svg'), preset.rootNodes, {
      cand: st.candId,
      probe: st.probeR,
      fail: st.failR,
      matched: st.matchedR,
      probeLabel: 'a',
    });
    drawTree($('sub-svg'), preset.subNodes, {
      cand: null,
      probe: st.probeS,
      fail: st.failS,
      matched: st.matchedS,
      probeLabel: 'b',
    });

    const vList = [
      ['root.val', st.vars.root],
      ['a.val', st.vars.a],
      ['b.val', st.vars.b],
      ['result', st.vars.result],
    ];
    const keyMap = ['root', 'a', 'b', 'result'];
    $('vars').innerHTML = vList.map(([label, val], i) =>
      `<div class="var${st.changed.includes(keyMap[i]) ? ' changed' : ''}"><dt>${label}</dt><dd>${val}</dd></div>`).join('');

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
      b.setAttribute('aria-pressed', String(Number(b.dataset.p) === presetIdx)));
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
