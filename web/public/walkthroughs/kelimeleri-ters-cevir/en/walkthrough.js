(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_LEN = 30;

  // The pieces s.Split(' ') makes before empty ones are removed:
  // every space ends a piece, and whatever follows the last space is the final piece.
  function pieces(s) {
    const out = [];
    let start = 0;
    for (let k = 0; k <= s.length; k++) {
      if (k === s.length || s[k] === ' ') {
        out.push({ start, end: k, sep: k < s.length ? k : -1, text: s.slice(start, k) });
        start = k + 1;
      }
    }
    return out;
  }

  // Steps: Split piece by piece, then Array.Reverse swap by swap, then string.Join word by word.
  // sState: how to draw s (null = plain); marks: word index -> state; ij: the counters inside Array.Reverse.
  function buildSteps(s) {
    const n = s.length;
    const steps = [];
    let words = [];
    let wordsLen;
    let result = null;
    let i;
    let j;
    const snap = (o) => steps.push({
      words: words.slice(), wordsLen, result, i, j, sState: null, marks: {}, ij: null,
      fresh: 0, done: false, changed: [], lines: [], ...o,
    });
    const q = (w) => `<code>"${w}"</code>`;

    snap({
      kind: 'start',
      text: `<code>s</code> has ${n} characters; we show spaces as <b>·</b>. We will reverse the order of the words while the letters inside each word stay the same. The extra spaces will go too.`,
    });

    // 1. Split
    let skipped = 0;
    for (const p of pieces(s)) {
      const sState = { doneTo: p.start, piece: p.text ? [p.start, p.end] : null, cut: p.sep, skip: !p.text };
      let text;
      const marks = {};
      if (p.text) {
        words.push(p.text);
        marks[words.length - 1] = 'new';
        text = (p.sep >= 0
          ? `<code>Split</code> reads from the left and cuts at the next space (index ${p.sep}). Piece: ${q(p.text)}.`
          : `No more spaces; the piece up to the end of the string: ${q(p.text)}.`) +
          ' It is not empty, so it is added to the <code>words</code> array.';
      } else {
        skipped++;
        if (p.sep === 0) {
          text = 'The string starts with a space: there are no characters before the first space (index 0), so the piece is <code>""</code>, that is, empty. <code>RemoveEmptyEntries</code> drops empty pieces.';
        } else if (p.sep > 0) {
          text = `This space (index ${p.sep}) comes right after the previous one: the piece between them is <code>""</code>, that is, empty. It is skipped thanks to <code>RemoveEmptyEntries</code>.`;
        } else {
          text = 'The string ends with a space: there are no characters after the last space, so the last piece is <code>""</code>. It is skipped too.';
        }
      }
      snap({ kind: 'split', lines: ['split'], sState, marks, text });
    }

    const m = words.length;
    wordsLen = m;
    snap({
      kind: 'splitDone', lines: ['split'], changed: ['len'], sState: { doneTo: n },
      text: `<code>Split</code> is done: the <code>words</code> array has ${m} words. ` +
        (skipped ? `${skipped} empty pieces were dropped; none made it into the array.` : 'There were no empty pieces.'),
    });

    // 2. Array.Reverse
    i = 0;
    j = m - 1;
    if (m > 1) {
      snap({
        kind: 'revStart', lines: ['rev'], changed: ['i', 'j'], ij: true, sState: { doneTo: n },
        text: `<code>Array.Reverse(words)</code> starts from both ends: <code>i = 0</code> points to the first word and <code>j = ${j}</code> to the last. They will swap until they meet in the middle.`,
      });
    }
    while (i < j) {
      const [a, b] = [words[i], words[j]];
      [words[i], words[j]] = [words[j], words[i]];
      snap({
        kind: 'swap', lines: ['rev'], ij: true, sState: { doneTo: n }, marks: { [i]: 'swap', [j]: 'swap' },
        text: `<code>words[${i}]</code> (${q(a)}) and <code>words[${j}]</code> (${q(b)}) swapped places. Then <code>i</code> moves one to the right and <code>j</code> one to the left.`,
      });
      i++;
      j--;
    }
    let revText;
    const revMarks = {};
    if (m === 1) {
      revText = '<code>Array.Reverse(words)</code>: there is a single word, so <code>i</code> and <code>j</code> are both 0. There is nothing to swap.';
      revMarks[0] = 'mid';
    } else if (i === j) {
      revText = `<code>i</code> and <code>j</code> met in the middle (${i}). The middle word ${q(words[i])} is already in place; the array is reversed.`;
      revMarks[i] = 'mid';
    } else {
      revText = `<code>i = ${i}</code>, <code>j = ${j}</code>: <code>i</code> has passed <code>j</code>. Every word swapped with its counterpart; the array is reversed.`;
    }
    snap({ kind: 'revDone', lines: ['rev'], changed: ['i', 'j'], ij: true, sState: { doneTo: n }, marks: revMarks, text: revText });
    i = undefined;
    j = undefined;

    // 3. string.Join
    result = '';
    for (let k = 0; k < m; k++) {
      const before = result.length;
      if (k > 0) result += ' ';
      result += words[k];
      const marks = {};
      for (let u = 0; u < k; u++) marks[u] = 'used';
      marks[k] = 'cur';
      let text;
      if (k === 0) {
        text = `<code>string.Join(" ", words)</code> writes the first word: ${q(words[0])}. It puts no space before it.` +
          (m === 1 ? ' Since there is only one word, that is the whole result; it puts no space at the end either.' : '');
      } else {
        text = `A single space in between, then ${q(words[k])}.` + (k === m - 1 ? ' That was the last word; no space goes at the end.' : '');
      }
      snap({ kind: 'join', lines: ['join'], sState: { doneTo: n }, marks, fresh: result.length - before, text });
    }

    const inSpaces = s.split('').filter((c) => c === ' ').length;
    snap({
      kind: 'end', lines: ['join'], done: true, sState: { doneTo: n },
      marks: Object.fromEntries(words.map((_, k) => [k, 'used'])),
      text: `<code>return</code> ${q(result)}. ` + (inSpaces === m - 1
        ? 'The input had no extra spaces.'
        : `Of the ${inSpaces} spaces in the input, ${m === 1 ? 'none are left.' : `only ${m - 1} remain: one between each pair of words.`}`),
    });
    return steps;
  }

  // Rendering
  const CODE = [
    ['split', '<span class="kw">string</span>[] words = s.Split(<span class="st">\' \'</span>,'],
    ['split', '    StringSplitOptions.RemoveEmptyEntries);'],
    ['', ''],
    ['rev', 'Array.Reverse(words);'],
    ['', ''],
    ['join', '<span class="kw">return string</span>.Join(<span class="st">" "</span>, words);'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = [...document.querySelectorAll('.ln[data-id]')];

  const TAGS = {
    start: ['Start', ''], split: ['Split', ''], splitDone: ['Split done', ''],
    revStart: ['Array.Reverse', ''], swap: ['Swap', ''], revDone: ['Reversed', ''],
    join: ['string.Join', ''], end: ['Done', 'ok'],
  };

  let listText = 'a good   example';
  let text = '';
  let steps = [];
  let idx = 0;
  let timer = null;

  function parse(raw) {
    if (raw.length === 0 || raw.length > MAX_LEN) return null;
    if (!/^[A-Za-z0-9 ]+$/.test(raw) || raw.trim() === '') return null;
    return raw;
  }

  const charBox = (c, st) => `<span class="ch${c === ' ' ? ' sp' : ''}"${st ? ` data-st="${st}"` : ''}>${c === ' ' ? '·' : c}</span>`;

  function render() {
    const st = steps[idx];

    // s
    let html = '';
    for (let k = 0; k < text.length; k++) {
      let state = '';
      const ss = st.sState;
      if (ss) {
        if (ss.piece && k >= ss.piece[0] && k < ss.piece[1]) state = 'piece';
        else if (k === ss.cut) state = ss.skip ? 'skip' : 'cut';
        else if (k < ss.doneTo) state = 'done';
      }
      html += charBox(text[k], state);
    }
    $('s-row').innerHTML = html;

    // words
    $('w-row').innerHTML = st.words.length === 0
      ? '<p class="empty">no words yet</p>'
      : `<div class="words">${st.words.map((w, k) => {
        const lbl = st.ij ? [k === st.i ? 'i' : '', k === st.j ? 'j' : ''].filter(Boolean).join(' ') : '';
        return `<div class="wcol"><span class="wlbl">${lbl}</span><span class="chip"${st.marks[k] ? ` data-st="${st.marks[k]}"` : ''}>${w}</span><span class="widx">[${k}]</span></div>`;
      }).join('')}</div>`;

    // result
    if (st.result === null) {
      $('r-row').innerHTML = '<p class="empty">Join hasn\'t started yet</p>';
    } else {
      const r = st.result;
      $('r-row').innerHTML = `<div class="chars">${[...r].map((c, k) => charBox(c, k >= r.length - st.fresh ? 'new' : '')).join('')}</div>`;
    }

    const show = (v) => (v === undefined ? '—' : String(v));
    const vars = [['words.Length', st.wordsLen, 'len'], ['i', st.ij ? st.i : undefined, 'i'], ['j', st.ij ? st.j : undefined, 'j']];
    $('vars').innerHTML = vars.map(([name, v, key]) =>
      `<div class="var${st.changed.includes(key) ? ' changed' : ''}"><dt>${name}</dt><dd>${show(v)}</dd></div>`).join('');

    $('result').textContent = st.done ? `"${st.result}"` : '—';
    $('out').dataset.kind = st.done ? 'done' : '';

    codeLines.forEach((el) => el.classList.toggle('hl', st.lines.includes(el.dataset.id)));

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

  function restart(raw) {
    stop();
    listText = raw;
    text = raw;
    steps = buildSteps(raw);
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
    restart(b.dataset.l);
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

  restart(listText);
})();
