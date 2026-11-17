(() => {
  const $ = (id) => document.getElementById(id);

  const PRESETS = [
    { numCourses: 4, prerequisites: [[1, 0], [2, 0], [3, 1], [3, 2]] },
    { numCourses: 2, prerequisites: [[1, 0], [0, 1]] },
    { numCourses: 4, prerequisites: [[1, 0], [2, 1], [3, 2], [1, 3]] },
  ];

  function buildSteps({ numCourses, prerequisites }) {
    const adj = Array.from({ length: numCourses }, () => []);
    const indegree = new Array(numCourses).fill(0);
    for (const [course, pre] of prerequisites) {
      adj[pre].push(course);
      indegree[course]++;
    }

    const queue = [];
    const doneSet = new Set();
    const steps = [];
    let cur = undefined;
    let next = undefined;
    let completed = 0;

    const snap = (s) => steps.push({
      numCourses,
      adj: adj.map((a) => a.slice()),
      indegree: indegree.slice(),
      queue: queue.slice(),
      done: Array.from(doneSet),
      cur,
      next,
      completed,
      changed: [],
      ...s,
    });

    for (let i = 0; i < numCourses; i++) {
      if (indegree[i] === 0) queue.push(i);
    }

    snap({
      kind: 'start',
      lines: ['build', 'enq-zero'],
      changed: ['completed', 'queue.Count'],
      text: `Komşuluk listesi ve <code>indegree</code> dizisi kuruldu. Ön koşulu olmayan (<code>indegree == 0</code>) dersler kuyruğa eklendi: <code>${queue.length ? queue.join(', ') : 'yok'}</code>.`,
    });

    while (queue.length > 0) {
      cur = queue.shift();
      next = undefined;
      completed++;
      doneSet.add(cur);

      snap({
        kind: 'deq',
        lines: ['while', 'deq', 'inc-comp'],
        changed: ['cur', 'completed', 'queue.Count'],
        text: `Kuyruktan <code>cur = ${cur}</code> dersi çıkarıldı ve tamamlandı: <code>completed = ${completed}</code>.`,
      });

      for (const nx of adj[cur]) {
        next = nx;
        indegree[nx]--;
        const unlocked = indegree[nx] === 0;
        if (unlocked) queue.push(nx);

        snap({
          kind: unlocked ? 'unlock' : 'dec',
          lines: unlocked ? ['foreach', 'dec', 'if-zero', 'enq-next'] : ['foreach', 'dec', 'if-zero'],
          changed: unlocked ? ['next', 'indegree[next]', 'queue.Count'] : ['next', 'indegree[next]'],
          text: `<code>${cur} → ${nx}</code> kenarı işlendi: <code>indegree[${nx}]</code> değeri <code>${indegree[nx]}</code> oldu.` +
            (unlocked ? ` Ön koşulu kalmadığı için <code>${nx}</code> kuyruğa eklendi!` : ` Hâlâ ${indegree[nx]} ön koşulu var.`),
        });
      }
    }

    cur = undefined;
    next = undefined;
    const ok = completed === numCourses;
    snap({
      kind: ok ? 'done-ok' : 'done-bad',
      lines: ['ret'],
      changed: [],
      text: ok
        ? `Kuyruk bitti. <code>completed (${completed}) == numCourses (${numCourses})</code> olduğu için tüm dersler tamamlanabilir → <b>true</b>.`
        : `Kuyruk bitti ama <code>completed (${completed}) != numCourses (${numCourses})</code>! Döngüde kalan dersler alınamadı → <b>false</b>.`,
    });

    return steps;
  }

  const CODE = [
    ['build', '<span class="kw">foreach</span> (<span class="kw">int</span>[] e <span class="kw">in</span> prerequisites) { adj[e[1]].Add(e[0]); indegree[e[0]]++; }'],
    ['enq-zero', '<span class="kw">for</span> (<span class="kw">int</span> i = 0; i &lt; numCourses; i++) <span class="kw">if</span> (indegree[i] == 0) queue.Enqueue(i);'],
    ['', ''],
    ['while', '<span class="kw">while</span> (queue.Count &gt; 0)'],
    ['', '{'],
    ['deq', '    <span class="kw">int</span> cur = queue.Dequeue();'],
    ['inc-comp', '    completed++;'],
    ['foreach', '    <span class="kw">foreach</span> (<span class="kw">int</span> next <span class="kw">in</span> adj[cur])'],
    ['', '    {'],
    ['dec', '        indegree[next]--;'],
    ['if-zero', '        <span class="kw">if</span> (indegree[next] == 0)'],
    ['enq-next', '            queue.Enqueue(next);'],
    ['', '    }'],
    ['', '}'],
    ['ret', '<span class="kw">return</span> completed == numCourses;'],
  ];

  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Başlangıç', ''],
    deq: ['Ders Tamamla', ''],
    dec: ['Ön Koşul Azalt', 'skip'],
    unlock: ['Kilit Açıldı', 'ok'],
    'done-ok': ['Sonuç: true', 'ok'],
    'done-bad': ['Döngü Var: false', 'bad'],
  };

  let presetIdx = 0;
  let steps = [];
  let idx = 0;
  let timer = null;

  function render() {
    const st = steps[idx];

    let nodesHtml = '';
    for (let i = 0; i < st.numCourses; i++) {
      let state = 'locked';
      if (st.done.includes(i)) state = 'done';
      else if (st.queue.includes(i)) state = 'ready';
      else if (st.kind === 'done-bad') state = 'stuck';

      let cls = 'node-card';
      if (st.cur === i) cls += ' cur';
      if (st.next === i) cls += ' probe';

      const outs = st.adj[i].length ? st.adj[i].map((x) => `${i}→${x}`).join(', ') : 'çıkış yok';
      nodesHtml += `<div class="${cls}" data-state="${state}">
        <div class="top"><span class="id">Ders ${i}</span><span class="indeg">in: ${st.indegree[i]}</span></div>
        <div class="edges">${outs}</div>
      </div>`;
    }
    $('nodes-row').innerHTML = nodesHtml;

    $('queue-row').innerHTML = st.queue.length === 0
      ? '<span class="empty-note">Kuyruk boş</span>'
      : st.queue.map((v, i) => `<span class="mini${i === 0 ? ' now' : ''}">${v}</span>`).join('');

    const vars = [
      ['cur', st.cur === undefined ? '—' : st.cur],
      ['next', st.next === undefined ? '—' : st.next],
      ['completed', `${st.completed} / ${st.numCourses}`],
      ['queue.Count', st.queue.length],
    ];
    $('vars').innerHTML = vars.map(([name, v]) =>
      `<div class="var${st.changed.includes(name) ? ' changed' : ''}"><dt>${name}</dt><dd>${v}</dd></div>`
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
      b.setAttribute('aria-pressed', String(Number(b.dataset.p) === presetIdx))
    );
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Oynat';
  }

  function loadPreset(p) {
    stop();
    presetIdx = p;
    steps = buildSteps(PRESETS[p]);
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

  document.querySelectorAll('.presets button').forEach((b) =>
    b.addEventListener('click', () => loadPreset(Number(b.dataset.p)))
  );

  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  loadPreset(0);
})();
