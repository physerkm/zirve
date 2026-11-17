(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_LEN = 18;

  function validateInput(s) {
    if (!s || s.length > MAX_LEN) return false;
    let depth = 0;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === '[') {
        if (i === 0 || !(s[i - 1] >= '0' && s[i - 1] <= '9')) return false;
        depth++;
      } else if (ch === ']') {
        depth--;
        if (depth < 0) return false;
      } else if (ch >= '0' && ch <= '9') {
        // valid digit
      } else if (ch >= 'a' && ch <= 'z') {
        // valid letter
      } else {
        return false;
      }
    }
    return depth === 0;
  }

  function buildSteps(s) {
    const steps = [];
    const countStack = [];
    const stringStack = [];
    let current = '';
    let k = 0;

    const snap = (extra) => steps.push({
      countStack: countStack.slice(),
      stringStack: stringStack.slice(),
      current,
      k,
      pos: -1,
      ch: undefined,
      changed: [],
      ...extra,
    });

    snap({
      kind: 'start',
      lines: ['init'],
      changed: ['current', 'k'],
      text: `Başlangıçta <code>countStack</code> ve <code>stringStack</code> boş; <code>current = ""</code> ve <code>k = 0</code>.`,
    });

    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch >= '0' && ch <= '9') {
        const oldK = k;
        k = k * 10 + (ch.charCodeAt(0) - 48);
        snap({
          kind: 'digit',
          pos: i,
          ch,
          lines: ['foreach', 'if-digit', 'k-calc'],
          changed: ['ch', 'k'],
          text: `<code>ch = '${ch}'</code> bir rakam. <code>k = ${oldK} * 10 + ${ch} = ${k}</code> olarak güncelleniyor.`,
        });
      } else if (ch === '[') {
        const pushedK = k;
        const pushedStr = current;
        countStack.push(k);
        stringStack.push(current);
        current = '';
        k = 0;
        snap({
          kind: 'push',
          pos: i,
          ch,
          lines: ['foreach', 'if-open', 'push-k', 'push-str', 'reset'],
          changed: ['ch', 'current', 'k'],
          text: `<code>ch = '['</code> görüldü. <code>${pushedK}</code> sayısı <code>countStack</code>'e, <code>"${pushedStr}"</code> dizgisi <code>stringStack</code>'e itildi; <code>current = ""</code> ve <code>k = 0</code> sıfırlandı.`,
        });
      } else if (ch === ']') {
        const repeat = countStack.pop();
        const prev = stringStack.pop();
        const inner = current;
        current = prev + inner.repeat(repeat);
        snap({
          kind: 'pop',
          pos: i,
          ch,
          lines: ['foreach', 'if-close', 'pop-both', 'append-loop', 'assign-cur'],
          changed: ['ch', 'current'],
          text: `<code>ch = ']'</code> görüldü. Yığınlardan <code>repeat = ${repeat}</code> ve <code>prev = "${prev}"</code> çekildi. İç dizgi <code>"${inner}"</code> ${repeat} kez tekrarlanıp eklendi: <code>current = "${current}"</code>.`,
        });
      } else {
        current += ch;
        snap({
          kind: 'char',
          pos: i,
          ch,
          lines: ['foreach', 'else-char', 'append-ch'],
          changed: ['ch', 'current'],
          text: `<code>ch = '${ch}'</code> normal bir harf; doğrudan <code>current</code> sonuna eklendi → <code>"${current}"</code>.`,
        });
      }
    }

    snap({
      kind: 'done',
      pos: s.length,
      lines: ['ret'],
      text: `Tüm karakterler işlendi. Çözülmüş sonuç döndürülüyor: <code>"${current}"</code>.`,
    });

    return steps;
  }

  const CODE = [
    ['init', 'Stack&lt;<span class="kw">int</span>&gt; countStack = <span class="kw">new</span>(); Stack&lt;StringBuilder&gt; stringStack = <span class="kw">new</span>();'],
    ['init', 'StringBuilder current = <span class="kw">new</span>(); <span class="kw">int</span> k = 0;'],
    ['', ''],
    ['foreach', '<span class="kw">foreach</span> (<span class="kw">char</span> ch <span class="kw">in</span> s)'],
    ['', '{'],
    ['if-digit', '    <span class="kw">if</span> (<span class="kw">char</span>.IsDigit(ch))'],
    ['k-calc', '        k = k * 10 + (ch - \'0\');'],
    ['if-open', '    <span class="kw">else if</span> (ch == \'[\')'],
    ['', '    {'],
    ['push-k', '        countStack.Push(k);'],
    ['push-str', '        stringStack.Push(current);'],
    ['reset', '        current = <span class="kw">new</span> StringBuilder(); k = 0;'],
    ['', '    }'],
    ['if-close', '    <span class="kw">else if</span> (ch == \']\')'],
    ['', '    {'],
    ['pop-both', '        <span class="kw">int</span> repeat = countStack.Pop(); StringBuilder prev = stringStack.Pop();'],
    ['append-loop', '        <span class="kw">for</span> (<span class="kw">int</span> i = 0; i &lt; repeat; i++) prev.Append(current);'],
    ['assign-cur', '        current = prev;'],
    ['', '    }'],
    ['else-char', '    <span class="kw">else</span>'],
    ['append-ch', '        current.Append(ch);'],
    ['', '}'],
    ['ret', '<span class="kw">return</span> current.ToString();'],
  ];

  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');

  const TAGS = {
    start: ['Başlangıç', ''],
    digit: ['Rakam', ''],
    push: ['Yığına İt ([)', ''],
    pop: ['Yığından Çek (])', ''],
    char: ['Harf Ekle', ''],
    done: ['Tamamlandı', 'ok'],
  };

  let curStr = '3[a2[c]]';
  let steps = [];
  let idx = 0;
  let timer = null;

  function render() {
    const st = steps[idx];

    $('chars-row').innerHTML = Array.from(curStr).map((c, i) => {
      let cls = 'mini';
      if (i === st.pos) cls += ' now';
      else if (i < st.pos) cls += ' done';
      return `<span class="${cls}">${c}</span>`;
    }).join('');

    $('count-stack').innerHTML = st.countStack.length === 0
      ? '<span class="empty-note">boş</span>'
      : st.countStack.map((v, i) => `<div class="chip${i === st.countStack.length - 1 ? ' top' : ''}">${v}</div>`).join('');

    $('string-stack').innerHTML = st.stringStack.length === 0
      ? '<span class="empty-note">boş</span>'
      : st.stringStack.map((v, i) => `<div class="chip${i === st.stringStack.length - 1 ? ' top' : ''}">"${v}"</div>`).join('');

    const vars = [
      ['ch', st.ch === undefined ? '—' : `'${st.ch}'`],
      ['k', st.k],
      ['current', `"${st.current}"`],
      ['Derinlik', st.countStack.length],
    ];
    $('vars').innerHTML = vars.map(([name, v]) =>
      `<div class="var${st.changed.includes(name) ? ' changed' : ''}"><dt>${name}</dt><dd>${v}</dd></div>`
    ).join('');

    document.querySelectorAll('.ln[data-id]').forEach((el) => {
      el.classList.toggle('hl', st.lines.includes(el.dataset.id));
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
      b.setAttribute('aria-pressed', String(b.dataset.s === curStr));
    });
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Oynat';
  }

  function restart(s) {
    stop();
    curStr = s;
    steps = buildSteps(s);
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
    }, 1000);
  });

  document.querySelectorAll('.presets button').forEach((b) => b.addEventListener('click', () => {
    $('input-str').value = b.dataset.s;
    $('str-err').hidden = true;
    restart(b.dataset.s);
  }));

  $('input-str').addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (!validateInput(val)) {
      $('str-err').hidden = false;
      return;
    }
    $('str-err').hidden = true;
    restart(val);
  });

  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(curStr);
})();
