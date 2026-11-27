(() => {
  const $ = (id) => document.getElementById(id);

  // Steps: mirrors Solution.cs line by line.
  // Node positions never move; -1 stands for null, undefined for "not declared yet".
  function buildSteps(vals) {
    const n = vals.length;
    const steps = [];
    const reversed = Array(n).fill(false);
    let prev = -1;
    let current = n > 0 ? 0 : -1;
    let next;
    const name = (k) => (k === -1 ? '<code>null</code>' : `<code>[${vals[k]}]</code>`);
    const snap = (step) => steps.push({ reversed: reversed.slice(), prev, current, next, cut: -1, fresh: -1, ...step });

    snap({
      kind: 'init', lines: ['prev', 'current'], changed: ['prev', 'current'],
      text: n === 0
        ? 'The list is empty, so <code>head</code> is already <code>null</code>. <code>prev = null</code>, <code>current = head</code> → <code>null</code>.'
        : `<code>prev = null</code>, <code>current = head</code>. <code>current</code> points at the ${name(0)} node at the head of the list. <code>prev</code> is null, because once the list is reversed the first node becomes the last one and points at null.`,
    });

    while (current !== -1) {
      const i = current;

      next = i + 1 < n ? i + 1 : -1;
      snap({
        kind: 'save', lines: ['while', 'save'], changed: ['next'],
        text: `First we save the next node so we don't lose the rest of the list: <code>next = current.next</code> → ${name(next)}.`,
      });

      reversed[i] = true;
      snap({
        kind: 'turn', lines: ['turn'], changed: [], fresh: i, cut: i + 1,
        text: `We flip the arrow of the ${name(i)} node backward: <code>current.next = prev</code>. The arrow now points back: ${name(prev)} ← ${name(i)}.` +
          (next === -1 ? '' : ` The link between ${name(i)} and ${name(next)} is cut; we can now reach the ${name(next)} node only through <code>next</code>.`),
      });

      prev = i;
      snap({
        kind: 'movePrev', lines: ['movePrev'], changed: ['prev'],
        text: `<code>prev</code> moves one step forward: <code>prev = current</code> → ${name(prev)}.`,
      });

      current = next;
      snap({
        kind: 'moveCur', lines: ['moveCur'], changed: ['current'],
        text: current === -1
          ? '<code>current</code> moves one step forward: <code>current = next</code> → <code>null</code>. We reached the end of the list.'
          : `<code>current</code> moves one step forward: <code>current = next</code> → ${name(current)}. The next round is for this node.`,
      });
    }

    snap({
      kind: 'done', lines: ['while', 'ret'], changed: [],
      text: n === 0
        ? 'Since <code>current</code> was <code>null</code> from the start, the loop never ran. <code>return prev</code> → <code>null</code>. The reverse of an empty list is still an empty list.'
        : `The loop ended because <code>current == null</code>. <code>return prev</code> → ${name(prev)}. This is the new head; the list is now <code>${vals.slice().reverse().join(' → ')} → null</code>. <code>head</code> still points at the ${name(0)} node, but that's now the last node, so writing <code>return head</code> would be wrong.`,
    });
    return steps;
  }

  // Follows the arrows from node k and lists the values it reaches.
  function readFrom(k, reversed, vals) {
    const out = [];
    while (k !== -1) {
      out.push(vals[k]);
      k = reversed[k] ? k - 1 : (k + 1 < vals.length ? k + 1 : -1);
    }
    out.push('null');
    return out.join(' → ');
  }

  // Rendering
  const CODE = [
    ['prev', 'ListNode prev = <span class="kw">null</span>;'],
    ['current', 'ListNode current = head;'],
    ['', ''],
    ['while', '<span class="kw">while</span> (current != <span class="kw">null</span>)'],
    ['', '{'],
    ['save', '    ListNode next = current.next;'],
    ['turn', '    current.next = prev;'],
    ['movePrev', '    prev = current;'],
    ['moveCur', '    current = next;'],
    ['', '}'],
    ['', ''],
    ['ret', '<span class="kw">return</span> prev;'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    init: ['Start', ''], save: ['Save next', ''], turn: ['Flip arrow', ''],
    movePrev: ['prev advances', ''], moveCur: ['current advances', ''], done: ['Done', 'ok'],
  };

  let listText = '1, 2, 3, 4, 5';
  let vals = [];
  let steps = [];
  let idx = 0;
  let timer = null;

  function parse(raw) {
    const parts = raw.split(/[\s,]+/).filter(Boolean);
    if (parts.length > 7) return null;
    const out = parts.map(Number);
    return out.every((v) => Number.isInteger(v) && v >= -5000 && v <= 5000) ? out : null;
  }

  function seg(dir, extra) {
    const glyph = extra === 'cut' ? '✂' : dir === 'fwd' ? '→' : dir === 'back' ? '←' : '·';
    return `<div class="seg${extra ? ' ' + extra : ''}" data-dir="${extra === 'cut' ? 'cut' : dir}" aria-hidden="true">${glyph}</div>`;
  }

  function tagsFor(pos, st) {
    // pos: 'L' (left null), 'R' (right null) or a node index.
    if (vals.length === 0) {
      return '<span class="t-current">current</span><span class="t-prev">prev</span><span class="t-head">head</span>';
    }
    const prevPos = st.prev === -1 ? 'L' : st.prev;
    const curPos = st.current === -1 ? 'R' : st.current;
    const nextPos = st.next === undefined ? undefined : st.next === -1 ? 'R' : st.next;
    const t = [];
    if (pos === curPos) t.push('<span class="t-current">current</span>');
    if (pos === prevPos) t.push('<span class="t-prev">prev</span>');
    if (nextPos !== undefined && pos === nextPos) t.push('<span class="t-next">next</span>');
    if (pos === 0) t.push('<span class="t-head">head</span>');
    if (st.kind === 'done' && pos === st.prev) t.push('<span class="t-newhead">new head</span>');
    return t.join('');
  }

  function render() {
    const st = steps[idx];
    const n = vals.length;
    let html = '';

    if (n === 0) {
      html = `<div class="slot"><div class="box null">null</div><div class="tags">${tagsFor('L', st)}</div></div>`;
    } else {
      html += `<div class="slot"><div class="box null">null</div><div class="tags">${tagsFor('L', st)}</div></div>`;
      for (let k = 0; k <= n; k++) {
        // Segment k sits between node k-1 (or the left null) and node k (or the right null).
        let dir;
        if (k === 0) dir = st.reversed[0] ? 'back' : 'none';
        else if (k === n) dir = st.reversed[n - 1] ? 'none' : 'fwd';
        else dir = !st.reversed[k - 1] ? 'fwd' : st.reversed[k] ? 'back' : 'none';
        const extra = k === st.fresh ? 'fresh' : k === st.cut ? 'cut' : '';
        html += seg(dir, extra);
        if (k < n) {
          const cls = 'box' + (k === st.current ? ' cur' : '');
          html += `<div class="slot"><div class="${cls}" data-state="${st.reversed[k] ? 'done' : 'todo'}">${vals[k]}</div><div class="tags">${tagsFor(k, st)}</div></div>`;
        }
      }
      html += `<div class="slot"><div class="box null">null</div><div class="tags">${tagsFor('R', st)}</div></div>`;
    }
    $('chain').innerHTML = html;

    const show = (k) => (k === undefined ? '—' : k === -1 ? 'null' : `[${vals[k]}]`);
    const vars = [['prev', st.prev], ['current', st.current], ['next', st.next]];
    $('vars').innerHTML = vars.map(([name, k]) =>
      `<div class="var${st.changed.includes(name) ? ' changed' : ''}"><dt>${name}</dt><dd>${show(k)}</dd></div>`).join('');

    $('read-prev').textContent = readFrom(st.prev, st.reversed, vals);
    $('read-cur').textContent = readFrom(st.current, st.reversed, vals);

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
    vals = parsed;
    steps = buildSteps(vals);
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
