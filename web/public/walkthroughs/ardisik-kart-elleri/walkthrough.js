(() => {
  const $ = (id) => document.getElementById(id);

  function buildSteps(rawHand, groupSize) {
    const steps = [];
    const hand = rawHand.slice();
    const count = {};
    const groups = [];
    let curIdx = -1;
    let card;
    let iVal;
    let nextCard;

    const snap = (s) => steps.push({
      hand: hand.slice(),
      count: { ...count },
      groups: groups.map((g) => g.slice()),
      curIdx,
      card,
      iVal,
      nextCard,
      probe: null,
      activeGroup: [],
      changed: [],
      ...s,
    });

    if (hand.length % groupSize !== 0) {
      snap({
        kind: 'bad',
        lines: ['mod', 'retmod'],
        text: `<code>hand.Length (${hand.length}) % groupSize (${groupSize}) = ${hand.length % groupSize} != 0</code>. Kart sayısı grup boyutuna tam bölünmediği için doğrudan <code>false</code> döneriz.`,
      });
      return steps;
    }

    hand.sort((a, b) => a - b);
    hand.forEach((c) => { count[c] = (count[c] || 0) + 1; });

    snap({
      kind: 'start',
      lines: ['mod', 'sort', 'dict'],
      text: `<code>hand.Length % groupSize == 0</code> kontrolü geçti. Kartlar sıralandı ve her kartın adedi <code>count</code> tablosuna kaydedildi.`,
    });

    for (let idx = 0; idx < hand.length; idx++) {
      curIdx = idx;
      card = hand[idx];
      iVal = undefined;
      nextCard = undefined;

      if (count[card] === 0) {
        snap({
          kind: 'skip',
          lines: ['outer', 'ifzero', 'cont'],
          changed: ['card'],
          text: `<code>card = ${card}</code>. <code>count[${card}] == 0</code> (önceki gruplarda kullanıldı). <code>continue</code> ile atlıyoruz.`,
        });
        continue;
      }

      const currentGrp = [];
      for (let i = 0; i < groupSize; i++) {
        iVal = i;
        nextCard = card + i;
        const avail = count[nextCard] || 0;
        if (avail === 0) {
          snap({
            kind: 'bad',
            lines: ['inner', 'next', 'ifmiss', 'retfalse'],
            changed: ['i', 'nextCard'],
            probe: { value: nextCard, found: false },
            activeGroup: currentGrp.slice(),
            text: `Grup için <code>nextCard = ${nextCard}</code> aranıyor ancak tabloda kalmadı (<code>count[${nextCard}] == 0</code>). Ardışık grup tamamlanamaz → <code>return false</code>.`,
          });
          return steps;
        }
        count[nextCard]--;
        currentGrp.push(nextCard);
        snap({
          kind: 'grow',
          lines: ['inner', 'next', 'dec'],
          changed: ['i', 'nextCard'],
          probe: { value: nextCard, found: true },
          activeGroup: currentGrp.slice(),
          text: `<code>i = ${i}</code>, <code>nextCard = ${nextCard}</code> mevcut. <code>count[${nextCard}]--</code> → kalan: ${count[nextCard]}.`,
        });
      }
      groups.push(currentGrp);
    }

    curIdx = hand.length;
    card = undefined;
    iVal = undefined;
    nextCard = undefined;
    snap({
      kind: 'done',
      lines: ['rettrue'],
      text: `Tüm kartlar ${groups.length} adet ardışık gruba başarıyla ayrıldı: ${groups.map((g) => `[${g.join(',')}]`).join(', ')}. <code>return true</code>.`,
    });
    return steps;
  }

  const CODE = [
    ['mod', '<span class="kw">if</span> (hand.Length % groupSize != 0)'],
    ['retmod', '    <span class="kw">return false</span>;'],
    ['sort', 'Array.Sort(hand);'],
    ['dict', 'Dictionary&lt;<span class="kw">int</span>, <span class="kw">int</span>&gt; count = CountCards(hand);'],
    ['outer', '<span class="kw">foreach</span> (<span class="kw">int</span> card <span class="kw">in</span> hand)'],
    ['', '{'],
    ['ifzero', '    <span class="kw">if</span> (count[card] == 0)'],
    ['cont', '        <span class="kw">continue</span>;'],
    ['inner', '    <span class="kw">for</span> (<span class="kw">int</span> i = 0; i &lt; groupSize; i++)'],
    ['', '    {'],
    ['next', '        <span class="kw">int</span> nextCard = card + i;'],
    ['ifmiss', '        <span class="kw">if</span> (!count.ContainsKey(nextCard) || count[nextCard] == 0)'],
    ['retfalse', '            <span class="kw">return false</span>;'],
    ['dec', '        count[nextCard]--;'],
    ['', '    }'],
    ['', '}'],
    ['rettrue', '<span class="kw">return true</span>;'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Başlangıç', ''],
    skip: ['Atlandı', 'skip'],
    grow: ['Kart eşleşti', ''],
    done: ['Başarılı (true)', 'ok'],
    bad: ['Başarısız (false)', 'bad'],
  };

  let handText = '1, 2, 3, 6, 2, 3, 4, 7, 8';
  let sizeText = '3';
  let steps = [];
  let idx = 0;
  let timer = null;

  function parseInputs(hRaw, sRaw) {
    const parts = hRaw.split(/[\s,]+/).filter(Boolean);
    if (parts.length === 0 || parts.length > 12) return null;
    const nums = parts.map(Number);
    if (!nums.every((v) => Number.isInteger(v) && v >= 0 && v <= 99)) return null;
    const g = Number(sRaw.trim());
    if (!Number.isInteger(g) || g < 1 || g > 12) return null;
    return { nums, g };
  }

  function render() {
    const st = steps[idx];
    $('hand-row').innerHTML = st.hand.map((v, k) =>
      `<span class="mini${k === st.curIdx ? ' now' : k < st.curIdx ? ' done' : ''}">${v}</span>`
    ).join('');

    $('groups-row').innerHTML = st.groups.length === 0 && st.activeGroup.length === 0
      ? '<span class="empty-note">henüz grup yok</span>'
      : st.groups.map((g) => `<span class="mini grp">[${g.join(', ')}]</span>`).join('') +
        (st.activeGroup.length > 0 ? `<span class="mini now">[${st.activeGroup.join(', ')}…]</span>` : '');

    const keys = Object.keys(st.count).map(Number).sort((a, b) => a - b);
    if (st.probe && !st.probe.found && !keys.includes(st.probe.value)) {
      keys.push(st.probe.value);
      keys.sort((a, b) => a - b);
    }

    if (keys.length === 0) {
      $('nline').innerHTML = '<p class="empty-note">Tablo oluşturulmadı.</p>';
    } else {
      $('nline').innerHTML = keys.map((k) => {
        const isGhost = !(k in st.count);
        const rem = st.count[k] ?? 0;
        const isProbe = st.probe && st.probe.value === k;
        const inActive = st.activeGroup.includes(k);
        let cls = 'chip';
        if (isGhost) cls += ' ghost';
        else if (isProbe) cls += ' probe';
        else if (k === st.card) cls += ' cur';
        const state = !isGhost && inActive ? 'run' : rem === 0 ? 'zero' : 'plain';
        const tagHtml = isProbe ? `<span class="t-probe">nextCard ${st.probe.found ? '✓' : '✗'}</span>` : (k === st.card ? '<span class="t-num">card</span>' : '');
        return `<div class="item"><div class="tags">${tagHtml}</div><div class="${cls}" data-state="${state}"><span>${k}</span><span class="sub">adet: ${rem}</span></div></div>`;
      }).join('');
    }

    const vars = [
      ['groupSize', Number(sizeText)],
      ['card', st.card],
      ['i', st.iVal],
      ['nextCard', st.nextCard],
    ];
    $('vars').innerHTML = vars.map(([name, v]) =>
      `<div class="var${st.changed.includes(name) ? ' changed' : ''}"><dt>${name}</dt><dd>${v === undefined ? '—' : v}</dd></div>`
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
      b.setAttribute('aria-pressed', String(b.dataset.h === handText && b.dataset.g === sizeText))
    );
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Oynat';
  }

  function restart(hRaw, sRaw, parsed) {
    stop();
    handText = hRaw;
    sizeText = sRaw;
    steps = buildSteps(parsed.nums, parsed.g);
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
    $('hand-in').value = b.dataset.h;
    $('size-in').value = b.dataset.g;
    $('list-err').hidden = true;
    restart(b.dataset.h, b.dataset.g, parseInputs(b.dataset.h, b.dataset.g));
  }));

  function handleInput() {
    const parsed = parseInputs($('hand-in').value, $('size-in').value);
    if (!parsed) { $('list-err').hidden = false; return; }
    $('list-err').hidden = true;
    restart($('hand-in').value, $('size-in').value, parsed);
  }
  $('hand-in').addEventListener('input', handleInput);
  $('size-in').addEventListener('input', handleInput);

  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(handText, sizeText, parseInputs(handText, sizeText));
})();
