(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_LEN = 10;

  function buildSteps(vals) {
    const heap = vals.slice().sort((a, b) => b - a);
    const steps = [];
    let first;
    let second;
    let diff;
    let addedIndex = -1;

    const snap = (s) => steps.push({
      heap: heap.slice(),
      first,
      second,
      diff,
      addedIndex,
      changed: [],
      ...s,
    });

    snap({
      kind: 'start',
      lines: ['init', 'loop', 'enq'],
      changed: ['heap.Count'],
      text: `Bütün taşlar <code>-stone</code> önceliğiyle Max-Heap'e eklendi: <code>[${heap.join(', ')}]</code>. Toplam ${heap.length} taş var.`,
    });

    while (heap.length > 1) {
      first = heap.shift();
      second = heap.shift();
      diff = undefined;
      addedIndex = -1;

      snap({
        kind: 'pop',
        lines: ['while', 'deq1', 'deq2'],
        changed: ['first', 'second', 'heap.Count'],
        text: `En ağır iki taş çekildi: <code>first = ${first}</code> ve <code>second = ${second}</code>.`,
      });

      if (first > second) {
        diff = first - second;
        heap.push(diff);
        heap.sort((a, b) => b - a);
        addedIndex = heap.indexOf(diff);

        snap({
          kind: 'push',
          lines: ['if', 'diff', 'enqDiff'],
          changed: ['diff', 'heap.Count'],
          text: `<code>${first} &gt; ${second}</code> olduğu için geriye <code>diff = ${first} - ${second} = ${diff}</code> ağırlığında taş kalır ve heap'e geri eklenir.`,
        });
      } else {
        diff = 0;
        snap({
          kind: 'skip',
          lines: ['if'],
          changed: ['diff'],
          text: `<code>${first} == ${second}</code> olduğu için iki taş da tamamen parçalanır; heap'e yeni taş eklenmez.`,
        });
      }
    }

    first = undefined;
    second = undefined;
    diff = undefined;
    addedIndex = -1;
    const ans = heap.length === 1 ? heap[0] : 0;

    snap({
      kind: 'done',
      lines: ['ret'],
      text: heap.length === 1
        ? `Döngü bitti: heap'te tek taş kaldı. <code>return ${ans}</code>.`
        : `Döngü bitti: heap tamamen boşaldı. <code>return 0</code>.`,
    });

    return steps;
  }

  const CODE = [
    ['init', 'PriorityQueue&lt;<span class="kw">int</span>, <span class="kw">int</span>&gt; heap = <span class="kw">new</span>();'],
    ['loop', '<span class="kw">foreach</span> (<span class="kw">int</span> stone <span class="kw">in</span> stones)'],
    ['enq', '    heap.Enqueue(stone, -stone);'],
    ['', ''],
    ['while', '<span class="kw">while</span> (heap.Count &gt; 1)'],
    ['', '{'],
    ['deq1', '    <span class="kw">int</span> first = heap.Dequeue();'],
    ['deq2', '    <span class="kw">int</span> second = heap.Dequeue();'],
    ['if', '    <span class="kw">if</span> (first &gt; second)'],
    ['', '    {'],
    ['diff', '        <span class="kw">int</span> diff = first - second;'],
    ['enqDiff', '        heap.Enqueue(diff, -diff);'],
    ['', '    }'],
    ['', '}'],
    ['ret', '<span class="kw">return</span> heap.Count == 1 ? heap.Dequeue() : 0;'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Başlangıç', ''],
    pop: ['İki taş çek', ''],
    push: ['Parça kaldı', ''],
    skip: ['İkisi de kırıldı', 'skip'],
    done: ['Bitti', 'ok'],
  };

  let listText = '2, 7, 4, 1, 8, 1';
  let steps = [];
  let idx = 0;
  let timer = null;

  function parse(raw) {
    const parts = raw.split(/[\s,]+/).filter(Boolean);
    if (parts.length === 0 || parts.length > MAX_LEN) return null;
    const out = parts.map(Number);
    return out.every((v) => Number.isInteger(v) && v >= 1 && v <= 1000) ? out : null;
  }

  function render() {
    const st = steps[idx];

    if (st.first === undefined) {
      $('arena').innerHTML = '<p class="empty-note">Henüz çarpışma yok.</p>';
    } else {
      const outcome = st.diff === undefined
        ? '<span class="arena-op">→ çarpışıyor…</span>'
        : st.diff > 0
          ? `<span class="arena-op">→ kalan:</span><div class="chip" data-state="new">${st.diff}</div>`
          : '<span class="arena-op">→ 0 (ikisi de yok oldu)</span>';
      $('arena').innerHTML =
        `<div class="chip" data-state="top">${st.first}</div>` +
        `<span class="arena-op">×</span>` +
        `<div class="chip" data-state="top">${st.second}</div>` +
        outcome;
    }

    if (st.heap.length === 0) {
      $('heap-line').innerHTML = '<p class="empty-note">Heap boş (0 taş).</p>';
    } else {
      $('heap-line').innerHTML = st.heap.map((v, i) => {
        let state = 'plain';
        let tag = '';
        if (st.kind === 'done' && i === 0) {
          state = 'win';
          tag = '<span class="t-new">son taş</span>';
        } else if (i === st.addedIndex) {
          state = 'new';
          tag = '<span class="t-new">yeni</span>';
        } else if (i < 2 && st.heap.length > 1) {
          state = 'top';
          tag = `<span class="t-top">${i === 0 ? '1. ağır' : '2. ağır'}</span>`;
        }
        return `<div class="item"><div class="tags">${tag}</div><div class="chip" data-state="${state}">${v}</div></div>`;
      }).join('');
    }

    const vars = [
      ['heap.Count', st.heap.length],
      ['first', st.first],
      ['second', st.second],
      ['diff', st.diff],
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
    steps = buildSteps(parsed);
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
