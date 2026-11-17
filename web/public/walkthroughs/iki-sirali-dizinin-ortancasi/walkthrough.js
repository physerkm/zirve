(() => {
  const $ = (id) => document.getElementById(id);
  const INF = Infinity;
  const NINF = -Infinity;

  function fmtVal(v) {
    if (v === undefined) return '—';
    if (v === NINF) return '-∞';
    if (v === INF) return '+∞';
    return String(v);
  }

  function buildSteps(rawA, rawB) {
    const steps = [];
    let A = rawA.slice();
    let B = rawB.slice();
    let swapped = false;

    if (A.length > B.length) {
      const tmp = A;
      A = B;
      B = tmp;
      swapped = true;
    }

    const m = A.length;
    const n = B.length;
    const half = Math.floor((m + n + 1) / 2);
    let left = 0;
    let right = m;
    let i;
    let j;
    let maxLeftA;
    let minRightA;
    let maxLeftB;
    let minRightB;

    const snap = (s) => steps.push({
      A, B, swapped, m, n, half, left, right, i, j,
      maxLeftA, minRightA, maxLeftB, minRightB,
      done: false, median: null, changed: [], ...s,
    });

    snap({
      kind: 'init',
      lines: swapped ? ['swap', 'm', 'half', 'lr'] : ['m', 'half', 'lr'],
      changed: ['left', 'right', 'half'],
      text: (swapped
        ? `<code>nums1.Length &gt; nums2.Length</code> olduğu için dizileri yer değiştiriyoruz; ikili aramayı kısa dizi olan <code>[${A.join(', ')}]</code> (uzunluk ${m}) üzerinde yapacağız. `
        : `Kısa dizi <code>nums1</code> (uzunluk ${m}), uzun dizi <code>nums2</code> (uzunluk ${n}). `) +
        `Sol yarıda toplam <code>half = (${m} + ${n} + 1) / 2 = ${half}</code> eleman olmalı. Arama aralığı: <code>left = 0</code>, <code>right = ${m}</code>.`,
    });

    while (left <= right) {
      i = Math.floor((left + right) / 2);
      j = half - i;
      maxLeftA = i === 0 ? NINF : A[i - 1];
      minRightA = i === m ? INF : A[i];
      maxLeftB = j === 0 ? NINF : B[j - 1];
      minRightB = j === n ? INF : B[j];

      snap({
        kind: 'cut',
        lines: ['while', 'ij', 'boundsA', 'boundsB'],
        changed: ['i', 'j', 'maxLeftA', 'minRightA', 'maxLeftB', 'minRightB'],
        text: `Orta kesim noktası: <code>i = (${left} + ${right}) / 2 = ${i}</code> ve <code>j = ${half} - ${i} = ${j}</code>. ` +
          `Sınırlar: <code>maxLeftA = ${fmtVal(maxLeftA)}</code>, <code>minRightA = ${fmtVal(minRightA)}</code>, ` +
          `<code>maxLeftB = ${fmtVal(maxLeftB)}</code>, <code>minRightB = ${fmtVal(minRightB)}</code>.`,
      });

      const ok1 = maxLeftA <= minRightB;
      const ok2 = maxLeftB <= minRightA;

      if (ok1 && ok2) {
        const odd = (m + n) % 2 === 1;
        const med = odd
          ? Math.max(maxLeftA, maxLeftB)
          : (Math.max(maxLeftA, maxLeftB) + Math.min(minRightA, minRightB)) / 2;
        snap({
          kind: 'done',
          done: true,
          median: med,
          lines: odd ? ['ifOk', 'retOdd'] : ['ifOk', 'retEven'],
          changed: [],
          text: `Her iki çapraz koşul da sağlandı (<code>${fmtVal(maxLeftA)} ≤ ${fmtVal(minRightB)}</code> ve <code>${fmtVal(maxLeftB)} ≤ ${fmtVal(minRightA)}</code>)! ` +
            (odd
              ? `Toplam uzunluk (${m + n}) tek olduğu için ortanca sol yarının en büyüğüdür: <code>Math.Max(${fmtVal(maxLeftA)}, ${fmtVal(maxLeftB)}) = ${med}</code>.`
              : `Toplam uzunluk (${m + n}) çift olduğu için ortanca, solun en büyüğü (${Math.max(maxLeftA, maxLeftB)}) ile sağın en küçüğünün (${Math.min(minRightA, minRightB)}) ortalamasıdır: <code>${med}</code>.`),
        });
        break;
      } else if (!ok1) {
        const oldR = right;
        right = i - 1;
        snap({
          kind: 'moveLeft',
          lines: ['elifLeft', 'goLeft'],
          changed: ['right'],
          text: `<code>maxLeftA (${fmtVal(maxLeftA)}) &gt; minRightB (${fmtVal(minRightB)})</code>! Kısa diziden sol yarıya fazla büyük eleman aldık. Kesimi sola çekiyoruz: <code>right = ${i} - 1 = ${right}</code> (eski <code>right = ${oldR}</code>).`,
        });
      } else {
        const oldL = left;
        left = i + 1;
        snap({
          kind: 'moveRight',
          lines: ['elseRight', 'goRight'],
          changed: ['left'],
          text: `<code>maxLeftB (${fmtVal(maxLeftB)}) &gt; minRightA (${fmtVal(minRightA)})</code>! Kısa diziden sol yarıya az eleman aldık. Kesimi sağa itiyoruz: <code>left = ${i} + 1 = ${left}</code> (eski <code>left = ${oldL}</code>).`,
        });
      }
    }

    return steps;
  }

  const CODE = [
    ['swap', '<span class="kw">if</span> (nums1.Length &gt; nums2.Length) <span class="kw">return</span> FindMedianSortedArrays(nums2, nums1);'],
    ['m', '<span class="kw">int</span> m = nums1.Length, n = nums2.Length;'],
    ['half', '<span class="kw">int</span> half = (m + n + 1) / 2;'],
    ['lr', '<span class="kw">int</span> left = 0, right = m;'],
    ['while', '<span class="kw">while</span> (left &lt;= right) {'],
    ['ij', '    <span class="kw">int</span> i = left + (right - left) / 2, j = half - i;'],
    ['boundsA', '    <span class="kw">int</span> maxLeftA = i == 0 ? <span class="kw">int</span>.MinValue : nums1[i - 1], minRightA = i == m ? <span class="kw">int</span>.MaxValue : nums1[i];'],
    ['boundsB', '    <span class="kw">int</span> maxLeftB = j == 0 ? <span class="kw">int</span>.MinValue : nums2[j - 1], minRightB = j == n ? <span class="kw">int</span>.MaxValue : nums2[j];'],
    ['ifOk', '    <span class="kw">if</span> (maxLeftA &lt;= minRightB &amp;&amp; maxLeftB &lt;= minRightA) {'],
    ['retOdd', '        <span class="kw">if</span> ((m + n) % 2 == 1) <span class="kw">return</span> Math.Max(maxLeftA, maxLeftB);'],
    ['retEven', '        <span class="kw">return</span> ((<span class="kw">double</span>)Math.Max(maxLeftA, maxLeftB) + Math.Min(minRightA, minRightB)) / 2.0;'],
    ['', '    }'],
    ['elifLeft', '    <span class="kw">else if</span> (maxLeftA &gt; minRightB)'],
    ['goLeft', '        right = i - 1;'],
    ['elseRight', '    <span class="kw">else</span>'],
    ['goRight', '        left = i + 1;'],
    ['', '}'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    init: ['Başlangıç', ''],
    cut: ['Kesimi Dene', ''],
    moveLeft: ['Sola Kaydır', 'skip'],
    moveRight: ['Sağa Kaydır', 'skip'],
    done: ['Ortanca Bulundu', 'ok'],
  };

  function renderArrayRow(arr, cutIdx, nameLeft, nameRight, st, isA) {
    let html = '';
    const hasCut = cutIdx !== undefined;
    const odd = (st.m + st.n) % 2 === 1;
    const medLeftVal = st.done ? Math.max(st.maxLeftA, st.maxLeftB) : null;
    const medRightVal = st.done && !odd ? Math.min(st.minRightA, st.minRightB) : null;

    // Left -∞ sentinel
    const showLeftInf = hasCut && cutIdx === 0;
    html += `<div class="item"><div class="tags">${showLeftInf ? `<span class="t-bound">${nameLeft}</span>` : ''}</div><div class="chip inf${showLeftInf ? ' b-left' : ''}">-∞</div></div>`;

    if (hasCut && cutIdx === 0) {
      html += '<div class="cut" aria-hidden="true">|</div>';
    }

    for (let k = 0; k < arr.length; k++) {
      const isLeftBound = hasCut && k === cutIdx - 1;
      const isRightBound = hasCut && k === cutIdx;
      const tags = [];
      if (isLeftBound) tags.push(`<span class="t-bound">${nameLeft}</span>`);
      if (isRightBound) tags.push(`<span class="t-right">${nameRight}</span>`);

      let halfState = hasCut && k < cutIdx ? 'left' : 'right';
      if (st.done) {
        if (isLeftBound && arr[k] === medLeftVal && (isA || st.maxLeftA !== st.maxLeftB)) halfState = 'med';
        if (!odd && isRightBound && arr[k] === medRightVal && (isA || st.minRightA !== st.minRightB)) halfState = 'med';
      }

      let cls = 'chip';
      if (isLeftBound) cls += ' b-left';
      if (isRightBound) cls += ' b-right';

      html += `<div class="item"><div class="tags">${tags.join('')}</div><div class="${cls}" data-half="${halfState}">${arr[k]}</div></div>`;

      if (hasCut && k + 1 === cutIdx) {
        html += '<div class="cut" aria-hidden="true">|</div>';
      }
    }

    // Right +∞ sentinel
    const showRightInf = hasCut && cutIdx === arr.length;
    html += `<div class="item"><div class="tags">${showRightInf ? `<span class="t-right">${nameRight}</span>` : ''}</div><div class="chip inf${showRightInf ? ' b-right' : ''}">+∞</div></div>`;

    return html;
  }

  let textA = '1, 3, 8, 9, 15';
  let textB = '7, 11, 18, 19, 21, 25';
  let steps = [];
  let idx = 0;
  let timer = null;

  function parseArr(raw) {
    const parts = raw.split(/[\s,]+/).filter(Boolean);
    if (parts.length > 8) return null;
    const out = parts.map(Number);
    if (!out.every((v) => Number.isInteger(v) && v >= -9999 && v <= 9999)) return null;
    for (let k = 1; k < out.length; k++) {
      if (out[k] < out[k - 1]) return null;
    }
    return out;
  }

  function render() {
    const st = steps[idx];
    $('title-a').textContent = `Kısa dizi A (m = ${st.m})${st.swapped ? ' — nums2 idi, yer değiştirildi' : ' — nums1'}`;
    $('title-b').textContent = `Uzun dizi B (n = ${st.n})${st.swapped ? ' — nums1 idi, yer değiştirildi' : ' — nums2'}`;

    $('row-a').innerHTML = renderArrayRow(st.A, st.i, 'maxLeftA', 'minRightA', st, true);
    $('row-b').innerHTML = renderArrayRow(st.B, st.j, 'maxLeftB', 'minRightB', st, false);

    if (st.i === undefined) {
      $('checks').innerHTML = '';
    } else {
      const ok1 = st.maxLeftA <= st.minRightB;
      const ok2 = st.maxLeftB <= st.minRightA;
      $('checks').innerHTML =
        `<div class="chk ${ok1 ? 'pass' : 'fail'}">maxLeftA (${fmtVal(st.maxLeftA)}) ≤ minRightB (${fmtVal(st.minRightB)}) ${ok1 ? '✓' : '✗'}</div>` +
        `<div class="chk ${ok2 ? 'pass' : 'fail'}">maxLeftB (${fmtVal(st.maxLeftB)}) ≤ minRightA (${fmtVal(st.minRightA)}) ${ok2 ? '✓' : '✗'}</div>`;
    }

    const vars = [
      ['left', st.left],
      ['right', st.right],
      ['i', st.i],
      ['j', st.j],
      ['maxLeftA', fmtVal(st.maxLeftA)],
      ['minRightA', fmtVal(st.minRightA)],
      ['maxLeftB', fmtVal(st.maxLeftB)],
      ['minRightB', fmtVal(st.minRightB)],
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

    document.querySelectorAll('.presets button').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.a === textA && b.dataset.b === textB));
    });
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Oynat';
  }

  function restart(raw1, raw2) {
    const a = parseArr(raw1);
    const b = parseArr(raw2);
    if (!a || !b || a.length + b.length === 0) {
      $('list-err').hidden = false;
      return;
    }
    $('list-err').hidden = true;
    stop();
    textA = raw1;
    textB = raw2;
    steps = buildSteps(a, b);
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
    }, 1200);
  });

  document.querySelectorAll('.presets button').forEach((b) => b.addEventListener('click', () => {
    $('nums1').value = b.dataset.a;
    $('nums2').value = b.dataset.b;
    restart(b.dataset.a, b.dataset.b);
  }));

  const onInput = () => restart($('nums1').value, $('nums2').value);
  $('nums1').addEventListener('input', onInput);
  $('nums2').addEventListener('input', onInput);

  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(textA, textB);
})();
