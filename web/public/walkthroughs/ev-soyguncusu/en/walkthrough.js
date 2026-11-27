(() => {
  const $ = (id) => document.getElementById(id);

  function buildSteps(nums) {
    const steps = [];
    const dp = new Array(nums.length).fill('—');
    let rob1 = 0;
    let rob2 = 0;
    let num;
    let temp;
    let curIdx = -1;

    const snap = (s) => steps.push({
      nums,
      dp: dp.slice(),
      rob1,
      rob2,
      num,
      temp,
      curIdx,
      changed: [],
      ...s,
    });

    snap({
      kind: 'start',
      lines: ['r1', 'r2'],
      changed: ['rob1', 'rob2'],
      text: `At the start, no house has been robbed yet: <code>rob1 = 0</code>, <code>rob2 = 0</code>.`,
    });

    for (let k = 0; k < nums.length; k++) {
      curIdx = k;
      num = nums[k];
      const take = rob1 + num;
      const skip = rob2;
      temp = Math.max(take, skip);
      dp[k] = temp;

      snap({
        kind: 'calc',
        lines: ['foreach', 'temp'],
        changed: ['num', 'temp'],
        text: `<code>num = ${num}</code> (house ${k}): If we rob this house, <code>rob1 + num = ${rob1} + ${num} = ${take}</code>; if we skip it, <code>rob2 = ${skip}</code>. <code>temp = Math.Max(${take}, ${skip}) = ${temp}</code>.`,
      });

      rob1 = rob2;
      rob2 = temp;
      snap({
        kind: 'shift',
        lines: ['s1', 's2'],
        changed: ['rob1', 'rob2'],
        text: `Sliding the window: <code>rob1 = ${rob1}</code>, <code>rob2 = ${rob2}</code>.`,
      });
    }

    curIdx = -1;
    num = undefined;
    temp = undefined;
    snap({
      kind: 'done',
      lines: ['ret'],
      changed: [],
      text: `All houses have been considered. Maximum loot: <code>return rob2</code> → <b>${rob2}</b>.`,
    });

    return steps;
  }

  const CODE = [
    ['r1', '<span class="kw">int</span> rob1 = 0;'],
    ['r2', '<span class="kw">int</span> rob2 = 0;'],
    ['', ''],
    ['foreach', '<span class="kw">foreach</span> (<span class="kw">int</span> num <span class="kw">in</span> nums)'],
    ['', '{'],
    ['temp', '    <span class="kw">int</span> temp = Math.Max(rob1 + num, rob2);'],
    ['s1', '    rob1 = rob2;'],
    ['s2', '    rob2 = temp;'],
    ['', '}'],
    ['', ''],
    ['ret', '<span class="kw">return</span> rob2;'],
  ];

  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Start', ''],
    calc: ['Decide', ''],
    shift: ['Slide', ''],
    done: ['Done', 'ok'],
  };

  let listText = '2, 7, 9, 3, 1';
  let steps = [];
  let idx = 0;
  let timer = null;

  function parse(raw) {
    const parts = raw.split(/[\s,]+/).filter(Boolean);
    if (parts.length < 1 || parts.length > 10) return null;
    const out = parts.map(Number);
    return out.every((v) => Number.isInteger(v) && v >= 0 && v <= 999) ? out : null;
  }

  function render() {
    const st = steps[idx];
    const r1Idx = st.curIdx >= 0 ? (st.kind === 'calc' ? st.curIdx - 2 : st.curIdx - 1) : -1;
    const r2Idx = st.curIdx >= 0 ? (st.kind === 'calc' ? st.curIdx - 1 : st.curIdx) : st.nums.length - 1;

    $('nline').innerHTML = st.nums.map((v, k) => {
      const tags = [`<span>house[${k}]=${v}</span>`];
      if (k === st.curIdx) tags.push('<span class="t-num">num</span>');
      if (k === r1Idx) tags.push('<span class="t-probe">rob1</span>');
      if (k === r2Idx) tags.push('<span class="t-probe">rob2</span>');

      let cls = 'chip';
      let state = st.dp[k] !== '—' ? 'run' : 'plain';
      if (st.kind === 'done' && k === st.nums.length - 1) state = 'best';
      if (k === st.curIdx) cls += ' cur';
      else if (k === r1Idx || k === r2Idx) cls += ' probe';

      return `<div class="item"><div class="tags">${tags.join('')}</div><div class="${cls}" data-state="${state}">${st.dp[k]}</div></div>`;
    }).join('');

    const vars = [
      ['num', st.num],
      ['rob1', st.rob1],
      ['rob2', st.rob2],
      ['temp', st.temp],
    ];
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

  function restart(text, parsed) {
    stop();
    listText = text;
    steps = buildSteps(parsed);
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
