(() => {
  const $ = (id) => document.getElementById(id);

  const PRESETS = [
    { triplets: [[2, 5, 3], [1, 8, 4], [1, 7, 5]], target: [2, 7, 5] },
    { triplets: [[3, 4, 5], [4, 5, 6]], target: [3, 2, 5] },
    { triplets: [[2, 5, 3], [2, 3, 4], [1, 2, 5], [5, 2, 3]], target: [5, 5, 5] },
    { triplets: [[3, 5, 1], [1, 4, 1], [1, 1, 5]], target: [3, 4, 5] },
  ];

  function buildSteps(triplets, target) {
    const steps = [];
    let ok0 = false;
    let ok1 = false;
    let ok2 = false;
    let cur = -1;
    const status = triplets.map(() => 'pending');

    const snap = (s) => steps.push({
      triplets,
      target,
      ok0,
      ok1,
      ok2,
      cur,
      status: status.slice(),
      changed: [],
      ...s,
    });

    snap({
      kind: 'start',
      lines: ['init'],
      changed: ['ok0', 'ok1', 'ok2'],
      text: `Başlangıçta üç hedef indeksi için de eşleşme bayrakları <code>false</code>. Hedef: <code>[${target.join(', ')}]</code>.`,
    });

    for (let i = 0; i < triplets.length; i++) {
      cur = i;
      const t = triplets[i];
      const over0 = t[0] > target[0];
      const over1 = t[1] > target[1];
      const over2 = t[2] > target[2];

      if (over0 || over1 || over2) {
        status[i] = 'skip';
        const reasons = [];
        if (over0) reasons.push(`t[0]=${t[0]} > ${target[0]}`);
        if (over1) reasons.push(`t[1]=${t[1]} > ${target[1]}`);
        if (over2) reasons.push(`t[2]=${t[2]} > ${target[2]}`);
        snap({
          kind: 'skip',
          lines: ['loop', 'ifover', 'cont'],
          changed: ['t'],
          text: `<code>t = [${t.join(', ')}]</code> inceleniyor. Hedefi aşan eleman var (${reasons.join(', ')}); bu üçlü birleştirmeye katılırsa hedef bozulur. <code>continue</code> ile eleniyor.`,
        });
        continue;
      }

      status[i] = 'safe';
      const ch = ['t'];
      const hits = [];
      const hl = ['loop', 'ifover'];
      if (t[0] === target[0]) {
        if (!ok0) ch.push('ok0');
        ok0 = true;
        hits.push(`t[0] == ${target[0]} → ok0 = true`);
        hl.push('c0');
      }
      if (t[1] === target[1]) {
        if (!ok1) ch.push('ok1');
        ok1 = true;
        hits.push(`t[1] == ${target[1]} → ok1 = true`);
        hl.push('c1');
      }
      if (t[2] === target[2]) {
        if (!ok2) ch.push('ok2');
        ok2 = true;
        hits.push(`t[2] == ${target[2]} → ok2 = true`);
        hl.push('c2');
      }

      snap({
        kind: 'safe',
        lines: hl,
        changed: ch,
        text: `<code>t = [${t.join(', ')}]</code> güvenli (hiçbir elemanı hedefi aşmıyor). ` +
          (hits.length > 0 ? `Eşleşenler: <b>${hits.join(', ')}</b>.` : 'Hedefle birebir eşleşen elemanı yok.'),
      });
    }

    cur = -1;
    const res = ok0 && ok1 && ok2;
    snap({
      kind: res ? 'done' : 'bad',
      lines: ['ret'],
      text: res
        ? `Üç bayrak da <code>true</code>! Güvenli üçlüler birleştirildiğinde <code>[${target.join(', ')}]</code> elde edilir → <code>return true</code>.`
        : `Döngü bitti ancak bazı hedef bileşenleri güvenli üçlülerde hiç bulunamadı (<code>ok0=${ok0}, ok1=${ok1}, ok2=${ok2}</code>) → <code>return false</code>.`,
    });

    return steps;
  }

  const CODE = [
    ['init', '<span class="kw">bool</span> ok0 = <span class="kw">false</span>, ok1 = <span class="kw">false</span>, ok2 = <span class="kw">false</span>;'],
    ['', ''],
    ['loop', '<span class="kw">foreach</span> (<span class="kw">int</span>[] t <span class="kw">in</span> triplets)'],
    ['', '{'],
    ['ifover', '    <span class="kw">if</span> (t[0] &gt; target[0] || t[1] &gt; target[1] || t[2] &gt; target[2])'],
    ['cont', '        <span class="kw">continue</span>;'],
    ['', ''],
    ['c0', '    <span class="kw">if</span> (t[0] == target[0]) ok0 = <span class="kw">true</span>;'],
    ['c1', '    <span class="kw">if</span> (t[1] == target[1]) ok1 = <span class="kw">true</span>;'],
    ['c2', '    <span class="kw">if</span> (t[2] == target[2]) ok2 = <span class="kw">true</span>;'],
    ['', '}'],
    ['', ''],
    ['ret', '<span class="kw">return</span> ok0 &amp;&amp; ok1 &amp;&amp; ok2;'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Başlangıç', ''],
    skip: ['Elendi (Aşıyor)', 'skip'],
    safe: ['Güvenli Üçlü', ''],
    done: ['Başarılı (true)', 'ok'],
    bad: ['Başarısız (false)', 'bad'],
  };

  let pIdx = 0;
  let steps = [];
  let idx = 0;
  let timer = null;

  function render() {
    const st = steps[idx];
    const flags = [st.ok0, st.ok1, st.ok2];

    $('target-row').innerHTML = st.target.map((v, k) =>
      `<div class="tslot${flags[k] ? ' hit' : ''}"><span class="idx">target[${k}] (${flags[k] ? '✓' : 'bekliyor'})</span><span class="val">${v}</span></div>`
    ).join('');

    $('triplet-grid').innerHTML = st.triplets.map((t, i) => {
      const s = st.status[i];
      let cls = 'tcard';
      if (i === st.cur) cls += ' cur';
      if (s === 'skip') cls += ' skip';
      else if (s === 'safe') cls += ' safe';
      const badge = s === 'skip' ? 'elendi' : s === 'safe' ? 'güvenli' : 'bekliyor';
      const cells = t.map((v, k) => {
        let cCls = 'cell';
        if (s !== 'pending') {
          if (v > st.target[k]) cCls += ' over';
          else if (s === 'safe' && v === st.target[k]) cCls += ' match';
        }
        return `<div class="${cCls}">${v}</div>`;
      }).join('');
      return `<div class="${cls}"><div class="hdr"><span>#${i}</span><span>${badge}</span></div><div class="vals">${cells}</div></div>`;
    }).join('');

    const curT = st.cur >= 0 ? `[${st.triplets[st.cur].join(',')}]` : '—';
    const vars = [
      ['t', curT],
      ['ok0', String(st.ok0)],
      ['ok1', String(st.ok1)],
      ['ok2', String(st.ok2)],
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

    document.querySelectorAll('.presets button').forEach((b) =>
      b.setAttribute('aria-pressed', String(Number(b.dataset.p) === pIdx))
    );
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Oynat';
  }

  function selectPreset(k) {
    stop();
    pIdx = k;
    const p = PRESETS[k];
    steps = buildSteps(p.triplets, p.target);
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

  document.querySelectorAll('.presets button').forEach((b) =>
    b.addEventListener('click', () => selectPreset(Number(b.dataset.p)))
  );

  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  selectPreset(0);
})();
