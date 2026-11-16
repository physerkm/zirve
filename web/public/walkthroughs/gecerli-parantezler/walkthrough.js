(() => {
  const $ = (id) => document.getElementById(id);

  // Steps: mirrors Solution.cs line by line.
  const OPEN_FOR = { ')': '(', ']': '[', '}': '{' };

  function buildSteps(s) {
    const steps = [];
    const stack = [];
    const states = Array.from(s, () => 'todo');
    const snap = (step) => {
      step.states = states.slice();
      step.stack = stack.map((x) => ({ ch: x.ch, i: x.i }));
      steps.push(step);
    };

    snap({ kind: 'init', cur: -1, c: null, open: null, popped: null, lines: ['stack'],
      text: `Boş bir yığınla başlıyoruz. Metni soldan sağa, karakter karakter okuyacağız: <code>${s}</code>` });

    for (let i = 0; i < s.length; i++) {
      const c = s[i];

      if (c === '(' || c === '[' || c === '{') {
        stack.push({ ch: c, i });
        states[i] = 'waiting';
        snap({ kind: 'push', cur: i, c, open: null, popped: null, lines: ['foreach', 'ifOpen', 'push'],
          text: `<code>${c}</code> açılan bir parantez. Kapanmasını beklemek için yığının üstüne koyuyoruz: <code>stack.Push('${c}')</code>. Yığında artık ${stack.length} parantez var.` });
        continue;
      }

      const check = c === ')' ? 'chk1' : c === ']' ? 'chk2' : 'chk3';

      if (stack.length === 0) {
        states[i] = 'bad';
        snap({ kind: 'emptyFail', cur: i, c, open: null, popped: null, lines: ['foreach', 'else', 'ifEmpty', 'retEmpty'],
          text: `<code>${c}</code> kapanan bir parantez ama yığın boş. Kapatılacak açık bir parantez yok, yani bu parantez fazladan: <code>return false</code>.` });
        return steps;
      }

      const top = stack.pop();
      const expected = OPEN_FOR[c];

      if (top.ch === expected) {
        states[i] = 'matched';
        states[top.i] = 'matched';
        snap({ kind: 'match', cur: i, c, open: top.ch, popped: { ch: top.ch, ok: true }, lines: ['foreach', 'else', 'ifEmpty', 'pop', check],
          text: `<code>${c}</code> kapanan bir parantez. Yığının en üstündeki <code>${top.ch}</code> çıkarıldı (<code>Pop</code>). İkisi aynı türden, eşleşiyor ✓. Bu çift tamam; sıradaki karaktere geçiyoruz.` });
      } else {
        states[i] = 'bad';
        states[top.i] = 'bad';
        const deeper = stack.some((x) => x.ch === expected);
        const why = deeper
          ? `Aranan <code>${expected}</code> yığında daha aşağıda. Yani en son açılan parantez kapanmadan başka bir parantez kapatılmaya çalışıldı: sıra yanlış.`
          : 'Parantez türleri farklı: tür yanlış.';
        snap({ kind: 'mismatch', cur: i, c, open: top.ch, popped: { ch: top.ch, ok: false }, lines: ['foreach', 'else', 'ifEmpty', 'pop', check],
          text: `<code>${c}</code> kapanan bir parantez. Yığının en üstündeki <code>${top.ch}</code> çıkarıldı (<code>Pop</code>). Ama <code>${c}</code> ancak <code>${expected}</code> ile eşleşebilir ✗. ${why} <code>return false</code>.` });
        return steps;
      }
    }

    if (stack.length === 0) {
      snap({ kind: 'okEnd', cur: -1, c: null, open: null, popped: null, lines: ['retEnd'],
        text: 'Metin bitti ve yığın boş. Açılan her parantez doğru türle ve doğru sırayla kapandı: <code>return stack.Count == 0</code> → <code>true</code>.' });
    } else {
      stack.forEach((x) => { states[x.i] = 'bad'; });
      const left = stack.map((x) => `<code>${x.ch}</code>`).join(' ');
      snap({ kind: 'leftFail', cur: -1, c: null, open: null, popped: null, lines: ['retEnd'],
        text: `Metin bitti ama yığında ${stack.length} parantez kaldı: ${left}. Bunlar açıldı ama hiç kapanmadı: <code>return stack.Count == 0</code> → <code>false</code>.` });
    }
    return steps;
  }

  // Rendering
  const CODE = [
    ['stack', `<span class="kw">var</span> stack = <span class="kw">new</span> Stack&lt;<span class="kw">char</span>&gt;();`],
    ['', ''],
    ['foreach', `<span class="kw">foreach</span> (<span class="kw">char</span> c <span class="kw">in</span> s)`],
    ['', '{'],
    ['ifOpen', `    <span class="kw">if</span> (c == <span class="st">'('</span> || c == <span class="st">'['</span> || c == <span class="st">'{'</span>)`],
    ['', '    {'],
    ['push', '        stack.Push(c);'],
    ['', '    }'],
    ['else', `    <span class="kw">else</span>`],
    ['', '    {'],
    ['ifEmpty', `        <span class="kw">if</span> (stack.Count == <span class="nu">0</span>)`],
    ['retEmpty', `            <span class="kw">return</span> <span class="kw">false</span>;`],
    ['', ''],
    ['pop', `        <span class="kw">char</span> open = stack.Pop();`],
    ['', ''],
    ['chk1', `        <span class="kw">if</span> (c == <span class="st">')'</span> &amp;&amp; open != <span class="st">'('</span>) <span class="kw">return</span> <span class="kw">false</span>;`],
    ['chk2', `        <span class="kw">if</span> (c == <span class="st">']'</span> &amp;&amp; open != <span class="st">'['</span>) <span class="kw">return</span> <span class="kw">false</span>;`],
    ['chk3', `        <span class="kw">if</span> (c == <span class="st">'}'</span> &amp;&amp; open != <span class="st">'{'</span>) <span class="kw">return</span> <span class="kw">false</span>;`],
    ['', '    }'],
    ['', '}'],
    ['', ''],
    ['retEnd', `<span class="kw">return</span> stack.Count == <span class="nu">0</span>;`],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    init: ['Başlangıç', ''], push: ['Yığına koy', ''], match: ['Eşleşti', ''],
    emptyFail: ['Geçersiz', 'bad'], mismatch: ['Geçersiz', 'bad'], leftFail: ['Geçersiz', 'bad'], okEnd: ['Geçerli', 'ok'],
  };
  const VALID = /^[()[\]{}]{1,16}$/;

  let text = '([])';
  let steps = [];
  let idx = 0;
  let tiles = [];

  function restart(s) {
    text = s;
    steps = buildSteps(s);
    idx = 0;
    $('tiles').innerHTML = Array.from(s, (ch, k) =>
      `<div class="tile-wrap"><div class="tile" aria-label="Sıra ${k}: ${ch}">${ch}</div><span class="tile-i">${k}</span></div>`).join('');
    tiles = Array.from(document.querySelectorAll('#tiles .tile'));
    render();
  }

  function render() {
    const st = steps[idx];

    tiles.forEach((el, k) => {
      el.dataset.state = st.states[k];
      el.classList.toggle('cur', k === st.cur);
    });

    const items = st.stack.slice().reverse();
    $('stack').innerHTML = items.length === 0
      ? '<div class="empty">boş</div>'
      : items.map((x, j) => {
          let cls = 'plate';
          if (j === 0 && st.kind === 'push') cls += ' new';
          if (st.kind === 'leftFail') cls += ' bad';
          return `<div class="${cls}"><span>${x.ch}</span><small>s[${x.i}]${j === 0 ? ' · en üst' : ''}</small></div>`;
        }).join('');

    const chip = $('popped-chip');
    chip.textContent = st.popped ? st.popped.ch : '—';
    chip.dataset.state = st.popped ? (st.popped.ok ? 'matched' : 'bad') : 'none';

    const changed = new Set();
    if (st.c !== null) changed.add('c');
    if (st.open !== null) changed.add('open');
    if (['push', 'match', 'mismatch'].includes(st.kind)) changed.add('count');
    const vars = [
      ['c', 'c', st.c === null ? '—' : `'${st.c}'`],
      ['open', 'open', st.open === null ? '—' : `'${st.open}'`],
      ['count', 'stack.Count', st.stack.length],
    ];
    $('vars').innerHTML = vars.map(([key, name, value]) =>
      `<div class="var${changed.has(key) ? ' changed' : ''}"><dt>${name}</dt><dd>${value}</dd></div>`).join('');

    Object.keys(codeLines).forEach((id) => codeLines[id].classList.toggle('hl', st.lines.includes(id)));

    const [tagText, tagKind] = TAGS[st.kind];
    $('step-count').textContent = `Adım ${idx + 1} / ${steps.length}`;
    $('step-tag').textContent = tagText;
    $('step-tag').dataset.kind = tagKind;
    $('step-text').innerHTML = st.text;
    $('prev').disabled = idx === 0;
    $('reset').disabled = idx === 0;
    $('next').disabled = idx === steps.length - 1;

    document.querySelectorAll('.presets button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.s === text)));
  }

  $('next').addEventListener('click', () => { if (idx < steps.length - 1) { idx++; render(); } });
  $('prev').addEventListener('click', () => { if (idx > 0) { idx--; render(); } });
  $('reset').addEventListener('click', () => { idx = 0; render(); });
  document.querySelectorAll('.presets button').forEach((b) => b.addEventListener('click', () => {
    $('text').value = b.dataset.s;
    $('text-err').hidden = true;
    restart(b.dataset.s);
  }));
  $('text').addEventListener('input', (e) => {
    const s = e.target.value.replace(/\s+/g, '');
    if (!VALID.test(s)) { $('text-err').hidden = false; return; }
    $('text-err').hidden = true;
    restart(s);
  });
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next').click();
    else if (e.key === 'ArrowLeft') $('prev').click();
  });

  restart(text);
})();
