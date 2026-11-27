(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_N = 3;

  // Steps: one per choice, one per saved permutation and one per undo, in the order the code runs them.
  // path: indices chosen so far (also the tree node we are at); frames: the i of each open Backtrack call.
  function buildSteps(nums) {
    const n = nums.length;
    let fact = 1;
    for (let k = 2; k <= n; k++) fact *= k;
    const steps = [];
    const current = [];
    const path = [];
    const used = new Array(n).fill(false);
    const result = [];
    const done = new Set();
    const saved = new Map();
    const frames = [];
    const snap = (o) => steps.push({
      current: current.slice(), path: path.slice(), used: used.slice(),
      result: result.map((r) => r.slice()), done: new Set(done), saved: new Map(saved), frames: frames.slice(),
      mark: null, skipped: [], removed: null, finished: false, lines: [], ...o,
    });
    const arr = (a) => `[${a.join(', ')}]`;
    const c = (s) => `<code>${s}</code>`;

    snap({
      kind: 'start', lines: ['init', 'call0'],
      text: `${c('nums')} = ${arr(nums)}: ${n} numbers, so ${n}! = ${fact} permutations will be found. ${c('result')} and ${c('current')} are empty, and every slot of ${c('used')} is ${c('false')}. ${c('Permute')} makes the first ${c('Backtrack')} call; this call will fill slot 1.`,
    });

    function backtrack() {
      const d = current.length;
      frames.push(undefined);
      if (d === n) {
        result.push(current.slice());
        saved.set(path.join(','), result.length);
        let text = `The list is full (${c(`current.Count == ${n}`)}): ${arr(current)} is a permutation. A copy is added to ${c('result')}; ${result.length} / ${fact} permutations found so far.`;
        if (result.length === 1) text += ` The copy is essential, because ${c('current')} is about to change.`;
        text += ` This call ends with ${c('return')}.`;
        snap({ kind: 'save', lines: ['full', 'save', 'return'], text });
        frames.pop();
        done.add(path.join(','));
        return;
      }

      let skipped = [];
      let tried = 0;
      for (let k = 0; k < n; k++) {
        if (used[k]) { skipped.push(k); continue; }
        frames[frames.length - 1] = k;
        current.push(nums[k]);
        used[k] = true;
        path.push(k);

        let text = tried === 0 ? `Slot ${d + 1}: ` : `Next option for slot ${d + 1}: `;
        if (skipped.length) {
          text += `${skipped.map((q) => c(`i = ${q}`)).join(' and ')} skipped, because ${skipped.map((q) => nums[q]).join(' and ')} ${skipped.length > 1 ? 'are' : 'is'} already in the list. `;
        }
        text += `${nums[k]} is chosen with ${c(`i = ${k}`)}: ${c('current')} = ${arr(current)}, ${c(`used[${k}] = true`)}. `;
        text += current.length === n
          ? `The list is now full; ${c('Backtrack')} still calls itself, and the next call will notice that it's full.`
          : `${c('Backtrack')} calls itself for slot ${d + 2}.`;
        snap({ kind: 'choose', lines: ['for', 'choose', 'recurse'].concat(skipped.length ? ['skip'] : []), mark: k, skipped, text });
        skipped = [];
        tried++;

        backtrack();

        const childKey = path.join(',');
        current.pop();
        used[k] = false;
        path.pop();

        const later = [];
        for (let q = k + 1; q < n; q++) later.push(q);
        const hasMore = later.some((q) => !used[q]);
        let undoText = `Back in the call that fills slot ${d + 1}. Undo: ${nums[k]} is removed from the list, ${c(`used[${k}] = false`)}. ${c('current')} = ${arr(current)}. `;
        if (hasMore) {
          undoText += `The loop moves on to the next number for slot ${d + 1}.`;
        } else {
          const trailing = later.filter((q) => used[q]);
          if (trailing.length) undoText += `${trailing.map((q) => c(`i = ${q}`)).join(' and ')}: ${trailing.map((q) => nums[q]).join(' and ')} ${trailing.length > 1 ? 'are' : 'is'} already in the list. `;
          undoText += d === 0
            ? `No numbers left to try for slot 1; the first ${c('Backtrack')} call ends.`
            : `No numbers left to try for slot ${d + 1}; this call ends too.`;
        }
        snap({ kind: 'undo', lines: ['undo'], mark: k, removed: { key: childKey, value: nums[k], slot: d }, text: undoText });
      }
      frames.pop();
      done.add(path.join(','));
    }

    backtrack();

    snap({
      kind: 'end', lines: ['ret'], finished: true,
      text: `All branches have been explored. ${c('Permute')} returns ${c('result')}: ${result.length} permutations, the same as ${n}! = ${fact}.`,
    });

    // Mark the variables that differ from the previous step.
    let prev = null;
    for (const st of steps) {
      st.vars = { i: st.frames.length ? st.frames[st.frames.length - 1] : undefined, cnt: st.current.length, res: st.result.length };
      st.changed = prev ? Object.keys(st.vars).filter((key) => st.vars[key] !== prev[key]) : [];
      prev = st.vars;
    }
    return steps;
  }

  // Tree layout: leaves side by side in the order the code reaches them, each parent centered over its children.
  const LEAF_W = 52;
  const ROW_H = 60;
  const R = 16;
  const TOP = 6;
  const MIN_W = 160;

  function layoutTree(n) {
    const nodes = [];
    let leaf = 0;
    function rec(idxs, parent) {
      const node = { key: idxs.join(','), idxs: idxs.slice(), depth: idxs.length, parent };
      nodes.push(node);
      if (idxs.length === n) {
        node.x = leaf++;
      } else {
        const kids = [];
        for (let k = 0; k < n; k++) {
          if (idxs.includes(k)) continue;
          idxs.push(k);
          kids.push(rec(idxs, node));
          idxs.pop();
        }
        node.x = (kids[0].x + kids[kids.length - 1].x) / 2;
      }
      return node;
    }
    rec([], null);
    const width = Math.max(leaf * LEAF_W, MIN_W);
    const off = (width - leaf * LEAF_W) / 2 + LEAF_W / 2;
    for (const node of nodes) {
      node.cx = off + node.x * LEAF_W;
      node.cy = TOP + R + node.depth * ROW_H;
    }
    return { nodes, width, height: TOP + R + n * ROW_H + R + 22 };
  }

  function nodeState(st, key) {
    if (st.removed && st.removed.key === key) return 'undo';
    if (st.finished) return st.saved.has(key) ? 'saved' : 'done';
    const here = st.path.join(',');
    if (key === here) return st.kind === 'save' ? 'new' : 'cur';
    if (st.path.length && (key === '' || here.startsWith(key + ','))) return 'path';
    if (st.saved.has(key)) return 'saved';
    if (st.done.has(key)) return 'done';
    return 'todo';
  }

  // Rendering
  const CODE = [
    ['', '<span class="kw">public</span> IList&lt;IList&lt;<span class="kw">int</span>&gt;&gt; Permute(<span class="kw">int</span>[] nums)'],
    ['', '{'],
    ['init', '    <span class="kw">var</span> result = <span class="kw">new</span> List&lt;IList&lt;<span class="kw">int</span>&gt;&gt;();'],
    ['init', '    <span class="kw">var</span> current = <span class="kw">new</span> List&lt;<span class="kw">int</span>&gt;();'],
    ['init', '    <span class="kw">bool</span>[] used = <span class="kw">new bool</span>[nums.Length];'],
    ['', ''],
    ['call0', '    Backtrack(nums, used, current, result);'],
    ['ret', '    <span class="kw">return</span> result;'],
    ['', '}'],
    ['', ''],
    ['', '<span class="kw">private static void</span> Backtrack(<span class="kw">int</span>[] nums, <span class="kw">bool</span>[] used,'],
    ['', '    List&lt;<span class="kw">int</span>&gt; current, List&lt;IList&lt;<span class="kw">int</span>&gt;&gt; result)'],
    ['', '{'],
    ['full', '    <span class="kw">if</span> (current.Count == nums.Length)'],
    ['', '    {'],
    ['save', '        result.Add(<span class="kw">new</span> List&lt;<span class="kw">int</span>&gt;(current));'],
    ['return', '        <span class="kw">return</span>;'],
    ['', '    }'],
    ['', ''],
    ['for', '    <span class="kw">for</span> (<span class="kw">int</span> i = 0; i &lt; nums.Length; i++)'],
    ['', '    {'],
    ['skip', '        <span class="kw">if</span> (used[i]) <span class="kw">continue</span>;'],
    ['', ''],
    ['choose', '        current.Add(nums[i]);'],
    ['choose', '        used[i] = <span class="kw">true</span>;'],
    ['', ''],
    ['recurse', '        Backtrack(nums, used, current, result);'],
    ['', ''],
    ['undo', '        current.RemoveAt(current.Count - 1);'],
    ['undo', '        used[i] = <span class="kw">false</span>;'],
    ['', '    }'],
    ['', '}'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = [...document.querySelectorAll('.ln[data-id]')];

  const TAGS = {
    start: ['Start', ''], choose: ['Choose', ''], save: ['Save', 'ok'], undo: ['Undo', 'bad'], end: ['Done', 'ok'],
  };

  let nums = [];
  let tree = null;
  let steps = [];
  let idx = 0;
  let timer = null;

  function parse(raw) {
    const t = raw.trim().replace(/^\[/, '').replace(/\]$/, '').trim();
    if (t === '') return null;
    const parts = t.split(',').map((p) => p.trim());
    if (parts.length > MAX_N) return null;
    const out = [];
    for (const p of parts) {
      if (!/^-?\d{1,2}$/.test(p)) return null;
      const v = Number(p) || 0;
      if (v < -10 || v > 10 || out.includes(v)) return null;
      out.push(v);
    }
    return out;
  }

  function renderTree(st) {
    const { nodes, width, height } = tree;
    let edges = '';
    let circles = '';
    for (const node of nodes) {
      const s = nodeState(st, node.key);
      if (node.parent) {
        const es = ['cur', 'path', 'new'].includes(s) ? 'path' : s === 'undo' ? 'undo' : ['done', 'saved'].includes(s) ? 'done' : 'todo';
        edges += `<line class="edge" data-st="${es}" x1="${node.parent.cx}" y1="${node.parent.cy + R}" x2="${node.cx}" y2="${node.cy - R}"/>`;
      }
      const label = node.depth === 0 ? '[ ]' : String(nums[node.idxs[node.depth - 1]]);
      circles += `<g class="node" data-st="${s}"><circle cx="${node.cx}" cy="${node.cy}" r="${R}"/><text x="${node.cx}" y="${node.cy}"${node.depth === 0 ? ' style="font-size:11px"' : ''}>${label}</text></g>`;
      if (st.saved.has(node.key)) {
        circles += `<text class="order" x="${node.cx}" y="${node.cy + R + 13}">#${st.saved.get(node.key)}</text>`;
      }
    }
    $('tree').innerHTML = `<svg class="tree" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Decision tree">${edges}${circles}</svg>`;
  }

  function render() {
    const st = steps[idx];
    const n = nums.length;
    renderTree(st);

    // current: one box per slot
    let cur = `<div class="vgrid" style="grid-template-columns: repeat(${n}, 48px)">`;
    for (let s = 0; s < n; s++) {
      if (s < st.current.length) {
        const state = st.kind === 'save' ? 'saved' : st.kind === 'choose' && s === st.current.length - 1 ? 'cur' : 'path';
        cur += `<span class="cell" data-st="${state}">${st.current[s]}</span>`;
      } else if (st.removed && st.removed.slot === s) {
        cur += `<span class="cell strike" data-st="undo">${st.removed.value}</span>`;
      } else {
        cur += '<span class="cell" data-st="empty"></span>';
      }
    }
    for (let s = 0; s < n; s++) cur += `<span class="idx">[${s}]</span>`;
    $('cur-row').innerHTML = cur + '</div>';

    // nums and used, one column per index
    const activeI = st.vars.i;
    let nu = `<div class="vgrid" style="grid-template-columns: max-content repeat(${n}, 56px)"><span></span>`;
    for (let k = 0; k < n; k++) {
      const lbl = k === activeI ? 'i' : st.skipped.includes(k) ? 'skipped' : '';
      nu += `<span class="lbl${lbl === 'skipped' ? ' skip' : ''}">${lbl}</span>`;
    }
    nu += '<span class="rh"><code>nums</code></span>';
    for (let k = 0; k < n; k++) nu += `<span class="cell"${k === activeI ? ' data-st="ptr"' : ''}>${nums[k]}</span>`;
    nu += '<span class="rh"><code>used</code></span>';
    for (let k = 0; k < n; k++) {
      let state = st.used[k] ? 'path' : '';
      if (k === st.mark) state = st.kind === 'choose' ? 'cur' : st.kind === 'undo' ? 'undo' : state;
      nu += `<span class="cell ${st.used[k] ? 't' : 'f'}"${state ? ` data-st="${state}"` : ''}>${st.used[k]}</span>`;
    }
    nu += '<span></span>';
    for (let k = 0; k < n; k++) nu += `<span class="idx">[${k}]</span>`;
    $('nu-row').innerHTML = nu + '</div>';

    // result
    $('res-row').innerHTML = st.result.length === 0
      ? '<p class="empty">no permutations yet</p>'
      : `<div class="chips">${st.result.map((r, k) =>
        `<span class="chip"${st.kind === 'save' && k === st.result.length - 1 ? ' data-st="new"' : ''}><span class="k">#${k + 1}</span>[${r.join(', ')}]</span>`).join('')}</div>`;

    // variables
    const show = (v) => (v === undefined ? '—' : String(v));
    const vars = [['i', st.vars.i, 'i'], ['current.Count', st.vars.cnt, 'cnt'], ['result.Count', st.vars.res, 'res']];
    $('vars').innerHTML = vars.map(([name, v, key]) =>
      `<div class="var${st.changed.includes(key) ? ' changed' : ''}"><dt>${name}</dt><dd>${show(v)}</dd></div>`).join('');

    // call stack
    let stack = `<li${st.frames.length === 0 ? ' class="top"' : ''}>Permute</li>`;
    st.frames.forEach((f, d) => {
      const what = d === n ? 'list full' : `slot ${d + 1} · i = ${show(f)}`;
      stack += `<li${d === st.frames.length - 1 ? ' class="top"' : ''} style="margin-left: ${(d + 1) * 14}px">Backtrack · ${what}</li>`;
    });
    $('stack').innerHTML = stack;

    $('result').textContent = st.finished ? `[${st.result.map((r) => `[${r.join(',')}]`).join(', ')}]` : '—';
    $('out').dataset.kind = st.finished ? 'done' : '';

    codeLines.forEach((el) => el.classList.toggle('hl', st.lines.includes(el.dataset.id)));

    const [tagText, tagKind] = TAGS[st.kind];
    $('step-count').textContent = `Step ${idx + 1} / ${steps.length}`;
    $('step-tag').textContent = tagText;
    $('step-tag').dataset.kind = tagKind;
    $('step-text').innerHTML = st.text;
    $('prev-btn').disabled = idx === 0;
    $('reset').disabled = idx === 0;
    $('next-btn').disabled = idx === steps.length - 1;

    const key = nums.join(',');
    document.querySelectorAll('.presets button').forEach((b) => b.setAttribute('aria-pressed', String(parse(b.dataset.l).join(',') === key)));
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Play';
  }

  function restart(list) {
    stop();
    nums = list;
    tree = layoutTree(list.length);
    $('tree-col').style.width = `${Math.max(tree.width, 240)}px`;
    steps = buildSteps(list);
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
  document.querySelectorAll('.presets button').forEach((b) => b.addEventListener('click', () => {
    $('list').value = b.dataset.l;
    $('list-err').hidden = true;
    restart(parse(b.dataset.l));
  }));
  $('list').addEventListener('input', (e) => {
    const parsed = parse(e.target.value);
    if (!parsed) { $('list-err').hidden = false; return; }
    $('list-err').hidden = true;
    restart(parsed);
  });
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart([1, 2, 3]);
})();
