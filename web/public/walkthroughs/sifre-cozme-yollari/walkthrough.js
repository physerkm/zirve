(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_LEN = 10;

  function buildSteps(s) {
    const n = s.length;
    const dp = new Array(n + 1).fill(null);
    dp[n] = 1;
    let next1 = 1;
    let next2 = 0;
    let i;
    let current;
    const steps = [];

    const snap = (extra) => steps.push({
      s, dp: dp.slice(), i, current, next1, next2,
      probeIdx: null, changed: [], ...extra,
    });

    snap({
      kind: 'start',
      lines: ['n1', 'n2'],
      changed: ['next1', 'next2'],
      text: `Baz durumu: boş sonek (<code>dp[${n}]</code>) için <code>next1 = 1</code>, <code>next2 = 0</code> ile sağdan sola başlıyoruz.`,
    });

    for (let idx = n - 1; idx >= 0; idx--) {
      i = idx;
      current = 0;

      if (s[i] === '0') {
        dp[i] = 0;
        snap({
          kind: 'skip',
          lines: ['for', 'cur', 'if1'],
          changed: ['i', 'current'],
          text: `<code>i = ${i}</code>, <code>s[${i}] = '0'</code>. Sıfır ile başlayan geçerli bir harf olamaz; <code>current = 0</code> kalır.`,
        });
      } else {
        const ch1 = String.fromCharCode(64 + Number(s[i]));
        current = next1;
        snap({
          kind: 'one',
          lines: ['for', 'cur', 'if1', 'set1'],
          changed: ['i', 'current'],
          text: `<code>i = ${i}</code>, <code>s[${i}] = '${s[i]}'</code> ('${ch1}'). Tek basamak geçerli: <code>current = next1</code> → <b>${current}</b>.`,
        });

        if (i + 1 < n) {
          const two = s.slice(i, i + 2);
          const validTwo = s[i] === '1' || (s[i] === '2' && s[i + 1] <= '6');
          if (validTwo) {
            const ch2 = String.fromCharCode(64 + Number(two));
            const before = current;
            current += next2;
            snap({
              kind: 'two',
              lines: ['if2', 'add2'],
              changed: ['current'],
              probeIdx: i + 1,
              text: `İki basamak kontrolü: <code>"${two}"</code> ('${ch2}') 10–26 aralığında. <code>current += next2</code> (${before} + ${next2}) → <b>${current}</b>.`,
            });
          } else {
            snap({
              kind: 'two-no',
              lines: ['if2'],
              changed: [],
              probeIdx: i + 1,
              text: `İki basamak kontrolü: <code>"${two}"</code> > 26 olduğu için tek bir harfe karşılık gelmez; <code>next2</code> eklenmez.`,
            });
          }
        }
      }

      dp[i] = current;
      next2 = next1;
      next1 = current;
      snap({
        kind: 'shift',
        lines: ['sh2', 'sh1'],
        changed: ['next1', 'next2'],
        text: `<code>dp[${i}] = ${current}</code> kaydedildi. Pencere sola kayıyor: <code>next2 = ${next2}</code>, <code>next1 = ${next1}</code>.`,
      });
    }

    i = undefined;
    current = undefined;
    snap({
      kind: 'done',
      lines: ['ret'],
      changed: [],
      text: `Tüm dizgi tarandı. <code>return next1</code> → <b>${next1}</b> farklı şifre çözme yolu bulundu.`,
    });

    return steps;
  }

  const CODE = [
    ['n1', '<span class="kw">int</span> next1 = 1;'],
    ['n2', '<span class="kw">int</span> next2 = 0;'],
    ['', ''],
    ['for', '<span class="kw">for</span> (<span class="kw">int</span> i = s.Length - 1; i &gt;= 0; i--)'],
    ['', '{'],
    ['cur', '    <span class="kw">int</span> current = 0;'],
    ['if1', '    <span class="kw">if</span> (s[i] != \'0\')'],
    ['', '    {'],
    ['set1', '        current = next1;'],
    ['if2', '        <span class="kw">if</span> (i + 1 &lt; s.Length &amp;&amp; (s[i] == \'1\' || (s[i] == \'2\' &amp;&amp; s[i + 1] &lt;= \'6\')))'],
    ['add2', '            current += next2;'],
    ['', '    }'],
    ['sh2', '    next2 = next1;'],
    ['sh1', '    next1 = current;'],
    ['', '}'],
    ['ret', '<span class="kw">return</span> next1;'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Başlangıç', ''],
    skip: ['Sıfır engeli', 'skip'],
    one: ['Tek basamak', ''],
    two: ['İki basamak geçerli', ''],
    'two-no': ['İki basamak > 26', ''],
    shift: ['Kaydır', ''],
    done: ['Tamamlandı', 'ok'],
  };

  let strText = '226';
  let steps = [];
  let idx = 0;
  let timer = null;

  function parse(raw) {
    const trimmed = raw.trim();
    if (trimmed.length < 1 || trimmed.length > MAX_LEN) return null;
    if (!/^[0-9]+$/.test(trimmed)) return null;
    return trimmed;
  }

  function renderLine(st) {
    const chars = st.s.split('');
    let html = '';
    for (let k = 0; k <= chars.length; k++) {
      const isBase = k === chars.length;
      const tags = [];
      if (k === st.i) tags.push('<span class="t-num">i</span>');
      if (k === st.probeIdx) tags.push('<span class="t-probe">i + 1</span>');

      let cls = 'chip';
      let state = 'plain';
      if (isBase) {
        state = 'done';
      } else if (st.dp[k] !== null) {
        state = chars[k] === '0' ? 'zero' : (st.kind === 'done' && k === 0 ? 'best' : 'done');
      }
      if (k === st.i) cls += ' cur';
      else if (k === st.probeIdx) cls += ' probe';

      const label = isBase ? '$' : chars[k];
      const dpVal = st.dp[k] === null ? '—' : st.dp[k];
      const badgeCls = st.dp[k] !== null ? 'dp-badge set' : 'dp-badge';

      html += `<div class="item">
        <div class="tags">${tags.join('')}</div>
        <div class="${cls}" data-state="${state}">
          <span>${label}</span>
          <span class="sub">[${k}]</span>
        </div>
        <div class="${badgeCls}">dp: ${dpVal}</div>
      </div>`;
    }
    return html;
  }

  function render() {
    const st = steps[idx];
    $('nline').innerHTML = renderLine(st);

    const vars = [
      ['i', st.i],
      ['current', st.current],
      ['next1', st.next1],
      ['next2', st.next2],
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

    document.querySelectorAll('.presets button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.s === strText)));
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Oynat';
  }

  function restart(val) {
    stop();
    strText = val;
    steps = buildSteps(val);
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
    $('str-input').value = b.dataset.s;
    $('str-err').hidden = true;
    restart(b.dataset.s);
  }));
  $('str-input').addEventListener('input', (e) => {
    const parsed = parse(e.target.value);
    if (!parsed) { $('str-err').hidden = false; return; }
    $('str-err').hidden = true;
    restart(parsed);
  });
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(strText);
})();
