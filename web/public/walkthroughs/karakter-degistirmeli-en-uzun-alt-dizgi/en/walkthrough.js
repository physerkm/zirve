(() => {
  const $ = (id) => document.getElementById(id);

  function buildSteps(s, k) {
    const steps = [];
    const count = {};
    for (const ch of s) count[ch] = 0;

    let left = 0;
    let right = undefined;
    let maxFreq = 0;
    let best = 0;
    let bestRange = [-1, -1];
    let droppedIdx = -1;

    const snap = (extra) => {
      const len = right !== undefined ? right - left + 1 : 0;
      const rep = right !== undefined ? len - maxFreq : 0;
      steps.push({
        count: { ...count },
        left,
        right,
        maxFreq,
        best,
        rep,
        bestRange: bestRange.slice(),
        droppedIdx,
        changed: [],
        ...extra,
      });
    };

    snap({
      kind: 'start',
      lines: ['init'],
      changed: ['left', 'maxFreq', 'best'],
      text: `At the start, all letter counts are zero. <code>left = 0</code>, <code>maxFreq = 0</code>, <code>best = 0</code>, and <code>k = ${k}</code>.`,
    });

    for (let r = 0; r < s.length; r++) {
      right = r;
      droppedIdx = -1;
      const ch = s[r];
      count[ch]++;
      const prevMax = maxFreq;
      maxFreq = Math.max(maxFreq, count[ch]);
      const len1 = right - left + 1;
      const rep1 = len1 - maxFreq;

      snap({
        kind: 'expand',
        lines: ['for', 'count', 'maxf'],
        changed: maxFreq > prevMax ? ['right', 'maxFreq'] : ['right'],
        text: `<code>right = ${r}</code> (<code>'${ch}'</code>). <code>count['${ch}'] = ${count[ch]}</code>, <code>maxFreq = ${maxFreq}</code>. Window <code>"${s.slice(left, right + 1)}"</code> (length ${len1}), replacements needed: <code>${len1} - ${maxFreq} = ${rep1}</code>.`,
      });

      if (rep1 > k) {
        const dropCh = s[left];
        droppedIdx = left;
        count[dropCh]--;
        left++;
        const len2 = right - left + 1;
        const prevBest = best;
        best = Math.max(best, len2);
        const newBest = best > prevBest;
        if (newBest) bestRange = [left, right];

        snap({
          kind: 'shrink',
          lines: ['if', 'shrink', 'best'],
          changed: newBest ? ['left', 'best'] : ['left'],
          text: `Replacements needed (<code>${rep1}</code>) &gt; <code>k = ${k}</code>! The leftmost <code>s[${droppedIdx}] = '${dropCh}'</code> is removed, <code>left = ${left}</code>. New window <code>"${s.slice(left, right + 1)}"</code>, <code>best = ${best}</code>.`,
        });
      } else {
        const prevBest = best;
        best = Math.max(best, len1);
        const newBest = best > prevBest;
        if (newBest) bestRange = [left, right];

        snap({
          kind: 'valid',
          lines: ['if', 'best'],
          changed: newBest ? ['best'] : [],
          text: `Replacements needed (<code>${rep1}</code>) ≤ <code>k = ${k}</code>; the window is valid. <code>best = Math.Max(${prevBest}, ${len1})</code> → <b>${best}</b>.`,
        });
      }
    }

    right = undefined;
    droppedIdx = -1;
    snap({
      kind: 'done',
      lines: ['ret'],
      text: `The string is done. Longest valid substring: <code>"${s.slice(bestRange[0], bestRange[1] + 1)}"</code>, <code>return best</code> → <b>${best}</b>.`,
    });

    return steps;
  }

  const CODE = [
    ['init', '<span class="kw">int</span>[] count = <span class="kw">new int</span>[26]; <span class="kw">int</span> left = 0, maxFreq = 0, best = 0;'],
    ['for', '<span class="kw">for</span> (<span class="kw">int</span> right = 0; right &lt; s.Length; right++)'],
    ['', '{'],
    ['count', '    count[s[right] - \'A\']++;'],
    ['maxf', '    maxFreq = Math.Max(maxFreq, count[s[right] - \'A\']);'],
    ['if', '    <span class="kw">if</span> ((right - left + 1) - maxFreq &gt; k)'],
    ['shrink', '        count[s[left++] - \'A\']--;'],
    ['best', '    best = Math.Max(best, right - left + 1);'],
    ['', '}'],
    ['ret', '<span class="kw">return</span> best;'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Start', ''],
    expand: ['Expand', ''],
    valid: ['Valid Window', ''],
    shrink: ['Shrink (left++)', 'skip'],
    done: ['Done', 'ok'],
  };

  let curS = 'AABABBA';
  let curK = 1;
  let steps = [];
  let idx = 0;
  let timer = null;

  function parseInputs(rawS, rawK) {
    const s = rawS.trim().toUpperCase();
    const k = Number(rawK.trim());
    if (!/^[A-Z]{1,12}$/.test(s)) return null;
    if (!Number.isInteger(k) || k < 0 || k > 12) return null;
    return { s, k };
  }

  function render() {
    const st = steps[idx];
    const letters = Object.keys(st.count).sort();
    $('freq-row').innerHTML = letters.map((ch) => {
      const v = st.count[ch];
      const isMax = v > 0 && v === st.maxFreq;
      return `<span class="mini${isMax ? ' now' : ''}"><span>${ch}:</span><span>${v}</span></span>`;
    }).join('');

    let html = '';
    for (let i = 0; i < curS.length; i++) {
      const tags = [];
      if (st.right !== undefined && i === st.left) tags.push('<span class="t-left">left</span>');
      if (st.right !== undefined && i === st.right) tags.push('<span class="t-right">right</span>');
      let cls = 'chip';
      let state = 'plain';
      if (st.kind === 'done') {
        if (i >= st.bestRange[0] && i <= st.bestRange[1]) state = 'best';
      } else if (st.right !== undefined && i >= st.left && i <= st.right) {
        state = 'run';
      }
      if (i === st.right) cls += ' cur';
      if (i === st.droppedIdx) cls += ' shrink';
      html += `<div class="item"><div class="tags">${tags.join('')}</div><div class="${cls}" data-state="${state}">${curS[i]}</div><span class="idx-lbl">${i}</span></div>`;
    }
    $('nline').innerHTML = html;

    const vars = [
      ['left', st.left],
      ['right', st.right],
      ['maxFreq', st.maxFreq],
      ['replace', st.right === undefined ? '—' : st.rep],
      ['k', curK],
      ['best', st.best],
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
      b.setAttribute('aria-pressed', String(b.dataset.s === curS && Number(b.dataset.k) === curK));
    });
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Play';
  }

  function restart(s, k) {
    stop();
    curS = s;
    curK = k;
    steps = buildSteps(s, k);
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
    $('s-in').value = b.dataset.s;
    $('k-in').value = b.dataset.k;
    $('err').hidden = true;
    restart(b.dataset.s, Number(b.dataset.k));
  }));

  function onInput() {
    const parsed = parseInputs($('s-in').value, $('k-in').value);
    if (!parsed) { $('err').hidden = false; return; }
    $('err').hidden = true;
    restart(parsed.s, parsed.k);
  }
  $('s-in').addEventListener('input', onInput);
  $('k-in').addEventListener('input', onInput);

  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(curS, curK);
})();
