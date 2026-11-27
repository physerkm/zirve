(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_LEN = 10;

  // Turkish "to k" suffix depends on how the number is read: 3'e, 2'ye, 6'ya, 10'a (not needed in the English text).
  const DATIVE = ["'a", "'e", "'ye", "'e", "'e", "'e", "'ya", "'ye", "'e", "'a", "'a"];
  const toNum = (k) => `${k}${DATIVE[k]}`;

  // Steps: mirrors Solution.cs line by line.
  // readAt: the array index being read; target: where num sits in the 0..n row; missing: shown only at the end.
  function buildSteps(vals) {
    const len = vals.length;
    const steps = [];
    let n;
    let expectedSum;
    let actualSum;
    let num;
    let result;
    const terms = [];
    const added = [];
    const snap = (s) => steps.push({
      n, expectedSum, actualSum, num, result, terms: terms.slice(), added: added.slice(),
      readAt: -1, target: -1, missing: -1, changed: [], ...s,
    });

    const all = Array.from({ length: len + 1 }, (_, k) => k);
    snap({
      kind: 'start', lines: [],
      text: `The array has ${len} elements. But from 0 to ${len} there are ${len + 1} numbers (${all.join(', ')}), so one of them is missing. The code will not search for the missing number one by one; it will compare two sums.`,
    });

    n = len;
    snap({
      kind: 'n', lines: ['n'], changed: ['n'],
      text: `<code>n = nums.Length</code> → ${n}. The numbers are between 0 and ${n}.`,
    });

    expectedSum = n * (n + 1) / 2;
    snap({
      kind: 'expected', lines: ['exp'], changed: ['expectedSum'],
      text: `If no number were missing, the sum would be <code>${all.join(' + ')}</code>. The formula gives it without a loop: <code>n * (n + 1) / 2</code> = ${n} · ${n + 1} / 2 = ${expectedSum}.`,
    });

    actualSum = 0;
    snap({
      kind: 'init', lines: ['act'], changed: ['actualSum'],
      text: 'Now we add up the numbers in the array. <code>actualSum</code> starts at 0.',
    });

    for (let j = 0; j < len; j++) {
      num = vals[j];
      const before = actualSum;
      actualSum += num;
      terms.push(num);
      added.push(j);
      snap({
        kind: 'add', lines: ['foreach', 'add'], changed: ['num', 'actualSum'], readAt: j, target: num,
        text: `The next element is <code>num = ${num}</code>. <code>actualSum += ${num}</code> → ${before} + ${num} = ${actualSum}.` +
          (num === 0 ? ' Adding 0 does not change the sum.' : ''),
      });
    }

    // num only lives inside the foreach.
    num = undefined;
    result = expectedSum - actualSum;
    let note;
    if (result === 0) {
      note = ' The two sums came out equal because the missing number is 0: since 0 adds nothing to a sum, its absence does not change the sum.';
    } else if (result === n) {
      note = ` The missing number is n itself: even though nothing in the array looks out of place, ${n} is not there.`;
    } else {
      note = '';
    }
    snap({
      kind: 'done', lines: ['ret'], changed: ['result'], missing: result,
      text: `The loop is done. The expected sum is ${expectedSum} and the array's sum is ${actualSum}. <code>return expectedSum - actualSum</code> → ${expectedSum} − ${actualSum} = <b>${result}</b>. Every number except ${result} appears in both sums and cancels out.` + note,
    });
    return steps;
  }

  // Rendering
  const CODE = [
    ['n', '<span class="kw">int</span> n = nums.Length;'],
    ['exp', '<span class="kw">int</span> expectedSum = n * (n + 1) / 2;'],
    ['', ''],
    ['act', '<span class="kw">int</span> actualSum = 0;'],
    ['foreach', '<span class="kw">foreach</span> (<span class="kw">int</span> num <span class="kw">in</span> nums)'],
    ['', '{'],
    ['add', '    actualSum += num;'],
    ['', '}'],
    ['', ''],
    ['ret', '<span class="kw">return</span> expectedSum - actualSum;'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Start', ''], n: ['n', ''], expected: ['Expected sum', ''],
    init: ['Start adding', ''], add: ['Add', ''], done: ['Done', 'ok'],
  };

  let listText = '3, 0, 1';
  let vals = [];
  let steps = [];
  let idx = 0;
  let timer = null;

  function parse(raw) {
    const parts = raw.split(/[\s,]+/).filter(Boolean);
    if (parts.length === 0 || parts.length > MAX_LEN) return null;
    const out = parts.map(Number);
    if (!out.every((v) => Number.isInteger(v) && v >= 0 && v <= out.length)) return null;
    return new Set(out).size === out.length ? out : null;
  }

  const show = (v) => (v === undefined ? '—' : String(v));

  function render() {
    const st = steps[idx];
    const len = vals.length;

    let html = '';
    for (let j = 0; j < len; j++) {
      const state = st.added.includes(j) ? 'added' : 'plain';
      const reading = j === st.readAt;
      html += `<div class="cell"><div class="tags">${reading ? 'num' : ''}</div>` +
        `<div class="box${reading ? ' reading' : ''}" data-state="${state}">${vals[j]}</div>` +
        `<div class="idx">[${j}]</div></div>`;
    }
    $('arr').innerHTML = html;

    html = '';
    for (let v = 0; v <= len; v++) {
      const state = v === st.missing ? 'missing' : st.terms.includes(v) ? 'added' : 'plain';
      const label = v === st.missing ? 'missing' : '';
      html += `<div class="cell"><div class="tags">${label}</div>` +
        `<div class="box${v === st.target ? ' target' : ''}" data-state="${state}">${v}</div></div>`;
    }
    $('chips').innerHTML = html;

    const vars = [['n', st.n], ['expectedSum', st.expectedSum], ['num', st.num], ['actualSum', st.actualSum]];
    $('vars').innerHTML = vars.map(([name, v]) =>
      `<div class="var${st.changed.includes(name) ? ' changed' : ''}"><dt>${name}</dt><dd>${show(v)}</dd></div>`).join('');

    const expTerms = st.expectedSum === undefined ? '—' : Array.from({ length: st.n + 1 }, (_, k) => k).join(' + ');
    const actTerms = st.actualSum === undefined ? '—' : st.terms.length === 0 ? '0' : st.terms.join(' + ');
    const sumRow = (name, terms, v) =>
      `<div class="sum-row${st.changed.includes(name) ? ' changed' : ''}"><span class="k">${name}</span>` +
      `<span class="terms">${terms}</span><span class="v">${v === undefined ? '' : '= ' + v}</span></div>`;
    $('sums').innerHTML = sumRow('expectedSum', expTerms, st.expectedSum) + sumRow('actualSum', actTerms, st.actualSum);

    $('result').textContent = st.result === undefined ? '—' : `${st.expectedSum} − ${st.actualSum} = ${st.result}`;
    $('out').classList.toggle('changed', st.changed.includes('result'));

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
