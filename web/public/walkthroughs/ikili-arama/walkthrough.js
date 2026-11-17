(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_LEN = 10;

  function buildSteps(nums, target) {
    const steps = [];
    let left = 0;
    let right = nums.length - 1;
    let mid;
    let foundIdx = -1;

    const snap = (s) => steps.push({
      nums, target, left, right, mid,
      midVal: mid !== undefined ? nums[mid] : undefined,
      foundIdx, changed: [], ...s,
    });

    snap({
      kind: 'start',
      lines: ['left', 'right'],
      changed: ['left', 'right'],
      text: `Arama aralığı tüm diziyi kapsayacak şekilde başlatıldı: <code>left = 0</code>, <code>right = ${right}</code>. Aranan değer: <code>target = ${target}</code>.`,
    });

    while (left <= right) {
      mid = left + Math.floor((right - left) / 2);

      snap({
        kind: 'mid',
        lines: ['while', 'mid'],
        changed: ['mid'],
        text: `<code>left (${left}) &lt;= right (${right})</code> koşulu doğru. Orta indeks hesaplandı: <code>mid = ${left} + (${right} - ${left}) / 2 = ${mid}</code> → <code>nums[${mid}] = ${nums[mid]}</code>.`,
      });

      if (nums[mid] === target) {
        foundIdx = mid;
        snap({
          kind: 'found',
          lines: ['eq'],
          text: `<code>nums[${mid}] (${nums[mid]}) == target (${target})</code>! Hedef bulundu, <code>return ${mid}</code>.`,
        });
        return steps;
      }

      if (nums[mid] < target) {
        const oldLeft = left;
        left = mid + 1;
        snap({
          kind: 'right',
          lines: ['lt', 'goRight'],
          changed: ['left'],
          text: `<code>nums[${mid}] (${nums[mid]}) &lt; target (${target})</code>. Hedef sağ yarıda olmalı; sol yarı [${oldLeft}..${mid}] elendi: <code>left = ${mid} + 1 = ${left}</code>.`,
        });
      } else {
        const oldRight = right;
        right = mid - 1;
        snap({
          kind: 'left',
          lines: ['lt', 'else', 'goLeft'],
          changed: ['right'],
          text: `<code>nums[${mid}] (${nums[mid]}) &gt; target (${target})</code>. Hedef sol yarıda olmalı; sağ yarı [${mid}..${oldRight}] elendi: <code>right = ${mid} - 1 = ${right}</code>.`,
        });
      }
    }

    mid = undefined;
    snap({
      kind: 'notfound',
      lines: ['while', 'retNeg'],
      text: `<code>left (${left}) &gt; right (${right})</code>: arama aralığı boşaldı. Hedef (${target}) dizide yok; <code>return -1</code>.`,
    });

    return steps;
  }

  const CODE = [
    ['left', '<span class="kw">var</span> left = 0;'],
    ['right', '<span class="kw">var</span> right = nums.Length - 1;'],
    ['', ''],
    ['while', '<span class="kw">while</span> (left &lt;= right)'],
    ['', '{'],
    ['mid', '    <span class="kw">var</span> mid = left + (right - left) / 2;'],
    ['', ''],
    ['eq', '    <span class="kw">if</span> (nums[mid] == target) <span class="kw">return</span> mid;'],
    ['', ''],
    ['lt', '    <span class="kw">if</span> (nums[mid] &lt; target)'],
    ['', '    {'],
    ['goRight', '        left = mid + 1;'],
    ['', '    }'],
    ['else', '    <span class="kw">else</span>'],
    ['', '    {'],
    ['goLeft', '        right = mid - 1;'],
    ['', '    }'],
    ['', '}'],
    ['', ''],
    ['retNeg', '<span class="kw">return</span> -1;'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Başlangıç', ''],
    mid: ['Orta nokta (mid)', ''],
    right: ['Sağ yarıya geç', ''],
    left: ['Sol yarıya geç', ''],
    found: ['Bulundu!', 'ok'],
    notfound: ['Bulunamadı (-1)', 'skip'],
  };

  let listText = '-1, 0, 3, 5, 9, 12';
  let targetText = '9';
  let steps = [];
  let idx = 0;
  let timer = null;

  function parseInputs(rawList, rawTarget) {
    const parts = rawList.split(/[\s,]+/).filter(Boolean);
    if (parts.length < 1 || parts.length > MAX_LEN) return null;
    const nums = parts.map(Number);
    if (!nums.every((v) => Number.isInteger(v) && v >= -999 && v <= 999)) return null;
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] <= nums[i - 1]) return null;
    }
    const tStr = rawTarget.trim();
    if (!tStr) return null;
    const target = Number(tStr);
    if (!Number.isInteger(target) || target < -999 || target > 999) return null;
    return { nums, target };
  }

  function render() {
    const st = steps[idx];

    $('arr').innerHTML = st.nums.map((v, i) => {
      const ptrs = [];
      if (i === st.left && i === st.right) ptrs.push('<span class="p-lr">L, R</span>');
      else {
        if (i === st.left) ptrs.push('<span class="p-lr">left</span>');
        if (i === st.right) ptrs.push('<span class="p-lr">right</span>');
      }
      if (i === st.mid) ptrs.push('<span class="p-mid">mid</span>');

      const inRange = st.left <= st.right && i >= st.left && i <= st.right;
      let state = inRange ? 'range' : 'out';
      if (i === st.foundIdx) state = 'found';
      const cls = 'chip' + (i === st.mid ? ' mid' : '');

      return `<div class="cell">
        <div class="ptrs">${ptrs.join('')}</div>
        <div class="${cls}" data-state="${state}">${v}</div>
        <span class="idx">[${i}]</span>
      </div>`;
    }).join('');

    const vars = [
      ['target', st.target, 'target'],
      ['left', st.left, 'left'],
      ['right', st.right, 'right'],
      ['mid', st.mid, 'mid'],
      ['nums[mid]', st.midVal, 'mid'],
    ];
    $('vars').innerHTML = vars.map(([name, v, key]) =>
      `<div class="var${st.changed.includes(key) ? ' changed' : ''}"><dt>${name}</dt><dd>${v === undefined ? '—' : v}</dd></div>`
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
      b.setAttribute('aria-pressed', String(b.dataset.l === listText && b.dataset.t === targetText))
    );
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Oynat';
  }

  function restart(lText, tText, parsed) {
    stop();
    listText = lText;
    targetText = tText;
    steps = buildSteps(parsed.nums, parsed.target);
    idx = 0;
    render();
  }

  function onInputChange() {
    const parsed = parseInputs($('list').value, $('target').value);
    if (!parsed) { $('list-err').hidden = false; return; }
    $('list-err').hidden = true;
    restart($('list').value, $('target').value, parsed);
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
    $('target').value = b.dataset.t;
    $('list-err').hidden = true;
    restart(b.dataset.l, b.dataset.t, parseInputs(b.dataset.l, b.dataset.t));
  }));
  $('list').addEventListener('input', onInputChange);
  $('target').addEventListener('input', onInputChange);
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(listText, targetText, parseInputs(listText, targetText));
})();
