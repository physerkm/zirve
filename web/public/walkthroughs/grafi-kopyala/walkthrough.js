(() => {
  const $ = (id) => document.getElementById(id);

  const PRESETS = [
    {
      adj: [[2, 4], [1, 3], [2, 4], [1, 3]],
      pos: [{ x: 80, y: 50 }, { x: 220, y: 50 }, { x: 220, y: 160 }, { x: 80, y: 160 }],
    },
    {
      adj: [[2, 3], [1, 3], [1, 2]],
      pos: [{ x: 150, y: 40 }, { x: 230, y: 165 }, { x: 70, y: 165 }],
    },
    {
      adj: [[2, 3, 4], [1], [1], [1]],
      pos: [{ x: 150, y: 105 }, { x: 150, y: 30 }, { x: 235, y: 165 }, { x: 65, y: 165 }],
    },
    {
      adj: [[]],
      pos: [{ x: 150, y: 105 }],
    },
  ];

  function buildSteps(adj) {
    const steps = [];
    const clonedNodes = []; // values 1..n in order cloned
    const clonedEdges = []; // [{from, to}] directed neighbor links added on copies
    const stack = [];

    const snap = (s) => steps.push({
      clonedNodes: clonedNodes.slice(),
      clonedEdges: clonedEdges.map((e) => ({ ...e })),
      stack: stack.slice(),
      cur: undefined,
      nei: undefined,
      hitMap: undefined,
      changed: [],
      ...s,
    });

    snap({
      kind: 'start',
      lines: ['map', 'startcall'],
      text: `<code>oldToNew</code> sözlüğü boş olarak oluşturuldu. Kök düğüm olan <code>1</code> numaralı düğüm için <code>Dfs(node_1)</code> çağrılıyor.`,
    });

    function dfs(u) {
      stack.push(u);

      if (clonedNodes.includes(u)) {
        snap({
          kind: 'hit',
          cur: u,
          hitMap: u,
          lines: ['enter', 'check', 'retexist'],
          changed: ['node'],
          text: `<code>Dfs(${u})</code>: <code>${u}</code> numaralı düğüm <code>oldToNew</code> sözlüğünde <b>zaten var!</b> Yeniden oluşturmadan mevcut <code>${u}'</code> kopyası döndürülüyor.`,
        });
        stack.pop();
        return;
      }

      clonedNodes.push(u);
      snap({
        kind: 'create',
        cur: u,
        lines: ['enter', 'check', 'copy', 'put'],
        changed: ['node', 'oldToNew'],
        text: `<code>Dfs(${u})</code>: <code>${u}</code> sözlükte yok. Yeni kopya düğüm <code>${u}'</code> oluşturuldu ve <code>oldToNew[${u}] = ${u}'</code> olarak kaydedildi.`,
      });

      const neighbors = adj[u - 1];
      for (let i = 0; i < neighbors.length; i++) {
        const v = neighbors[i];
        snap({
          kind: 'visit',
          cur: u,
          nei: v,
          lines: ['for', 'addnei'],
          changed: ['nei'],
          text: `<code>${u}</code> düğümünün komşusu <code>nei = ${v}</code> inceleniyor: <code>Dfs(${v})</code> çağrılıyor.`,
        });

        dfs(v);

        clonedEdges.push({ from: u, to: v });
        snap({
          kind: 'link',
          cur: u,
          nei: v,
          lines: ['addnei'],
          changed: [],
          text: `<code>Dfs(${v})</code> çağrısından dönen <code>${v}'</code> kopyası, <code>${u}'</code> düğümünün <code>neighbors</code> listesine eklendi.`,
        });
      }

      snap({
        kind: 'ret',
        cur: u,
        lines: ['retcopy'],
        changed: [],
        text: `<code>${u}</code> düğümünün tüm komşuları kopyalandı. <code>return copy</code> ile <code>${u}'</code> döndürülüyor.`,
      });
      stack.pop();
    }

    dfs(1);

    snap({
      kind: 'done',
      lines: ['retcopy'],
      text: `Grafın derin kopyası tamamlandı! Tüm <b>${clonedNodes.length}</b> düğüm ve komşuluk bağları yeni nesnelerle birebir kuruldu.`,
    });

    return steps;
  }

  const CODE = [
    ['map', '<span class="kw">var</span> oldToNew = <span class="kw">new</span> Dictionary&lt;Node, Node&gt;();'],
    ['', ''],
    ['enter', 'Node Dfs(Node node)'],
    ['', '{'],
    ['check', '    <span class="kw">if</span> (oldToNew.TryGetValue(node, <span class="kw">out var</span> existing))'],
    ['retexist', '        <span class="kw">return</span> existing;'],
    ['', ''],
    ['copy', '    <span class="kw">var</span> copy = <span class="kw">new</span> Node(node.val);'],
    ['put', '    oldToNew[node] = copy;'],
    ['', ''],
    ['for', '    <span class="kw">foreach</span> (<span class="kw">var</span> nei <span class="kw">in</span> node.neighbors)'],
    ['addnei', '        copy.neighbors.Add(Dfs(nei));'],
    ['', ''],
    ['retcopy', '    <span class="kw">return</span> copy;'],
    ['', '}'],
    ['startcall', '<span class="kw">return</span> Dfs(nodes[0]);'],
  ];

  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Başlangıç', ''],
    create: ['Yeni Kopya', ''],
    visit: ['Komşuya Git', ''],
    hit: ['Sözlükte Var!', 'skip'],
    link: ['Bağlantı Kur', ''],
    ret: ['Geri Dön', ''],
    done: ['Tamamlandı', 'ok'],
  };

  let presetIdx = 0;
  let steps = [];
  let idx = 0;
  let timer = null;

  function drawOrigSvg(preset, st) {
    const { adj, pos } = preset;
    let lines = '';
    for (let i = 0; i < adj.length; i++) {
      const u = i + 1;
      for (const v of adj[i]) {
        if (u < v) {
          const p1 = pos[u - 1];
          const p2 = pos[v - 1];
          const active = (st.cur === u && st.nei === v) || (st.cur === v && st.nei === u);
          const stroke = active ? 'var(--probe)' : 'var(--line)';
          const width = active ? 3.5 : 2;
          lines += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${stroke}" stroke-width="${width}" />`;
        }
      }
    }
    let circles = '';
    for (let i = 0; i < adj.length; i++) {
      const u = i + 1;
      const p = pos[i];
      const isCur = st.cur === u;
      const isNei = st.nei === u;
      const isCloned = st.clonedNodes.includes(u);
      let fill = isCur ? 'var(--range)' : isCloned ? 'var(--good-soft)' : 'var(--surface)';
      let stroke = isCur ? 'var(--accent)' : isNei ? 'var(--probe)' : isCloned ? 'var(--good)' : 'var(--line)';
      let textFill = isCur ? 'var(--range-ink)' : isCloned ? 'var(--good-soft-ink)' : 'var(--ink)';
      circles += `<g><circle cx="${p.x}" cy="${p.y}" r="22" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/><text x="${p.x}" y="${p.y + 5}" text-anchor="middle" fill="${textFill}" font-family="var(--font-mono)" font-weight="700" font-size="15">${u}</text></g>`;
    }
    return lines + circles;
  }

  function drawCloneSvg(preset, st) {
    const { pos } = preset;
    let lines = '';
    const drawnPairs = new Set();
    for (const e of st.clonedEdges) {
      const key = `${Math.min(e.from, e.to)}-${Math.max(e.from, e.to)}`;
      const bothWays = st.clonedEdges.some((x) => x.from === e.to && x.to === e.from);
      if (drawnPairs.has(key)) continue;
      drawnPairs.add(key);
      const p1 = pos[e.from - 1];
      const p2 = pos[e.to - 1];
      const stroke = bothWays ? 'var(--good)' : 'var(--accent)';
      const dash = bothWays ? '' : 'stroke-dasharray="5,4"';
      lines += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${stroke}" stroke-width="2.5" ${dash} />`;
    }
    let circles = '';
    for (const u of st.clonedNodes) {
      const p = pos[u - 1];
      const isHit = st.hitMap === u;
      const stroke = isHit ? 'var(--probe)' : 'var(--good)';
      circles += `<g><circle cx="${p.x}" cy="${p.y}" r="22" fill="var(--good-soft)" stroke="${stroke}" stroke-width="2.5"/><text x="${p.x}" y="${p.y + 5}" text-anchor="middle" fill="var(--good-soft-ink)" font-family="var(--font-mono)" font-weight="700" font-size="14">${u}'</text></g>`;
    }
    if (st.clonedNodes.length === 0) {
      circles = `<text x="150" y="110" text-anchor="middle" fill="var(--muted)" font-family="var(--font-mono)" font-size="13">Henüz düğüm kopyalanmadı</text>`;
    }
    return lines + circles;
  }

  function render() {
    const st = steps[idx];
    const preset = PRESETS[presetIdx];

    $('orig-svg').innerHTML = drawOrigSvg(preset, st);
    $('clone-svg').innerHTML = drawCloneSvg(preset, st);

    $('map-row').innerHTML = st.clonedNodes.length === 0
      ? '<span class="empty-note">boş</span>'
      : st.clonedNodes.map((u) => `<span class="mini${st.hitMap === u ? ' hit' : ''}">${u} → ${u}'</span>`).join('');

    $('stack-row').innerHTML = st.stack.length === 0
      ? '<span class="empty-note">boş</span>'
      : st.stack.map((u, i) => `<span class="mini${i === st.stack.length - 1 ? ' now' : ''}">Dfs(${u})</span>`).join('');

    const vars = [
      ['node', st.cur !== undefined ? `Node(${st.cur})` : undefined],
      ['nei', st.nei !== undefined ? `Node(${st.nei})` : undefined],
      ['oldToNew.Count', st.clonedNodes.length],
    ];
    $('vars').innerHTML = vars.map(([name, v]) =>
      `<div class="var${st.changed.includes(name) ? ' changed' : ''}"><dt>${name}</dt><dd>${v === undefined ? '—' : v}</dd></div>`
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

    document.querySelectorAll('.presets button').forEach((b) => {
      b.setAttribute('aria-pressed', String(Number(b.dataset.p) === presetIdx));
    });
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Oynat';
  }

  function restart(pIdx) {
    stop();
    presetIdx = pIdx;
    steps = buildSteps(PRESETS[presetIdx].adj);
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
    }, 950);
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
