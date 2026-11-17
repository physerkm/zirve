(() => {
  const $ = (id) => document.getElementById(id);

  const PRESETS = [
    {
      words: ['This', 'is', 'an', 'example', 'of', 'text', 'justification.'],
      maxWidth: 16,
    },
    {
      words: ['What', 'must', 'be', 'acknowledgment', 'shall', 'be'],
      maxWidth: 16,
    },
    {
      words: ['a', 'b', 'c', 'd', 'eeeee'],
      maxWidth: 9,
    },
  ];

  function buildSteps(words, maxWidth) {
    const steps = [];
    const n = words.length;
    const lines = [];
    let i = 0;

    const snap = (extra) => steps.push({
      i,
      j: undefined,
      lineLen: undefined,
      gaps: undefined,
      totalSpaces: undefined,
      evenSpaces: undefined,
      extraSpaces: undefined,
      lines: lines.slice(),
      changed: [],
      codeLines: [],
      ...extra,
    });

    snap({
      kind: 'start',
      codeLines: ['init'],
      changed: ['i'],
      text: `<code>n = ${n}</code> kelime, <code>maxWidth = ${maxWidth}</code>. <code>i = 0</code> ile ilk satırı oluşturmaya başlıyoruz.`,
    });

    while (i < n) {
      let lineLen = words[i].length;
      let j = i + 1;

      while (j < n && lineLen + (j - i) + words[j].length <= maxWidth) {
        lineLen += words[j].length;
        j++;
      }

      const gaps = j - i - 1;
      const totalSpaces = maxWidth - lineLen;
      const selected = words.slice(i, j).map((w) => `"${w}"`).join(', ');

      snap({
        kind: 'pack',
        i,
        j,
        lineLen,
        gaps,
        totalSpaces,
        codeLines: ['while-i', 'pack-init', 'pack-loop', 'calc-gaps'],
        changed: ['j', 'lineLen', 'gaps', 'totalSpaces'],
        text: `Satıra sığan kelimeler seçildi: <code>words[${i}..${j - 1}]</code> = [${selected}]. Harf toplamı <code>lineLen = ${lineLen}</code>, aralık sayısı <code>gaps = ${gaps}</code>, dağıtılacak toplam boşluk <code>totalSpaces = ${totalSpaces}</code>.`,
      });

      if (j === n || gaps === 0) {
        const joined = words.slice(i, j).join(' ');
        const padCount = maxWidth - joined.length;
        const finalLine = joined + ' '.repeat(padCount);
        lines.push({ text: finalLine, leftJustified: true, padStart: joined.length });

        snap({
          kind: 'left',
          i,
          j,
          lineLen,
          gaps,
          totalSpaces,
          codeLines: ['if-left', 'left-join', 'left-pad', 'add-res'],
          changed: [],
          text: (j === n ? 'Bu son satır (<code>j == n</code>).' : 'Satırda tek kelime var (<code>gaps == 0</code>).') +
            ` Sola yaslanıp sağa <b>${padCount}</b> adet dolgu boşluğu eklendi: <code>"${finalLine}"</code>.`,
        });
      } else {
        const evenSpaces = Math.floor(totalSpaces / gaps);
        const extraSpaces = totalSpaces % gaps;
        let finalLine = '';
        const gapSizes = [];
        for (let k = i; k < j; k++) {
          finalLine += words[k];
          if (k < j - 1) {
            const gapIndex = k - i;
            const sp = evenSpaces + (gapIndex < extraSpaces ? 1 : 0);
            gapSizes.push(sp);
            finalLine += ' '.repeat(sp);
          }
        }
        lines.push({ text: finalLine, leftJustified: false, padStart: maxWidth });

        snap({
          kind: 'justify',
          i,
          j,
          lineLen,
          gaps,
          totalSpaces,
          evenSpaces,
          extraSpaces,
          codeLines: ['else-full', 'calc-even', 'full-loop', 'add-res'],
          changed: ['evenSpaces', 'extraSpaces'],
          text: `İki yana yaslama: <code>evenSpaces = ${totalSpaces} / ${gaps} = ${evenSpaces}</code>, <code>extraSpaces = ${totalSpaces} % ${gaps} = ${extraSpaces}</code>. Aralıklara sırasıyla <b>[${gapSizes.join(', ')}]</b> boşluk verildi: <code>"${finalLine}"</code>.`,
        });
      }

      i = j;
    }

    snap({
      kind: 'done',
      i,
      codeLines: ['ret'],
      changed: ['i'],
      text: `Tüm kelimeler yerleştirildi ve <b>${lines.length}</b> satırlık sonuç listesi döndürüldü.`,
    });

    return steps;
  }

  const CODE = [
    ['init', 'IList&lt;<span class="kw">string</span>&gt; result = <span class="kw">new</span> List&lt;<span class="kw">string</span>&gt;(); <span class="kw">int</span> i = 0, n = words.Length;'],
    ['while-i', '<span class="kw">while</span> (i &lt; n) {'],
    ['pack-init', '    <span class="kw">int</span> lineLen = words[i].Length, j = i + 1;'],
    ['pack-loop', '    <span class="kw">while</span> (j &lt; n &amp;&amp; lineLen + (j - i) + words[j].Length &lt;= maxWidth)'],
    ['pack-loop', '        { lineLen += words[j].Length; j++; }'],
    ['calc-gaps', '    <span class="kw">int</span> gaps = j - i - 1, totalSpaces = maxWidth - lineLen;'],
    ['if-left', '    <span class="kw">if</span> (j == n || gaps == 0) {'],
    ['left-join', '        <span class="kw">for</span> (<span class="kw">int</span> k = i; k &lt; j; k++) { <span class="kw">if</span> (k &gt; i) sb.Append(\' \'); sb.Append(words[k]); }'],
    ['left-pad', '        sb.Append(\' \', maxWidth - sb.Length);'],
    ['else-full', '    } <span class="kw">else</span> {'],
    ['calc-even', '        <span class="kw">int</span> evenSpaces = totalSpaces / gaps, extraSpaces = totalSpaces % gaps;'],
    ['full-loop', '        <span class="kw">for</span> (<span class="kw">int</span> k = i; k &lt; j; k++) {'],
    ['full-loop', '            sb.Append(words[k]);'],
    ['full-loop', '            <span class="kw">if</span> (k &lt; j - 1) sb.Append(\' \', evenSpaces + (k - i &lt; extraSpaces ? 1 : 0));'],
    ['full-loop', '        }'],
    ['', '    }'],
    ['add-res', '    result.Add(sb.ToString()); i = j;'],
    ['', '}'],
    ['ret', '<span class="kw">return</span> result;'],
  ];

  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');

  const TAGS = {
    start: ['Başlangıç', ''],
    pack: ['Kelime Seçimi', ''],
    left: ['Sola Yasla', 'skip'],
    justify: ['İki Yana Yasla', ''],
    done: ['Tamamlandı', 'ok'],
  };

  let curPreset = 0;
  let steps = [];
  let idx = 0;
  let timer = null;

  function render() {
    const { words, maxWidth } = PRESETS[curPreset];
    const st = steps[idx];
    $('mw-label').textContent = String(maxWidth);

    $('words-row').innerHTML = words.map((w, k) => {
      let cls = 'mini';
      if (st.j !== undefined && k >= st.i && k < st.j) cls += ' active';
      else if (k < st.i) cls += ' done';
      return `<span class="${cls}">"${w}"<span class="len">(${w.length})</span></span>`;
    }).join('');

    if (st.lines.length === 0) {
      $('lines-out').innerHTML = '<p class="empty-note">Henüz satır oluşturulmadı.</p>';
    } else {
      $('lines-out').innerHTML = st.lines.map((ln) => {
        const chars = Array.from(ln.text).map((ch, cIdx) => {
          if (ch !== ' ') return `<div class="cell">${ch}</div>`;
          const isPad = ln.leftJustified && cIdx >= ln.padStart;
          return `<div class="cell ${isPad ? 'pad' : 'sp'}">·</div>`;
        }).join('');
        return `<div class="line-cells">${chars}</div>`;
      }).join('');
    }

    const vars = [
      ['i..j-1', st.j === undefined ? `${st.i}` : `${st.i}..${st.j - 1}`],
      ['lineLen', st.lineLen ?? '—'],
      ['gaps', st.gaps ?? '—'],
      ['totalSpaces', st.totalSpaces ?? '—'],
      ['evenSpaces', st.evenSpaces ?? '—'],
      ['extraSpaces', st.extraSpaces ?? '—'],
    ];
    $('vars').innerHTML = vars.map(([name, v]) =>
      `<div class="var${st.changed.includes(name) ? ' changed' : ''}"><dt>${name}</dt><dd>${v}</dd></div>`
    ).join('');

    document.querySelectorAll('.ln[data-id]').forEach((el) => {
      el.classList.toggle('hl', st.codeLines.includes(el.dataset.id));
    });

    const [tagText, tagKind] = TAGS[st.kind];
    $('step-count').textContent = `Adım ${idx + 1} / ${steps.length}`;
    $('step-tag').textContent = tagText;
    $('step-tag').dataset.kind = tagKind;
    $('step-text').innerHTML = st.text;

    $('prev-btn').disabled = idx === 0;
    $('reset').disabled = idx === 0;
    $('next-btn').disabled = idx === steps.length - 1;

    document.querySelectorAll('.presets button').forEach((b) => {
      b.setAttribute('aria-pressed', String(Number(b.dataset.p) === curPreset));
    });
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Oynat';
  }

  function restart(pIdx) {
    stop();
    curPreset = pIdx;
    const { words, maxWidth } = PRESETS[curPreset];
    steps = buildSteps(words, maxWidth);
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
    restart(Number(b.dataset.p));
  }));

  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(0);
})();
