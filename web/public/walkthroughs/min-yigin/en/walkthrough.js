(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_OPS = 10;

  // Steps: mirrors MinStack.cs line by line.
  // values and mins are arrays from bottom to top. results[k] is what call k returned
  // (null for void calls, undefined while it has not run yet); call 0 is the constructor.
  // newCol: the stack whose top was pushed on this step ('v' or 'm').
  // probe: the cell read with Peek() on this step ({ col, level }).
  // gone: the pair removed by Pop() on this step ({ v, m }).
  function buildSteps(ops) {
    const values = [];
    const mins = [];
    const calls = ['MinStack()', ...ops.map(opLabel)];
    const results = calls.map(() => undefined);
    const steps = [];
    let call = 0;
    let val;
    const snap = (s) => steps.push({
      values: values.slice(), mins: mins.slice(), results: results.slice(), calls, call, val,
      newCol: null, probe: null, gone: null, changed: [], ...s,
    });

    results[0] = null;
    snap({
      kind: 'start', lines: ['ctor', 'ctorV', 'ctorM'],
      text: 'LeetCode first calls <code>new MinStack()</code>. The constructor creates two empty stacks: <code>values</code> for the numbers and <code>mins</code> for the minimums.',
    });

    ops.forEach((op, k) => {
      call = k + 1;
      val = undefined;

      if (op.kind === 'push') {
        val = op.val;
        values.push(val);
        snap({
          kind: 'push', lines: ['push', 'pushV'], changed: ['val', 'values.Count'], newCol: 'v',
          text: `<code>Push(${val})</code>: ${val} goes on top of <code>values</code> first. <code>mins</code> has no note for this level yet.`,
        });

        if (mins.length === 0) {
          mins.push(val);
          results[call] = null;
          snap({
            kind: 'note', lines: ['if', 'pushFirst'], changed: ['mins.Count'], newCol: 'm',
            text: `<code>mins</code> is empty, so ${val} is the only number on the stack. Being the only number, it is also the minimum: ${val} is written to <code>mins</code>.`,
          });
        } else {
          const below = mins[mins.length - 1];
          const m = Math.min(val, below);
          mins.push(m);
          results[call] = null;
          const verdict = val < below
            ? `The new number is smaller: the minimum is now ${val}.`
            : val === below
              ? `They are equal: the minimum is still ${m}. The note is written anyway, so the two stacks stay the same height.`
              : `The new number is larger: the minimum didn't change, so the note below (${below}) is written for this level too.`;
          snap({
            kind: 'note', lines: ['if', 'else', 'pushMin'], changed: ['mins.Count'], newCol: 'm',
            probe: { col: 'm', level: mins.length - 2 },
            text: `<code>mins</code> is not empty. The note for the level below is <code>mins.Peek()</code> = ${below}. <code>Math.Min(${val}, ${below})</code> → ${m}. ${verdict}`,
          });
        }
      } else if (op.kind === 'pop') {
        const v = values.pop();
        const m = mins.pop();
        results[call] = null;
        let after;
        if (mins.length === 0) after = ' The stacks are now empty.';
        else {
          const newMin = mins[mins.length - 1];
          after = newMin !== m
            ? ` The minimum is now ${newMin}: this value was already written in the note for the level below, so no number had to be searched.`
            : ` The note for the level below is also ${newMin}: the minimum didn't change.`;
        }
        snap({
          kind: 'pop', lines: ['pop', 'popV', 'popM'], changed: ['values.Count', 'mins.Count'], gone: { v, m },
          text: `<code>Pop()</code>: the tops of both stacks are removed together: ${v} from <code>values</code>, ${m} from <code>mins</code>.${after}`,
        });
      } else if (op.kind === 'top') {
        const v = values[values.length - 1];
        results[call] = v;
        snap({
          kind: 'top', lines: ['top', 'topR'], probe: { col: 'v', level: values.length - 1 },
          text: `<code>Top()</code>: looks at the top of <code>values</code> without removing the number → <b>${v}</b>.`,
        });
      } else {
        const m = mins[mins.length - 1];
        results[call] = m;
        snap({
          kind: 'getmin', lines: ['getmin', 'minR'], probe: { col: 'm', level: mins.length - 1 },
          text: `<code>GetMin()</code>: looks at the top of <code>mins</code> → <b>${m}</b>. None of the numbers in <code>values</code> were examined.`,
        });
      }
    });

    call = calls.length;
    val = undefined;
    const output = `[${results.map((r) => (r === null ? 'null' : r)).join(',')}]`;
    snap({
      kind: 'done', lines: [],
      text: ops.length === 0
        ? `No more calls. Output: <code>${output}</code>.`
        : `All calls are done. The output LeetCode expects: <code>${output}</code>.`,
    });
    return steps;
  }

  function opLabel(op) {
    if (op.kind === 'push') return `push(${op.val})`;
    return op.kind === 'getmin' ? 'getMin()' : `${op.kind}()`;
  }

  // Rendering
  const K = (word) => `<span class="kw">${word}</span>`;
  const CODE = [
    ['', `${K('private')} ${K('readonly')} Stack&lt;${K('int')}&gt; values;`],
    ['', `${K('private')} ${K('readonly')} Stack&lt;${K('int')}&gt; mins;`],
    ['', ''],
    ['ctor', `${K('public')} MinStack()`],
    ['', '{'],
    ['ctorV', `    values = ${K('new')} Stack&lt;${K('int')}&gt;();`],
    ['ctorM', `    mins = ${K('new')} Stack&lt;${K('int')}&gt;();`],
    ['', '}'],
    ['', ''],
    ['push', `${K('public')} ${K('void')} Push(${K('int')} val)`],
    ['', '{'],
    ['pushV', '    values.Push(val);'],
    ['if', `    ${K('if')} (mins.Count == 0)`],
    ['pushFirst', '        mins.Push(val);'],
    ['else', `    ${K('else')}`],
    ['pushMin', '        mins.Push(Math.Min(val, mins.Peek()));'],
    ['', '}'],
    ['', ''],
    ['pop', `${K('public')} ${K('void')} Pop()`],
    ['', '{'],
    ['popV', '    values.Pop();'],
    ['popM', '    mins.Pop();'],
    ['', '}'],
    ['', ''],
    ['top', `${K('public')} ${K('int')} Top()`],
    ['', '{'],
    ['topR', `    ${K('return')} values.Peek();`],
    ['', '}'],
    ['', ''],
    ['getmin', `${K('public')} ${K('int')} GetMin()`],
    ['', '{'],
    ['minR', `    ${K('return')} mins.Peek();`],
    ['', '}'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Start', ''], push: ['Push', ''], note: ['Push · mins note', ''],
    pop: ['Pop', ''], top: ['Top', ''], getmin: ['GetMin', ''], done: ['Done', 'ok'],
  };

  let listText = 'push -2, push 0, push -3, getMin, pop, top, getMin';
  let steps = [];
  let idx = 0;
  let timer = null;

  // Returns the list of calls, or null when the text is not valid.
  function parse(raw) {
    const parts = raw.split(',').map((p) => p.trim().toLowerCase()).filter(Boolean);
    if (parts.length > MAX_OPS) return null;
    const ops = [];
    let height = 0;
    for (const p of parts) {
      const push = p.match(/^push\s*\(?\s*(-?\d+)\s*\)?$/);
      const other = p.match(/^(pop|top|getmin)\s*(\(\s*\))?$/);
      if (push) {
        const v = Number(push[1]);
        if (v < -999 || v > 999) return null;
        ops.push({ kind: 'push', val: v === 0 ? 0 : v });
        height++;
      } else if (other) {
        if (height === 0) return null; // LeetCode never calls these on an empty stack
        ops.push({ kind: other[1] });
        if (other[1] === 'pop') height--;
      } else {
        return null;
      }
    }
    return ops;
  }

  function renderStacks(st) {
    const h = st.values.length;
    let html = '<span></span><span class="head">values</span><span class="head">mins</span><span></span>';
    if (st.gone) {
      html += `<span class="side"></span><span class="cell gone">${st.gone.v}</span><span class="cell gone">${st.gone.m}</span><span class="note bad">← popped</span>`;
    }
    if (h === 0 && !st.gone) html += '<span></span><p class="empty-note span">The stacks are empty.</p>';
    for (let i = h - 1; i >= 0; i--) {
      let note = '';
      let noteCls = 'note';
      let vCls = 'cell';
      let vState = 'plain';
      if (i === h - 1 && st.newCol === 'v') { vState = 'new'; note = '← new'; noteCls = 'note new'; }
      if (st.probe && st.probe.col === 'v' && st.probe.level === i) { vCls += ' probe'; note = '← Peek()'; noteCls = 'note'; }

      let mCls = 'cell';
      let mState = 'plain';
      let mText = '?';
      if (i >= st.mins.length) mCls += ' pending';
      else {
        mText = st.mins[i];
        const isTop = i === st.mins.length - 1;
        if (isTop && st.newCol === 'm') { mState = 'new'; note = '← new note'; noteCls = 'note new'; }
        else if (isTop) mState = 'min';
        if (st.probe && st.probe.col === 'm' && st.probe.level === i) { mCls += ' probe'; note = '← Peek()'; noteCls = 'note'; }
      }

      html += `<span class="side">${i === h - 1 ? 'top' : ''}</span>` +
        `<span class="${vCls}" data-state="${vState}">${st.values[i]}</span>` +
        `<span class="${mCls}" data-state="${mState}">${mText}</span>` +
        `<span class="${noteCls}">${note}</span>`;
    }
    html += '<span></span><div class="floor" aria-hidden="true"></div><span></span>';
    return html;
  }

  function render() {
    const st = steps[idx];

    $('calls').innerHTML = st.calls.map((label, k) => {
      const r = st.results[k];
      const res = r === undefined ? '' : r === null ? 'null' : r;
      const state = k === st.call ? ' now' : k < st.call ? ' done' : '';
      return `<div class="call${state}"><span class="op">${label}</span><span class="res${typeof r === 'number' ? ' num' : ''}">${res}</span></div>`;
    }).join('');

    $('stacks').innerHTML = renderStacks(st);

    const vars = [['val', st.val], ['values.Count', st.values.length], ['mins.Count', st.mins.length]];
    $('vars').innerHTML = vars.map(([name, v]) =>
      `<div class="var${st.changed.includes(name) ? ' changed' : ''}"><dt>${name}</dt><dd>${v === undefined ? '—' : v}</dd></div>`).join('');

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

  function restart(text, ops) {
    stop();
    listText = text;
    steps = buildSteps(ops);
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
    const ops = parse(e.target.value);
    if (!ops) { $('list-err').hidden = false; return; }
    $('list-err').hidden = true;
    restart(e.target.value, ops);
  });
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(listText, parse(listText));
})();
