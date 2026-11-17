(() => {
  const $ = (id) => document.getElementById(id);

  const PRESETS = [
    { raw: [2, 5, 2, 1, 2], target: 5 },
    { raw: [10, 1, 2, 7, 6, 1, 5], target: 8 },
    { raw: [1, 1, 1], target: 2 },
  ];

  function buildSteps(raw, target) {
    const candidates = raw.slice().sort((a, b) => a - b);
    const steps = [];
    const path = [];
    const result = [];

    const snap = (s) => steps.push({
      candidates,
      target,
      path: path.slice(),
      result: result.map((r) => r.slice()),
      start: 0,
      i: undefined,
      remaining: target,
      changed: [],
      ...s,
    });

    snap({
      kind: 'start',
      lines: ['sort', 'call'],
      changed: ['remaining'],
      text: `Girdi sıralandı: <code>candidates = [${candidates.join(', ')}]</code>, <code>target = ${target}</code>. <code>Backtrack(0, ${target})</code> ile başlıyoruz.`,
    });

    function backtrack(start, remaining) {
      if (remaining === 0) {
        result.push(path.slice());
        snap({
          kind: 'ok',
          start,
          remaining,
          lines: ['base-zero', 'add-res'],
          changed: ['result'],
          text: `<code>remaining == 0</code>! Geçerli kombinasyon <code>[${path.join(', ')}]</code> sonuca eklendi.`,
        });
        return;
      }

      for (let i = start; i < candidates.length; i++) {
        if (i > start && candidates[i] === candidates[i - 1]) {
          snap({
            kind: 'skip',
            start,
            i,
            remaining,
            lines: ['for', 'dup-if', 'dup-cont'],
            changed: ['i'],
            text: `<code>i = ${i} &gt; start (${start})</code> ve <code>candidates[${i}] == candidates[${i - 1}] (${candidates[i]})</code>. Kopya dalı <code>continue</code> ile atlıyoruz.`,
          });
          continue;
        }

        if (candidates[i] > remaining) {
          snap({
            kind: 'break',
            start,
            i,
            remaining,
            lines: ['for', 'gt-if', 'gt-brk'],
            changed: ['i'],
            text: `<code>candidates[${i}] (${candidates[i]}) &gt; remaining (${remaining})</code>. Dizi sıralı olduğundan sonraki adaylar da sığmaz; <code>break</code> ile döngüden çıkıyoruz.`,
          });
          break;
        }

        const val = candidates[i];
        path.push(val);
        snap({
          kind: 'choose',
          start,
          i,
          remaining: remaining - val,
          lines: ['for', 'push', 'recurse'],
          changed: ['i', 'path', 'remaining'],
          text: `<code>i = ${i}</code> (aday <code>${val}</code>) seçildi → <code>path = [${path.join(', ')}]</code>, kalan: <code>${remaining - val}</code>. <code>Backtrack(${i + 1}, ${remaining - val})</code> çağrılıyor.`,
        });

        backtrack(i + 1, remaining - val);

        path.pop();
        snap({
          kind: 'back',
          start,
          i,
          remaining,
          lines: ['pop'],
          changed: ['path', 'remaining'],
          text: `Geri izleme: <code>${val}</code> çıkarıldı → <code>path = [${path.join(', ')}]</code>, <code>remaining = ${remaining}</code>.`,
        });
      }
    }

    backtrack(0, target);

    snap({
      kind: 'done',
      lines: ['ret'],
      text: `Arama tamamlandı. Toplam <b>${result.length}</b> benzersiz kombinasyon bulundu.`,
    });

    return steps;
  }

  const CODE = [
    ['sort', 'Array.Sort(candidates);'],
    ['', '<span class="kw">void</span> Backtrack(<span class="kw">int</span> start, <span class="kw">int</span> remaining)'],
    ['', '{'],
    ['base-zero', '    <span class="kw">if</span> (remaining == 0)'],
    ['', '    {'],
    ['add-res', '        result.Add(<span class="kw">new</span> List&lt;<span class="kw">int</span>&gt;(path)); <span class="kw">return</span>;'],
    ['', '    }'],
    ['for', '    <span class="kw">for</span> (<span class="kw">int</span> i = start; i &lt; candidates.Length; i++)'],
    ['', '    {'],
    ['dup-if', '        <span class="kw">if</span> (i &gt; start &amp;&amp; candidates[i] == candidates[i - 1])'],
    ['dup-cont', '            <span class="kw">continue</span>;'],
    ['gt-if', '        <span class="kw">if</span> (candidates[i] &gt; remaining)'],
    ['gt-brk', '            <span class="kw">break</span>;'],
    ['push', '        path.Add(candidates[i]);'],
    ['recurse', '        Backtrack(i + 1, remaining - candidates[i]);'],
    ['pop', '        path.RemoveAt(path.Count - 1);'],
    ['', '    }'],
    ['', '}'],
    ['call', 'Backtrack(0, target);'],
    ['ret', '<span class="kw">return</span> result;'],
  ];

  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Başlangıç', ''],
    choose: ['Aday Seç', ''],
    ok: ['Kombinasyon Bulundu', 'ok'],
    skip: ['Kopya Atlandı', 'skip'],
    break: ['Aşıldı (Break)', 'skip'],
    back: ['Geri İzle (Pop)', ''],
    done: ['Tamamlandı', 'ok'],
  };

  let presetIdx = 0;
  let steps = [];
  let idx = 0;
  let timer = null;

  function render() {
    const st = steps[idx];

    $('cand-row').innerHTML = st.candidates.map((v, k) => {
      let cls = 'chip';
      if (k === st.i) {
        cls += (st.kind === 'skip' || st.kind === 'break') ? ' skip-dup' : ' cur';
      } else if (k < st.start) {
        cls += ' dim';
      }
      return `<div class="item"><span class="idx-lbl">i=${k}</span><div class="${cls}">${v}</div></div>`;
    }).join('');

    $('path-row').innerHTML = st.path.length === 0
      ? '<p class="empty-note">boş []</p>'
      : st.path.map((v) => `<div class="chip ${st.kind === 'ok' ? 'ok-item' : 'path-item'}">${v}</div>`).join('');

    $('res-row').innerHTML = st.result.length === 0
      ? '<p class="empty-note">henüz yok</p>'
      : st.result.map((r) => `<span class="res-badge">[${r.join(', ')}]</span>`).join('');

    const vars = [
      ['start', st.start],
      ['i', st.i],
      ['remaining', st.remaining],
      ['path', `[${st.path.join(', ')}]`],
    ];
    $('vars').innerHTML = vars.map(([name, v]) =>
      `<div class="var${st.changed.includes(name) ? ' changed' : ''}"><dt>${name}</dt><dd>${v === undefined ? '—' : v}</dd></div>`).join('');

    Object.keys(codeLines).forEach((id) => codeLines[id].classList.toggle('hl', st.lines.includes(id)));

    const [tagText, tagKind] = TAGS[st.kind];
    $('step-count').textContent = `Adım ${idx + 1} / ${steps.length}`;
    $('step-tag').textContent = tagText;
    $('step-tag').dataset.kind = tagKind;
    $('step-text').innerHTML = st.text;
    $('prev-btn').disabled = idx === 0;
    $('reset').disabled = idx === 0;
    $('next-btn').disabled = idx === steps.length - 1;

    document.querySelectorAll('.presets button').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.idx) === presetIdx)));
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Oynat';
  }

  function loadPreset(pIdx) {
    stop();
    presetIdx = pIdx;
    const { raw, target } = PRESETS[presetIdx];
    steps = buildSteps(raw, target);
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
    }, 950);
  });
  document.querySelectorAll('.presets button').forEach((b) => b.addEventListener('click', () => {
    loadPreset(Number(b.dataset.idx));
  }));
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  loadPreset(0);
})();
