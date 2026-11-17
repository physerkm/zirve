(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_LEN = 6;

  function buildSteps(a, b) {
    const steps = [];
    let i = 0;
    let j = 0;
    const merged = [];

    const snap = (s) => steps.push({
      a, b, i, j,
      merged: merged.slice(),
      changed: [],
      ...s,
    });

    snap({
      kind: 'start',
      lines: ['dummy', 'tail'],
      changed: ['tail'],
      text: `<code>dummy</code> düğümü oluşturuldu ve <code>tail = dummy</code> olarak ayarlandı. İki listenin başındaki düğümleri karşılaştırmaya hazırız.`,
    });

    while (i < a.length && j < b.length) {
      if (a[i] <= b[j]) {
        const val = a[i];
        merged.push({ src: 1, idx: i, val });
        i++;
        snap({
          kind: 'pick1',
          lines: ['while', 'if', 't1', 'l1', 'adv'],
          changed: ['l1', 'tail'],
          text: `<code>list1.val (${val}) &lt;= list2.val (${b[j]})</code>. <code>list1</code>'deki <b>${val}</b> düğümü <code>tail.next</code>'e bağlandı; <code>list1</code> ve <code>tail</code> birer adım ilerledi.`,
        });
      } else {
        const val = b[j];
        merged.push({ src: 2, idx: j, val });
        j++;
        snap({
          kind: 'pick2',
          lines: ['while', 'if', 'else', 't2', 'l2', 'adv'],
          changed: ['l2', 'tail'],
          text: `<code>list1.val (${a[i]}) &gt; list2.val (${val})</code>. <code>list2</code>'deki <b>${val}</b> düğümü <code>tail.next</code>'e bağlandı; <code>list2</code> ve <code>tail</code> birer adım ilerledi.`,
        });
      }
    }

    const rem1 = a.length - i;
    const rem2 = b.length - j;
    while (i < a.length) {
      merged.push({ src: 1, idx: i, val: a[i] });
      i++;
    }
    while (j < b.length) {
      merged.push({ src: 2, idx: j, val: b[j] });
      j++;
    }

    snap({
      kind: 'rest',
      lines: ['while', 'rest'],
      changed: ['next'],
      text: rem1 > 0
        ? `<code>list2 == null</code> oldu. <code>list1</code>'de kalan ${rem1} düğüm zaten sıralı olduğu için <code>tail.next = list1 ?? list2</code> ile tek seferde sona bağlandı.`
        : rem2 > 0
        ? `<code>list1 == null</code> oldu. <code>list2</code>'de kalan ${rem2} düğüm zaten sıralı olduğu için <code>tail.next = list1 ?? list2</code> ile tek seferde sona bağlandı.`
        : `İki liste de boşaldı; <code>tail.next = null</code>.`,
    });

    snap({
      kind: 'done',
      lines: ['ret'],
      text: `<code>return dummy.next</code> → birleşmiş sıralı liste: <b>[${merged.map((m) => m.val).join(' → ') || 'boş'}]</b>.`,
    });

    return steps;
  }

  const CODE = [
    ['dummy', '<span class="kw">var</span> dummy = <span class="kw">new</span> ListNode();'],
    ['tail', '<span class="kw">var</span> tail = dummy;'],
    ['', ''],
    ['while', '<span class="kw">while</span> (list1 != <span class="kw">null</span> &amp;&amp; list2 != <span class="kw">null</span>)'],
    ['', '{'],
    ['if', '    <span class="kw">if</span> (list1.val &lt;= list2.val)'],
    ['', '    {'],
    ['t1', '        tail.next = list1;'],
    ['l1', '        list1 = list1.next;'],
    ['', '    }'],
    ['else', '    <span class="kw">else</span>'],
    ['', '    {'],
    ['t2', '        tail.next = list2;'],
    ['l2', '        list2 = list2.next;'],
    ['', '    }'],
    ['', ''],
    ['adv', '    tail = tail.next;'],
    ['', '}'],
    ['', ''],
    ['rest', 'tail.next = list1 ?? list2;'],
    ['ret', '<span class="kw">return</span> dummy.next;'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Başlangıç', ''],
    pick1: ['list1 seçildi', ''],
    pick2: ['list2 seçildi', ''],
    rest: ['Kalanı bağla', ''],
    done: ['Bitti', 'ok'],
  };

  let l1Text = '1, 2, 4';
  let l2Text = '1, 3, 4';
  let steps = [];
  let idx = 0;
  let timer = null;

  function parseOne(raw) {
    const parts = raw.split(/[\s,]+/).filter(Boolean);
    if (parts.length > MAX_LEN) return null;
    const nums = parts.map(Number);
    if (!nums.every((v) => Number.isInteger(v) && v >= -99 && v <= 99)) return null;
    for (let k = 1; k < nums.length; k++) {
      if (nums[k] < nums[k - 1]) return null;
    }
    return nums;
  }

  function renderInputRow(title, arr, ptr, curCls) {
    let html = `<span class="row-title">${title}</span>`;
    arr.forEach((v, k) => {
      const used = k < ptr;
      const isCur = k === ptr;
      let cls = 'node';
      if (used) cls += ' used';
      if (isCur) cls += ' ' + curCls;
      const sub = isCur ? `<small>${title}</small>` : '';
      html += `<div class="node-wrap"><div class="${cls}">${v}${sub}</div><span class="arrow">→</span></div>`;
    });
    html += `<span class="null-lbl">null${ptr >= arr.length ? ` (${title})` : ''}</span>`;
    return html;
  }

  function renderMergedRow(st) {
    let html = `<span class="row-title">zincir</span>`;
    const isTailDummy = st.merged.length === 0;
    html += `<div class="node-wrap"><div class="node dummy${isTailDummy ? ' tail' : ''}">dummy${isTailDummy ? '<small>tail</small>' : ''}</div><span class="arrow">→</span></div>`;
    st.merged.forEach((m, k) => {
      const isTail = (st.kind !== 'rest' && st.kind !== 'done' && k === st.merged.length - 1);
      const cls = 'node merged' + (isTail ? ' tail' : '');
      const sub = isTail ? '<small>tail</small>' : `<small>L${m.src}</small>`;
      html += `<div class="node-wrap"><div class="${cls}">${m.val}${sub}</div><span class="arrow">→</span></div>`;
    });
    html += `<span class="null-lbl">null</span>`;
    return html;
  }

  function render() {
    const st = steps[idx];

    $('row-l1').innerHTML = renderInputRow('list1', st.a, st.i, 'cur1');
    $('row-l2').innerHTML = renderInputRow('list2', st.b, st.j, 'cur2');
    $('row-merged').innerHTML = renderMergedRow(st);

    const l1Val = st.i < st.a.length ? st.a[st.i] : 'null';
    const l2Val = st.j < st.b.length ? st.b[st.j] : 'null';
    const tailVal = st.merged.length === 0 ? 'dummy' : st.merged[st.merged.length - 1].val;
    const headVal = st.merged.length === 0 ? 'null' : st.merged[0].val;

    const vars = [
      ['list1', l1Val, 'l1'],
      ['list2', l2Val, 'l2'],
      ['tail', tailVal, 'tail'],
      ['dummy.next', headVal, 'next'],
    ];
    $('vars').innerHTML = vars.map(([name, v, key]) =>
      `<div class="var${st.changed.includes(key) ? ' changed' : ''}"><dt>${name}</dt><dd>${v}</dd></div>`
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
      b.setAttribute('aria-pressed', String(b.dataset.l1 === l1Text && b.dataset.l2 === l2Text))
    );
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Oynat';
  }

  function restart(t1, t2, a, b) {
    stop();
    l1Text = t1;
    l2Text = t2;
    steps = buildSteps(a, b);
    idx = 0;
    render();
  }

  function onInputChange() {
    const a = parseOne($('list1').value);
    const b = parseOne($('list2').value);
    if (!a || !b) { $('list-err').hidden = false; return; }
    $('list-err').hidden = true;
    restart($('list1').value, $('list2').value, a, b);
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
    $('list1').value = b.dataset.l1;
    $('list2').value = b.dataset.l2;
    $('list-err').hidden = true;
    restart(b.dataset.l1, b.dataset.l2, parseOne(b.dataset.l1), parseOne(b.dataset.l2));
  }));
  $('list1').addEventListener('input', onInputChange);
  $('list2').addEventListener('input', onInputChange);
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(l1Text, l2Text, parseOne(l1Text), parseOne(l2Text));
})();
