(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_LEN = 12;

  function buildSteps(s, t) {
    const steps = [];
    const counts = new Array(26).fill(0);
    const activeChars = Array.from(new Set((s + t).split(''))).sort();

    const snap = (st) => steps.push({
      counts: counts.slice(),
      activeChars,
      i: undefined,
      sc: undefined,
      tc: undefined,
      res: undefined,
      changed: [],
      ...st,
    });

    if (s.length !== t.length) {
      snap({
        kind: 'len-mismatch',
        res: 'false',
        lines: ['len'],
        changed: ['result'],
        text: `<code>s.Length (${s.length}) != t.Length (${t.length})</code>. The lengths differ, so they can't be anagrams: <code>return false</code> right away.`,
      });
      return steps;
    }

    snap({
      kind: 'start',
      lines: ['len', 'arr'],
      text: `The lengths are equal (${s.length}). A <code>counts</code> array for the 26 letters is created, filled with zeros.`,
    });

    for (let i = 0; i < s.length; i++) {
      const sc = s[i];
      const tc = t[i];
      counts[sc.charCodeAt(0) - 97]++;
      counts[tc.charCodeAt(0) - 97]--;

      const same = sc === tc;
      snap({
        kind: 'step',
        i,
        sc,
        tc,
        lines: ['for', 'inc', 'dec'],
        changed: ['i', 's[i]', 't[i]'],
        text: same
          ? `<code>i = ${i}</code>: Both strings have <code>'${sc}'</code>. <code>counts['${sc}']</code> went up by 1, then down by 1 (net change 0).`
          : `<code>i = ${i}</code>: the counter for <code>s[${i}] = '${sc}'</code> is incremented by 1 (<b>${counts[sc.charCodeAt(0) - 97]}</b>), the counter for <code>t[${i}] = '${tc}'</code> is decremented by 1 (<b>${counts[tc.charCodeAt(0) - 97]}</b>).`,
      });
    }

    const allZero = counts.every((c) => c === 0);
    const nonZero = activeChars.filter((ch) => counts[ch.charCodeAt(0) - 97] !== 0);
    snap({
      kind: allZero ? 'ok' : 'fail',
      i: s.length,
      res: String(allZero),
      lines: ['ret'],
      changed: ['result'],
      text: allZero
        ? 'The loop is done. Every counter is <b>0</b>! Each letter appears the same number of times in both strings: <code>return true</code>.'
        : `The loop is done. Some counters are not zero (${nonZero.map((c) => `'${c}': ${counts[c.charCodeAt(0) - 97]}`).join(', ')}). <code>return false</code>.`,
    });

    return steps;
  }

  const CODE = [
    ['len', '<span class="kw">if</span> (s.Length != t.Length) <span class="kw">return false</span>;'],
    ['', ''],
    ['arr', '<span class="kw">var</span> counts = <span class="kw">new int</span>[26];'],
    ['', ''],
    ['for', '<span class="kw">for</span> (<span class="kw">var</span> i = 0; i &lt; s.Length; i++)'],
    ['', '{'],
    ['inc', '    counts[s[i] - \'a\']++;'],
    ['dec', '    counts[t[i] - \'a\']--;'],
    ['', '}'],
    ['', ''],
    ['ret', '<span class="kw">return</span> counts.All(count =&gt; count == 0);'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Start', ''],
    step: ['Update counters', ''],
    'len-mismatch': ['Different length → false', 'skip'],
    ok: ['Anagram → true', 'ok'],
    fail: ['Not an anagram → false', 'skip'],
  };

  let sText = 'anagram';
  let tText = 'nagaram';
  let steps = [];
  let idx = 0;
  let timer = null;

  function validWord(w) {
    return w.length >= 1 && w.length <= MAX_LEN && /^[a-z]+$/.test(w);
  }

  function renderStr(str, st, isS) {
    return str.split('').map((ch, k) => {
      const isCur = st.i === k;
      const tag = isCur ? `<span class="${isS ? 't-num' : 't-probe'}">${isS ? '+1' : '-1'}</span>` : '';
      const state = st.i !== undefined && k < st.i ? 'done' : 'plain';
      const cls = `chip${isCur ? (isS ? ' cur' : ' probe') : ''}`;
      return `<div class="item"><div class="tags">${tag}</div><div class="${cls}" data-state="${state}">${ch}</div></div>`;
    }).join('');
  }

  function renderCounts(st) {
    if (st.kind === 'len-mismatch') {
      return '<p class="empty-note">The counts array was not created because the lengths differ.</p>';
    }
    return st.activeChars.map((ch) => {
      const v = st.counts[ch.charCodeAt(0) - 97];
      const state = v === 0 ? 'zero' : v > 0 ? 'pos' : 'neg';
      const active = st.sc === ch || st.tc === ch ? ' active' : '';
      return `<div class="cbox${active}" data-state="${state}"><span class="ch">'${ch}'</span><span class="val">${v > 0 ? `+${v}` : v}</span></div>`;
    }).join('');
  }

  function render() {
    const st = steps[idx];
    $('s-line').innerHTML = renderStr(sText, st, true);
    $('t-line').innerHTML = renderStr(tText, st, false);
    $('counts-row').innerHTML = renderCounts(st);

    const vars = [
      ['i', st.i !== undefined && st.i < sText.length ? st.i : undefined],
      ['s[i]', st.sc ? `'${st.sc}'` : undefined],
      ['t[i]', st.tc ? `'${st.tc}'` : undefined],
      ['result', st.res],
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

    document.querySelectorAll('.presets button').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.s === sText && b.dataset.t === tText));
    });
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Play';
  }

  function restart(s, t) {
    stop();
    sText = s;
    tText = t;
    steps = buildSteps(sText, tText);
    idx = 0;
    render();
  }

  function onInput() {
    const s = $('s-in').value.trim();
    const t = $('t-in').value.trim();
    if (!validWord(s) || !validWord(t)) {
      $('list-err').hidden = false;
      return;
    }
    $('list-err').hidden = true;
    restart(s, t);
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
    $('s-in').value = b.dataset.s;
    $('t-in').value = b.dataset.t;
    $('list-err').hidden = true;
    restart(b.dataset.s, b.dataset.t);
  }));
  $('s-in').addEventListener('input', onInput);
  $('t-in').addEventListener('input', onInput);
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(sText, tText);
})();
