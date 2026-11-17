(() => {
  const $ = (id) => document.getElementById(id);

  function buildTreeSlots(arr) {
    const slots = new Array(7).fill(null);
    if (!arr || arr.length === 0 || arr[0] === null) return slots;
    slots[0] = arr[0];
    const q = [0];
    let idx = 1;
    while (q.length > 0 && idx < arr.length) {
      const p = q.shift();
      const l = 2 * p + 1;
      const r = 2 * p + 2;
      if (idx < arr.length) {
        if (arr[idx] !== null && l < 7) {
          slots[l] = arr[idx];
          q.push(l);
        }
        idx++;
      }
      if (idx < arr.length) {
        if (arr[idx] !== null && r < 7) {
          slots[r] = arr[idx];
          q.push(r);
        }
        idx++;
      }
    }
    return slots;
  }

  function buildSteps(slots) {
    const steps = [];
    let maxSum = '-∞';
    let maxVal = -Infinity;
    let bestApex = -1;
    const gains = {};
    const done = new Set();

    const snap = (s) => steps.push({
      active: null,
      nodeVal: undefined,
      leftGain: undefined,
      rightGain: undefined,
      maxSum,
      bestApex,
      gains: { ...gains },
      done: new Set(done),
      changed: [],
      ...s,
    });

    snap({
      kind: 'start',
      lines: ['init', 'call'],
      changed: ['_maxSum'],
      text: '<code>_maxSum = int.MinValue</code> ile başlatılır ve <code>Dfs(root)</code> çağrısıyla kök düğümden aşağıya inilir.',
    });

    function dfs(i) {
      if (i >= 7 || slots[i] === null) return 0;
      const val = slots[i];

      snap({
        kind: 'enter',
        active: i,
        nodeVal: val,
        lines: ['dfs', 'null'],
        changed: ['node.val'],
        text: `Düğüm <b>${val}</b> ziyaret ediliyor. Önce sol ve sağ alt ağaçların maksimum dal katkıları hesaplanacak.`,
      });

      const rawLeft = dfs(2 * i + 1);
      const rawRight = dfs(2 * i + 2);
      const left = Math.max(0, rawLeft);
      const right = Math.max(0, rawRight);

      const cutNote = (rawLeft < 0 || rawRight < 0)
        ? ` Negatif alt dal katkısı <code>Math.Max(0, ...)</code> ile sıfırlandı.`
        : '';

      snap({
        kind: (rawLeft < 0 || rawRight < 0) ? 'cut' : 'calc',
        active: i,
        nodeVal: val,
        leftGain: left,
        rightGain: right,
        lines: ['left', 'right'],
        changed: ['left', 'right'],
        text: `Düğüm <b>${val}</b> için <code>left = Math.Max(0, ${rawLeft}) = ${left}</code> ve <code>right = Math.Max(0, ${rawRight}) = ${right}</code>.${cutNote}`,
      });

      const arch = val + left + right;
      const isNewBest = arch > maxVal;
      if (isNewBest) {
        maxVal = arch;
        maxSum = arch;
        bestApex = i;
      }

      const ret = val + Math.max(left, right);
      gains[i] = ret;
      done.add(i);

      snap({
        kind: isNewBest ? 'best' : 'ret',
        active: i,
        nodeVal: val,
        leftGain: left,
        rightGain: right,
        lines: ['max', 'ret'],
        changed: isNewBest ? ['_maxSum'] : [],
        text: `Düğüm <b>${val}</b> tepe noktası olduğunda kemer toplamı: <code>${val} + ${left} + ${right} = ${arch}</code>. ` +
          (isNewBest ? `Yeni global maksimum: <code>_maxSum = ${maxSum}</code>! ` : `<code>_maxSum</code> (${maxSum}) değişmedi. `) +
          `Yukarıya tek dal döner: <code>${val} + Math.Max(${left}, ${right}) = ${ret}</code>.`,
      });

      return ret;
    }

    dfs(0);

    snap({
      kind: 'done',
      lines: ['ans'],
      text: `Tüm düğümler gezildi. En yüksek yol toplamı <code>_maxSum = ${maxSum}</code> olarak döndürülür.`,
    });

    return steps;
  }

  const K = (w) => `<span class="kw">${w}</span>`;
  const CODE = [
    ['', `${K('public')} ${K('int')} MaxPathSum(TreeNode root)`],
    ['', '{'],
    ['init', `    _maxSum = ${K('int')}.MinValue;`],
    ['call', '    Dfs(root);'],
    ['ans', `    ${K('return')} _maxSum;`],
    ['', '}'],
    ['', ''],
    ['dfs', `${K('private')} ${K('int')} Dfs(TreeNode node)`],
    ['', '{'],
    ['null', `    ${K('if')} (node == ${K('null')}) ${K('return')} 0;`],
    ['left', `    ${K('int')} left = Math.Max(0, Dfs(node.left));`],
    ['right', `    ${K('int')} right = Math.Max(0, Dfs(node.right));`],
    ['max', '    _maxSum = Math.Max(_maxSum, node.val + left + right);'],
    ['ret', `    ${K('return')} node.val + Math.Max(left, right);`],
    ['', '}'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Başlangıç', ''],
    enter: ['DFS İniş', ''],
    calc: ['Alt Dallar', ''],
    cut: ['Negatif Dal Budandı', 'cut'],
    best: ['Yeni Maksimum!', 'ok'],
    ret: ['Yukarı Dönüş', ''],
    done: ['Tamamlandı', 'ok'],
  };

  let listText = '-10, 9, 20, null, null, 15, 7';
  let slots = [];
  let steps = [];
  let idx = 0;
  let timer = null;

  function parse(raw) {
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0 || parts.length > 7) return null;
    const out = [];
    for (const p of parts) {
      if (p.toLowerCase() === 'null') out.push(null);
      else {
        const n = Number(p);
        if (!Number.isInteger(n) || n < -999 || n > 999) return null;
        out.push(n);
      }
    }
    if (out[0] === null) return null;
    return out;
  }

  function renderTree(st) {
    const levels = [[0], [1, 2], [3, 4, 5, 6]];
    const maxLevel = slots.slice(3).some((v) => v !== null) ? 2 : slots.slice(1, 3).some((v) => v !== null) ? 1 : 0;
    let html = '';
    for (let lv = 0; lv <= maxLevel; lv++) {
      const indices = levels[lv];
      html += `<div class="t-row" style="grid-template-columns: repeat(${indices.length}, minmax(0, 1fr));">`;
      for (const i of indices) {
        const v = slots[i];
        if (v === null) {
          html += `<div class="t-cell"><span class="t-badge">null → 0</span><div class="chip ghost">null</div></div>`;
        } else {
          const hasGain = Object.prototype.hasOwnProperty.call(st.gains, i);
          const g = st.gains[i];
          const badgeCls = hasGain ? (g < 0 ? 't-badge neg' : 't-badge pos') : 't-badge';
          const badgeTxt = hasGain ? `↑ dal: ${g}${g < 0 ? ' (0 olur)' : ''}` : 'bekliyor';
          let state = 'plain';
          if (st.active === i) state = 'active';
          else if (st.bestApex === i) state = 'best';
          else if (st.done.has(i)) state = 'done';
          html += `<div class="t-cell"><span class="${badgeCls}">${badgeTxt}</span><div class="chip" data-state="${state}">${v}</div></div>`;
        }
      }
      html += '</div>';
    }
    return html;
  }

  function render() {
    const st = steps[idx];
    $('tree-view').innerHTML = renderTree(st);

    const vars = [
      ['node.val', st.nodeVal],
      ['left', st.leftGain],
      ['right', st.rightGain],
      ['_maxSum', st.maxSum],
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

    document.querySelectorAll('.presets button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.l === listText)));
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Oynat';
  }

  function restart(text, parsed) {
    stop();
    listText = text;
    slots = buildTreeSlots(parsed);
    steps = buildSteps(slots);
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
    $('list').value = b.dataset.l;
    $('list-err').hidden = true;
    restart(b.dataset.l, parse(b.dataset.l));
  }));
  $('list').addEventListener('input', (e) => {
    const parsed = parse(e.target.value);
    if (!parsed) { $('list-err').hidden = false; return; }
    $('list-err').hidden = true;
    restart(e.target.value, parsed);
  });
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(listText, parse(listText));
})();
