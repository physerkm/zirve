(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_LEN = 10;
  const MAX_VAL = 99;

  // Steps: mirrors Solution.cs line by line.
  // cur: the box i points at; span: the boxes box i can jump to (to may pass the end); stuck: the box we cannot reach.
  function buildSteps(vals) {
    const len = vals.length;
    const steps = [];
    let lastIndex;
    let farthest;
    let i;
    let reach;
    let result;
    const snap = (s) => steps.push({
      lastIndex, farthest, i, reach, result, cur: -1, span: null, stuck: -1, changed: [], ...s,
    });

    snap({
      kind: 'start', lines: [],
      text: `Dizide ${len} kutu var ve index 0'da duruyoruz. Her kutudaki sayı, oradan <b>en fazla</b> kaç adım ileri zıplayabileceğimizi söylüyor. Son kutuya (index ${len - 1}) ulaşabilir miyiz?`,
    });

    lastIndex = len - 1;
    farthest = 0;
    snap({
      kind: 'init', lines: ['last', 'far'], changed: ['lastIndex', 'farthest'],
      text: `<code>lastIndex = ${lastIndex}</code>, son kutunun index'i. <code>farthest = 0</code>: şimdilik ulaşabildiğimiz tek kutu, üzerinde durduğumuz index 0.`,
    });

    for (i = 0; i < len; i++) {
      reach = undefined; // reach is declared inside the loop, after the check
      if (i > farthest) {
        result = false;
        snap({
          kind: 'stuck', lines: ['for', 'check', 'retF'], changed: ['i', 'result'], cur: i, stuck: i,
          text: `<code>i = ${i}</code>: ${i} &gt; ${farthest}? <b>Evet.</b> Ulaşabildiğimiz en uzak kutu ${farthest}, bu kutu ise sınırın dışında. Hangi yolu seçersek seçelim en fazla ${farthest} numaralı kutuya kadar gelebiliyoruz; ` +
            (i === lastIndex ? 'son kutuya ulaşamayız.' : 'bu kutuya, dolayısıyla son kutuya da ulaşamayız.') +
            ' <code>return false</code>.',
        });
        return steps;
      }

      snap({
        kind: 'check', lines: ['for', 'check'], changed: ['i'], cur: i,
        text: `<code>i = ${i}</code>: ${i} &gt; ${farthest}? Hayır. ` +
          (i === 0 ? 'Zaten bu kutudayız.' : 'Bu kutu ulaşabildiğimiz bölgenin içinde, buradan zıplayabiliriz.'),
      });

      const v = vals[i];
      const before = farthest;
      reach = i + v;
      farthest = Math.max(farthest, reach);
      const done = farthest >= lastIndex;
      let text = v === 0
        ? `Bu kutuda 0 yazıyor: buradan hiçbir yere zıplayamayız, <code>reach = ${i} + 0 = ${reach}</code>.`
        : `Bu kutuda ${v} yazıyor: buradan en uzak <code>reach = ${i} + ${v} = ${reach}</code> numaralı kutuya zıplayabiliriz.` +
          (reach > lastIndex ? ' Bu, dizinin sonunu bile geçiyor.' : '');
      text += farthest > before
        ? ` Eski sınırdan (${before}) daha uzak: <code>farthest = ${farthest}</code>.`
        : ` Sınır (${before}) değişmedi: <code>farthest = ${farthest}</code>.`;
      if (!done) text += ` ${farthest} &gt;= ${lastIndex}? Hayır, son kutu henüz ulaşabildiğimiz bölgede değil.`;
      snap({
        kind: 'reach', lines: done ? ['reach', 'max'] : ['reach', 'max', 'ifT'],
        changed: farthest > before ? ['reach', 'farthest'] : ['reach'], cur: i, span: { from: i, to: reach }, text,
      });

      if (done) {
        result = true;
        snap({
          kind: 'done', lines: ['ifT', 'retT'], changed: ['result'], cur: i, span: { from: i, to: reach },
          text: `${farthest} &gt;= ${lastIndex}? <b>Evet.</b> ` +
            (lastIndex === 0
              ? 'Tek kutu var ve zaten üzerindeyiz.'
              : 'Son kutu artık ulaşabildiğimiz bölgenin içinde.') +
            ' <code>return true</code>.' +
            (i < lastIndex ? ` Kalan ${lastIndex - i} kutuya bakmaya gerek yok.` : ''),
        });
        return steps;
      }
    }
    return steps; // not reached: the input needs at least one number, so the loop always returns
  }

  // Rendering
  const CODE = [
    ['last', '<span class="kw">int</span> lastIndex = nums.Length - 1;'],
    ['far', '<span class="kw">int</span> farthest = 0;'],
    ['', ''],
    ['for', '<span class="kw">for</span> (<span class="kw">int</span> i = 0; i &lt; nums.Length; i++)'],
    ['', '{'],
    ['check', '    <span class="kw">if</span> (i &gt; farthest)'],
    ['retF', '        <span class="kw">return</span> <span class="kw">false</span>;'],
    ['', ''],
    ['reach', '    <span class="kw">int</span> reach = i + nums[i];'],
    ['max', '    farthest = Math.Max(farthest, reach);'],
    ['', ''],
    ['ifT', '    <span class="kw">if</span> (farthest &gt;= lastIndex)'],
    ['retT', '        <span class="kw">return</span> <span class="kw">true</span>;'],
    ['', '}'],
    ['', ''],
    ['', '<span class="kw">return</span> <span class="kw">false</span>; <span class="cm">// sadece boş dizide gelinir</span>'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Başlangıç', ''], init: ['Hazırlık', ''], check: ['Ulaşabilir miyiz?', ''],
    reach: ['Sınırı genişlet', ''], done: ['Sona ulaşıldı', 'ok'], stuck: ['Takıldık', 'bad'],
  };

  let listText = '2, 3, 1, 1, 4';
  let vals = [];
  let steps = [];
  let idx = 0;
  let timer = null;

  function parse(raw) {
    const parts = raw.split(/[\s,]+/).filter(Boolean);
    if (parts.length === 0 || parts.length > MAX_LEN) return null;
    const out = parts.map(Number);
    return out.every((v) => Number.isInteger(v) && v >= 0 && v <= MAX_VAL) ? out : null;
  }

  function render() {
    const st = steps[idx];
    const len = vals.length;
    const last = len - 1;
    const spare = len + 1; // grid column for anything past the last box
    const col = (k) => `grid-column:${k + 1}`;

    let html = '';
    for (let k = 0; k < len; k++) {
      let state = 'plain';
      if (k === st.stuck) state = 'stuck';
      else if (st.result === true && k === last) state = 'goal';
      else if (st.farthest !== undefined && k <= st.farthest) state = 'reach';
      const labels = [];
      if (k === st.cur) labels.push('<span class="t-i">i</span>');
      if (st.farthest === k) labels.push('<span class="t-far">farthest</span>');
      html += `<div class="lbl" style="${col(k)}">${labels.join('')}</div>`;
      html += `<div class="box${k === st.cur ? ' cur' : ''}" data-state="${state}" style="${col(k)}">${vals[k]}</div>`;
      html += `<div class="idx" style="${col(k)}">[${k}]${k === last ? '<b>son</b>' : ''}</div>`;
    }
    // The spare column: a farthest label when the boundary is past the end.
    const farPast = st.farthest !== undefined && st.farthest > last;
    html += `<div class="lbl" style="grid-column:${spare}">${farPast ? `<span class="t-far">farthest = ${st.farthest}</span>` : ''}</div>`;

    if (st.span) {
      const { from, to } = st.span;
      if (to === from) {
        html += `<div class="bar-row" style="grid-column:${from + 1}"><span class="bar zero"></span></div>`;
      } else {
        const end = Math.min(to, last);
        html += `<div class="bar-row" style="grid-column:${from + 1} / ${end + 2}"><span class="bar"></span></div>`;
        if (to > last) html += `<div class="past" style="grid-column:${spare}">→ ${to}</div>`;
      }
    } else {
      html += `<div class="bar-row" style="grid-column:1"></div>`;
    }
    $('track').style.gridTemplateColumns = `repeat(${len}, 52px) minmax(64px, max-content)`;
    $('track').innerHTML = html;

    const show = (v) => (v === undefined ? '—' : String(v));
    const vars = [
      ['i', st.i, ['i']],
      ['nums[i]', st.cur >= 0 ? vals[st.cur] : undefined, ['i']],
      ['reach', st.reach, ['reach']],
      ['farthest', st.farthest, ['farthest']],
      ['lastIndex', st.lastIndex, ['lastIndex']],
    ];
    $('vars').innerHTML = vars.map(([name, v, keys]) =>
      `<div class="var${keys.some((k) => st.changed.includes(k)) ? ' changed' : ''}"><dt>${name}</dt><dd>${show(v)}</dd></div>`).join('');

    $('result').textContent = show(st.result);
    $('out').dataset.kind = st.result === undefined ? '' : String(st.result);

    Object.keys(codeLines).forEach((id) => codeLines[id].classList.toggle('hl', st.lines.includes(id)));

    const [tagText, tagKind] = TAGS[st.kind];
    $('step-count').textContent = `Adım ${idx + 1} / ${steps.length}`;
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
    $('play').textContent = '▶ Oynat';
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
    $('play').textContent = '❚❚ Durdur';
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
