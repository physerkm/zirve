(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_N = 12;

  // Steps: mirrors Solution.cs line by line.
  // twoAt/oneAt: which stair's count twoBelow/oneBelow hold right now (undefined before they are declared).
  function buildSteps(n) {
    const w = [0, 1, 2];
    for (let k = 3; k <= n; k++) w[k] = w[k - 1] + w[k - 2];
    const steps = [];
    let twoAt;
    let oneAt;
    let step;
    let ways;
    let cur = -1;
    let known = 0;
    let show = null;
    const snap = (s) => steps.push({ w, twoAt, oneAt, step, ways, cur, known, show, changed: [], ...s });

    if (n <= 2) {
      snap({
        kind: 'check', lines: ['if'],
        text: `<code>n = ${n}</code>, so <code>n &lt;= 2</code> is true. A staircase this short needs no computation; the answer is simply <code>n</code>.`,
      });
      known = n;
      show = { at: n, split: false };
      snap({
        kind: 'done', lines: ['retn'],
        text: n === 1
          ? 'There is only one way to climb a single step: <code>1</code>. <code>return n</code> → 1.'
          : 'There are two ways to climb two steps: <code>1+1</code> and <code>2</code>. <code>return n</code> → 2.',
      });
      return steps;
    }

    snap({
      kind: 'check', lines: ['if'],
      text: `<code>n = ${n}</code> is greater than 2, so the <code>if</code> is skipped. We will compute the answer step by step, from the bottom up.`,
    });

    twoAt = 1;
    oneAt = 2;
    known = 2;
    show = { at: 2, split: false };
    snap({
      kind: 'init', lines: ['two', 'one'], changed: ['twoBelow', 'oneBelow'],
      text: 'We already know the answers for the first two steps: there is one way to step 1 (<code>1</code>) and two ways to step 2 (<code>1+1</code>, <code>2</code>). <code>twoBelow = 1</code>, <code>oneBelow = 2</code>.',
    });

    for (step = 3; step <= n; step++) {
      ways = w[step];
      cur = step;
      known = step;
      show = { at: step, split: true };
      snap({
        kind: 'sum', lines: ['for', 'ways'], changed: ['step', 'ways'],
        text: `<code>step = ${step}</code>: now it is step ${step}'s turn. You reach it either from step ${step - 1} with 1 step (<code>oneBelow</code> = ${w[step - 1]} ways) or from step ${step - 2} with 2 steps (<code>twoBelow</code> = ${w[step - 2]} ways). <code>ways = ${w[step - 1]} + ${w[step - 2]}</code> → ${ways}.`,
      });

      twoAt = oneAt;
      snap({
        kind: 'shiftTwo', lines: ['shiftTwo'], changed: ['twoBelow'],
        text: `<code>twoBelow = oneBelow</code> → ${w[twoAt]}. Right now both variables hold the count for step ${twoAt}.` +
          (step === 3 ? ` This line must come before <code>oneBelow = ways</code>; otherwise the ${w[twoAt]} in <code>oneBelow</code> would be overwritten and lost.` : ''),
      });

      oneAt = step;
      snap({
        kind: 'shiftOne', lines: ['shiftOne'], changed: ['oneBelow'],
        text: `<code>oneBelow = ways</code> → ${ways}. Both variables moved up one step: <code>twoBelow</code> holds the count for step ${step - 1}, <code>oneBelow</code> the count for step ${step}.` +
          (step < n ? ` The next iteration is for step ${step + 1}.` : ''),
      });
    }

    cur = -1;
    snap({
      kind: 'done', lines: ['for', 'ret'],
      text: `<code>step</code> is now ${step}, which is greater than <code>n</code>; the loop ends. <code>return oneBelow</code> → ${w[n]}. There are ${w[n]} distinct ways to climb a staircase with ${n} steps.`,
    });
    return steps;
  }

  // Rendering
  const CODE = [
    ['if', '<span class="kw">if</span> (n &lt;= 2)'],
    ['retn', '    <span class="kw">return</span> n;'],
    ['', ''],
    ['two', '<span class="kw">int</span> twoBelow = 1;'],
    ['one', '<span class="kw">int</span> oneBelow = 2;'],
    ['', ''],
    ['for', '<span class="kw">for</span> (<span class="kw">int</span> step = 3; step &lt;= n; step++)'],
    ['', '{'],
    ['ways', '    <span class="kw">int</span> ways = oneBelow + twoBelow;'],
    ['', ''],
    ['shiftTwo', '    twoBelow = oneBelow;'],
    ['shiftOne', '    oneBelow = ways;'],
    ['', '}'],
    ['', ''],
    ['ret', '<span class="kw">return</span> oneBelow;'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    check: ['Check', ''], init: ['Start', ''], sum: ['Add', ''],
    shiftTwo: ['twoBelow shifts', ''], shiftOne: ['oneBelow shifts', ''], done: ['Done', 'ok'],
  };

  // Every path to stair k, built the way the formula counts them: paths to k-1 plus "+1", paths to k-2 plus "+2".
  const PATHS_UP_TO = 6;
  const P = [[], ['1'], ['1+1', '2']];
  for (let k = 3; k <= PATHS_UP_TO; k++) P[k] = [...P[k - 1].map((p) => p + '+1'), ...P[k - 2].map((p) => p + '+2')];

  let n = 5;
  let steps = [];
  let idx = 0;
  let timer = null;

  function parse(raw) {
    const t = raw.trim();
    if (!/^\d+$/.test(t)) return null;
    const v = Number(t);
    return v >= 1 && v <= MAX_N ? v : null;
  }

  function stairsHtml(st) {
    const inLoop = st.kind === 'sum' || st.kind === 'shiftTwo' || st.kind === 'shiftOne';
    let html = '';
    for (let k = 1; k <= n; k++) {
      let state = k === st.cur ? 'cur' : (k === st.twoAt || k === st.oneAt) ? 'ref' : k <= st.known ? 'done' : 'todo';
      if (st.kind === 'done' && k === n) state = 'answer';
      const t = [];
      if (inLoop && k === st.step) t.push('<span class="t-step">step</span>');
      if (k === st.oneAt) t.push('<span class="t-var">oneBelow</span>');
      if (k === st.twoAt) t.push('<span class="t-var">twoBelow</span>');
      if (st.kind === 'sum' && k === st.step - 1) t.push('<span class="t-move">+1 step</span>');
      if (st.kind === 'sum' && k === st.step - 2) t.push('<span class="t-move">+2 steps</span>');
      if (st.kind === 'done' && k === n) t.push('<span class="t-answer">answer</span>');
      const value = k <= st.known ? st.w[k] : '?';
      html += `<div class="stair"><div class="tags">${t.join('')}</div>` +
        `<div class="block" data-state="${state}" style="height:${34 + k * 14}px">${value}</div>` +
        `<div class="num">${k}${k === n ? '<small>top</small>' : ''}</div></div>`;
    }
    return html;
  }

  function chips(list, last) {
    return `<div class="chips">${list.map((p) => `<span class="path">${p}${last ? `<b>${last}</b>` : ''}</span>`).join('')}</div>`;
  }

  function pathsHtml(st) {
    const sh = st.show;
    const w = st.w;
    if (!sh) return '<p class="paths-empty">No steps computed yet.</p>';
    if (!sh.split) {
      let html = '';
      for (let k = 1; k <= sh.at; k++) {
        html += `<div class="group"><span class="lbl">Ways to reach step ${k} (${w[k]})</span>${chips(P[k])}</div>`;
      }
      return html;
    }
    const s = sh.at;
    const head = `<p class="paths-head">Ways to reach step ${s}: ${w[s - 1]} + ${w[s - 2]} = <b>${w[s]}</b></p>`;
    if (s > PATHS_UP_TO) {
      return head + `<p class="paths-empty">That many paths don't fit on the screen, but the math is the same: append <b>+1</b> to each of the ${w[s - 1]} paths to step ${s - 1}, and <b>+2</b> to each of the ${w[s - 2]} paths to step ${s - 2}.</p>`;
    }
    return head +
      `<div class="group"><span class="lbl">From step ${s - 1} with 1 step (${w[s - 1]} ways)</span>${chips(P[s - 1], '+1')}</div>` +
      `<div class="group"><span class="lbl">From step ${s - 2} with 2 steps (${w[s - 2]} ways)</span>${chips(P[s - 2], '+2')}</div>`;
  }

  function render() {
    const st = steps[idx];
    $('stairs').innerHTML = stairsHtml(st);

    const vars = [
      ['n', n], ['step', st.step], ['ways', st.ways],
      ['twoBelow', st.twoAt === undefined ? undefined : st.w[st.twoAt]],
      ['oneBelow', st.oneAt === undefined ? undefined : st.w[st.oneAt]],
    ];
    $('vars').innerHTML = vars.map(([name, v]) =>
      `<div class="var${st.changed.includes(name) ? ' changed' : ''}"><dt>${name}</dt><dd>${v === undefined ? '—' : v}</dd></div>`).join('');

    $('paths').innerHTML = pathsHtml(st);

    Object.keys(codeLines).forEach((id) => codeLines[id].classList.toggle('hl', st.lines.includes(id)));

    const [tagText, tagKind] = TAGS[st.kind];
    $('step-count').textContent = `Step ${idx + 1} / ${steps.length}`;
    $('step-tag').textContent = tagText;
    $('step-tag').dataset.kind = tagKind;
    $('step-text').innerHTML = st.text;
    $('prev-btn').disabled = idx === 0;
    $('reset').disabled = idx === 0;
    $('next-btn').disabled = idx === steps.length - 1;

    document.querySelectorAll('.presets button').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.n) === n)));
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Play';
  }

  function restart(value) {
    stop();
    n = value;
    steps = buildSteps(n);
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
    $('n').value = b.dataset.n;
    $('n-err').hidden = true;
    restart(Number(b.dataset.n));
  }));
  $('n').addEventListener('input', (e) => {
    const parsed = parse(e.target.value);
    if (parsed === null) { $('n-err').hidden = false; return; }
    $('n-err').hidden = true;
    restart(parsed);
  });
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(n);
})();
