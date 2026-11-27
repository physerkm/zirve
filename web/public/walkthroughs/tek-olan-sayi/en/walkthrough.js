(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_LEN = 9;

  function toBits(n) {
    const u = n & 0xff;
    return u.toString(2).padStart(8, '0');
  }

  function buildSteps(vals) {
    const steps = [];
    let result = 0;

    steps.push({
      kind: 'start',
      idx: -1,
      prevResult: 0,
      num: undefined,
      result: 0,
      lines: ['init'],
      changed: ['result'],
      text: `Initially <code>result = 0</code> (all bits <code>00000000</code>).`,
    });

    for (let i = 0; i < vals.length; i++) {
      const num = vals[i];
      const prev = result;
      result = prev ^ num;
      steps.push({
        kind: 'xor',
        idx: i,
        prevResult: prev,
        num,
        result,
        lines: ['loop', 'xor'],
        changed: ['num', 'result'],
        text: `Read <code>num = ${num}</code>. <code>result = ${prev} ^ ${num}</code> gives the new <code>result = ${result}</code>.`,
      });
    }

    steps.push({
      kind: 'done',
      idx: vals.length,
      prevResult: result,
      num: undefined,
      result,
      lines: ['ret'],
      changed: [],
      text: `The array is done. All the numbers that appeared twice cancelled each other out; the one left is: <code>return ${result}</code>.`,
    });

    return steps;
  }

  const CODE = [
    ['sig', '<span class="kw">public int</span> SingleNumber(<span class="kw">int</span>[] nums)'],
    ['', '{'],
    ['init', '    <span class="kw">int</span> result = 0;'],
    ['', ''],
    ['loop', '    <span class="kw">foreach</span> (<span class="kw">int</span> num <span class="kw">in</span> nums)'],
    ['', '    {'],
    ['xor', '        result ^= num;'],
    ['', '    }'],
    ['', ''],
    ['ret', '    <span class="kw">return</span> result;'],
    ['', '}'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Start', ''],
    xor: ['XOR Step', ''],
    done: ['Result', 'ok'],
  };

  let listText = '4, 1, 2, 1, 2';
  let vals = [];
  let steps = [];
  let idx = 0;
  let timer = null;

  function parse(raw) {
    const parts = raw.split(/[\s,]+/).filter(Boolean);
    if (parts.length === 0 || parts.length > MAX_LEN) return null;
    const out = parts.map(Number);
    return out.every((v) => Number.isInteger(v) && v >= -63 && v <= 63) ? out : null;
  }

  function renderBitsRow(label, val, highlightDiffFrom) {
    const bStr = toBits(val);
    const refStr = highlightDiffFrom !== undefined ? toBits(highlightDiffFrom) : null;
    const cells = bStr.split('').map((ch, i) => {
      let cls = 'bit';
      if (refStr && refStr[i] !== ch) cls += ' flip';
      else if (ch === '1') cls += ' one';
      return `<span class="${cls}">${ch}</span>`;
    }).join('');
    return `<div class="xor-row"><span>${label}</span><div class="bits">${cells}</div><span>(${val})</span></div>`;
  }

  function render() {
    const st = steps[idx];

    $('nline').innerHTML = vals.map((v, i) => {
      let state = 'plain';
      if (st.kind === 'done' && v === st.result && vals.filter((x) => x === v).length === 1) state = 'best';
      else if (i === st.idx) state = 'cur';
      else if (i < st.idx) state = 'done';
      const tag = i === st.idx ? '<span class="t-num">num</span>' : '';
      return `<div class="item"><div class="tags">${tag}</div><div class="chip" data-state="${state}">${v}</div></div>`;
    }).join('');

    if (st.kind === 'xor') {
      $('xor-box').innerHTML =
        renderBitsRow('old result', st.prevResult) +
        renderBitsRow('^ num', st.num) +
        renderBitsRow('new result', st.result, st.prevResult).replace('xor-row', 'xor-row divider');
    } else {
      $('xor-box').innerHTML = renderBitsRow('result', st.result);
    }

    const vars = [
      ['num', st.num],
      ['result', st.result],
      ['ikili', toBits(st.result)],
    ];
    $('vars').innerHTML = vars.map(([name, v]) =>
      `<div class="var${st.changed.includes(name) ? ' changed' : ''}"><dt>${name}</dt><dd>${v === undefined ? '—' : v}</dd></div>`
    ).join('');

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
