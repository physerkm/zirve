(() => {
  const $ = (id) => document.getElementById(id);

  function toBits(n) {
    return (n & 0xff).toString(2).padStart(8, '0');
  }

  function rightmostOneIndex(bitsStr) {
    return bitsStr.lastIndexOf('1');
  }

  function buildSteps(initialN) {
    const steps = [];
    let n = initialN;
    let count = 0;

    steps.push({
      kind: 'start',
      n,
      prevN: undefined,
      nMinus1: undefined,
      count,
      lines: ['init'],
      changed: ['count'],
      text: `Başlangıçta <code>n = ${n}</code> (<code>${toBits(n)}</code>) ve <code>count = 0</code>.`,
    });

    while (n !== 0) {
      const prevN = n;
      const nMinus1 = n - 1;
      n = prevN & nMinus1;
      count++;
      steps.push({
        kind: 'clear',
        n,
        prevN,
        nMinus1,
        count,
        lines: ['while', 'and', 'inc'],
        changed: ['n', 'count'],
        text: `<code>n - 1 = ${nMinus1}</code> (<code>${toBits(nMinus1)}</code>). <code>${prevN} &amp; ${nMinus1} = ${n}</code> işlemiyle en sağdaki <code>1</code> biti silindi. <code>count = ${count}</code>.`,
      });
    }

    steps.push({
      kind: 'done',
      n: 0,
      prevN: undefined,
      nMinus1: undefined,
      count,
      lines: ['while', 'ret'],
      changed: [],
      text: `<code>n == 0</code> olduğu için döngü sona erdi. Toplam <code>1</code> biti sayısı: <code>return ${count}</code>.`,
    });

    return steps;
  }

  const CODE = [
    ['sig', '<span class="kw">public int</span> HammingWeight(<span class="kw">int</span> n)'],
    ['', '{'],
    ['init', '    <span class="kw">int</span> count = 0;'],
    ['', ''],
    ['while', '    <span class="kw">while</span> (n != 0)'],
    ['', '    {'],
    ['and', '        n &amp;= (n - 1);'],
    ['inc', '        count++;'],
    ['', '    }'],
    ['', ''],
    ['ret', '    <span class="kw">return</span> count;'],
    ['', '}'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Başlangıç', ''],
    clear: ['En sağdaki 1 silindi', ''],
    done: ['Tamamlandı', 'ok'],
  };

  let rawVal = '11';
  let steps = [];
  let idx = 0;
  let timer = null;

  function parse(raw) {
    const trimmed = raw.trim();
    if (!/^\d+$/.test(trimmed)) return null;
    const v = Number(trimmed);
    return Number.isInteger(v) && v >= 0 && v <= 255 ? v : null;
  }

  function renderRow(label, num, mode, targetIdx) {
    const bits = toBits(num);
    const cells = bits.split('').map((ch, i) => {
      let cls = 'bcell';
      if (mode === 'prev' && i === targetIdx) cls += ' target';
      else if (mode === 'res' && i === targetIdx) cls += ' cleared';
      else if (ch === '1') cls += ' one';
      return `<span class="${cls}">${ch}</span>`;
    }).join('');
    return `<div class="bit-row${mode === 'res' ? ' res' : ''}"><span>${label}</span><div class="bit-cells">${cells}</div><span>= ${num}</span></div>`;
  }

  function render() {
    const st = steps[idx];

    if (st.kind === 'clear') {
      const targetIdx = rightmostOneIndex(toBits(st.prevN));
      $('bit-panel').innerHTML =
        renderRow('eski n', st.prevN, 'prev', targetIdx) +
        renderRow('n - 1', st.nMinus1, 'minus', targetIdx) +
        renderRow('n & (n - 1)', st.n, 'res', targetIdx);
    } else {
      const targetIdx = rightmostOneIndex(toBits(st.n));
      $('bit-panel').innerHTML = renderRow('n', st.n, 'prev', targetIdx);
    }

    const vars = [
      ['n', st.n],
      ['n - 1', st.nMinus1 === undefined ? '—' : st.nMinus1],
      ['count', st.count],
    ];
    $('vars').innerHTML = vars.map(([name, v]) =>
      `<div class="var${st.changed.includes(name) ? ' changed' : ''}"><dt>${name}</dt><dd>${v}</dd></div>`
    ).join('');

    Object.keys(codeLines).forEach((id) => codeLines[id].classList.toggle('hl', st.lines.includes(id)));

    const [tagText, tagKind] = TAGS[st.kind];
    $('step-count').textContent = `Adım ${idx + 1} / ${steps.length}`;
    $('step-tag').textContent = tagText;
    $('step-tag').dataset.kind = tagKind;
    $('step-text').innerHTML = st.text;
    $('prev-btn').disabled = idx === 0;
    $('reset').disabled = idx === 0;
    $('next-btn').disabled = idx === steps.length - 1;

    document.querySelectorAll('.presets button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.n === rawVal)));
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Oynat';
  }

  function restart(raw, num) {
    stop();
    rawVal = raw;
    steps = buildSteps(num);
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
    $('num-in').value = b.dataset.n;
    $('num-err').hidden = true;
    restart(b.dataset.n, parse(b.dataset.n));
  }));
  $('num-in').addEventListener('input', (e) => {
    const parsed = parse(e.target.value);
    if (parsed === null) { $('num-err').hidden = false; return; }
    $('num-err').hidden = true;
    restart(e.target.value.trim(), parsed);
  });
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(rawVal, parse(rawVal));
})();
