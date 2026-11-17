(() => {
  const $ = (id) => document.getElementById(id);

  const PRESETS = [
    {
      beginWord: 'hit',
      endWord: 'cog',
      wordList: ['hot', 'dot', 'dog', 'lot', 'log', 'cog'],
    },
    {
      beginWord: 'hit',
      endWord: 'cog',
      wordList: ['hot', 'dot', 'dog', 'lot', 'log'],
    },
    {
      beginWord: 'red',
      endWord: 'tax',
      wordList: ['ted', 'tex', 'red', 'tax', 'tad', 'den', 'rex'],
    },
    {
      beginWord: 'hot',
      endWord: 'dog',
      wordList: ['hot', 'dog'],
    },
  ];

  function buildSteps(preset) {
    const { beginWord, endWord, wordList } = preset;
    const activeSet = new Set(wordList);
    const steps = [];
    const queue = [];
    const layers = [];
    const parentMap = {};
    let curWord;
    let stepNum = 1;
    let levelSize;
    let newWords = [];
    let bestPath = [];

    const snap = (s) => steps.push({
      wordList,
      endWord,
      remaining: new Set(activeSet),
      queue: queue.slice(),
      layers: layers.map((l) => l.slice()),
      curWord,
      stepNum,
      levelSize,
      newWords: newWords.slice(),
      bestPath: bestPath.slice(),
      changed: [],
      ...s,
    });

    if (!activeSet.has(endWord)) {
      snap({
        kind: 'fail',
        lines: ['set', 'ifEnd', 'ret0a'],
        text: `<code>wordSet</code> kuruldu: <code>{${wordList.join(', ')}}</code>. Ancak hedef kelime <code>"${endWord}"</code> sözlükte bulunmuyor! Dönüşüm imkânsız, hemen <code>0</code> döndürülür.`,
      });
      return steps;
    }

    queue.push(beginWord);
    activeSet.delete(beginWord);
    layers.push([{ word: beginWord, parent: null }]);

    snap({
      kind: 'start',
      lines: ['set', 'ifEnd', 'qInit', 'enqBegin', 'remBegin', 'stepsInit'],
      changed: ['steps'],
      text: `<code>"${endWord}"</code> sözlükte var. Başlangıç kelimesi <code>"${beginWord}"</code> kuyruğa eklendi ve tekrar ziyaret edilmemesi için kümeden silindi. <code>steps = 1</code>.`,
    });

    while (queue.length > 0) {
      levelSize = queue.length;
      const currentLayerIdx = stepNum - 1;
      newWords = [];

      snap({
        kind: 'level',
        lines: ['whileQ', 'lvlSize'],
        changed: ['levelSize'],
        text: `<b>Katman ${stepNum}</b> başlıyor. Kuyrukta bu katmana ait <code>levelSize = ${levelSize}</code> kelime var: <code>[${queue.join(', ')}]</code>.`,
      });

      const qCount = levelSize;
      for (let q = 0; q < qCount; q++) {
        curWord = queue.shift();
        newWords = [];

        if (curWord === endWord) {
          const path = [];
          let curr = endWord;
          while (curr) {
            path.unshift(curr);
            curr = parentMap[curr];
          }
          bestPath = path;
          snap({
            kind: 'done',
            lines: ['deq', 'ifTarget', 'retSteps'],
            changed: ['word'],
            text: `Kuyruktan çekilen <code>word = "${curWord}"</code> hedef kelimeye (<code>"${endWord}"</code>) eşit! En kısa dönüşüm dizisi: <b>${bestPath.join(' → ')}</b>. Uzunluk: <code>return ${stepNum}</code>.`,
          });
          return steps;
        }

        const foundNeighbors = [];
        const chars = curWord.split('');
        for (let i = 0; i < chars.length; i++) {
          const orig = chars[i];
          for (let code = 97; code <= 122; code++) {
            const c = String.fromCharCode(code);
            if (c === orig) continue;
            chars[i] = c;
            const nextWord = chars.join('');
            if (activeSet.has(nextWord)) {
              activeSet.delete(nextWord);
              queue.push(nextWord);
              foundNeighbors.push(nextWord);
              parentMap[nextWord] = curWord;
              if (!layers[currentLayerIdx + 1]) layers[currentLayerIdx + 1] = [];
              layers[currentLayerIdx + 1].push({ word: nextWord, parent: curWord });
            }
          }
          chars[i] = orig;
        }

        newWords = foundNeighbors;
        snap({
          kind: foundNeighbors.length > 0 ? 'expand' : 'skip',
          lines: ['deq', 'forChar', 'forAz', 'ifRem', 'enqNext'],
          changed: ['word'],
          text: foundNeighbors.length > 0
            ? `Kuyruktan <code>"${curWord}"</code> çekildi. Tek harf değişimiyle <code>wordSet</code>'te bulunan komşular: <b>${foundNeighbors.map((w) => `"${w}"`).join(', ')}</b>. Kümeden silinip kuyruğa eklendiler.`
            : `Kuyruktan <code>"${curWord}"</code> çekildi. Tek harf değişimiyle <code>wordSet</code>'te kalan yeni bir komşu kelime bulunamadı.`,
        });
      }

      curWord = undefined;
      newWords = [];
      stepNum++;
      snap({
        kind: 'inc',
        lines: ['incSteps'],
        changed: ['steps'],
        text: `Katmandaki tüm kelimeler işlendi. Sonraki katmana geçiliyor: <code>steps++</code> → <b>${stepNum}</b>.`,
      });
    }

    curWord = undefined;
    levelSize = 0;
    snap({
      kind: 'fail',
      lines: ['whileQ', 'ret0b'],
      text: `Kuyruk boşaldı ve <code>"${endWord}"</code> kelimesine ulaşılamadı. Geçerli bir dönüşüm dizisi yok: <code>return 0</code>.`,
    });
    return steps;
  }

  const CODE = [
    ['set', 'HashSet&lt;<span class="kw">string</span>&gt; wordSet = <span class="kw">new</span>(wordList);'],
    ['ifEnd', '<span class="kw">if</span> (!wordSet.Contains(endWord))'],
    ['ret0a', '    <span class="kw">return</span> 0;'],
    ['qInit', 'Queue&lt;<span class="kw">string</span>&gt; queue = <span class="kw">new</span>();'],
    ['enqBegin', 'queue.Enqueue(beginWord);'],
    ['remBegin', 'wordSet.Remove(beginWord);'],
    ['stepsInit', '<span class="kw">int</span> steps = 1;'],
    ['whileQ', '<span class="kw">while</span> (queue.Count &gt; 0) {'],
    ['lvlSize', '    <span class="kw">int</span> levelSize = queue.Count;'],
    ['forQ', '    <span class="kw">for</span> (<span class="kw">int</span> q = 0; q &lt; levelSize; q++) {'],
    ['deq', '        <span class="kw">string</span> word = queue.Dequeue();'],
    ['ifTarget', '        <span class="kw">if</span> (word == endWord)'],
    ['retSteps', '            <span class="kw">return</span> steps;'],
    ['forChar', '        <span class="kw">for</span> (<span class="kw">int</span> i = 0; i &lt; chars.Length; i++)'],
    ['forAz', '            <span class="kw">for</span> (<span class="kw">char</span> c = \'a\'; c &lt;= \'z\'; c++)'],
    ['ifRem', '                <span class="kw">if</span> (wordSet.Remove(nextWord))'],
    ['enqNext', '                    queue.Enqueue(nextWord);'],
    ['', '    }'],
    ['incSteps', '    steps++;'],
    ['', '}'],
    ['ret0b', '<span class="kw">return</span> 0;'],
  ];

  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Başlangıç', ''],
    level: ['Yeni Katman', ''],
    expand: ['Komşu Keşfi', ''],
    skip: ['Komşu Yok', 'skip'],
    inc: ['Katman Sonu', ''],
    done: ['Hedef Bulundu', 'ok'],
    fail: ['Ulaşılamadı', 'bad'],
  };

  let presetIdx = 0;
  let steps = [];
  let idx = 0;
  let timer = null;

  function render() {
    const st = steps[idx];

    $('set-row').innerHTML = st.wordList.map((w) => {
      const rem = st.remaining.has(w);
      let cls = 'mini';
      if (!rem) cls += ' used';
      else if (w === st.endWord) cls += ' target';
      return `<span class="${cls}">${w}</span>`;
    }).join('');

    $('queue-row').innerHTML = st.queue.length === 0
      ? '<span class="empty-note">kuyruk boş</span>'
      : st.queue.map((w) => `<span class="mini${st.newWords.includes(w) ? ' now' : ''}">${w}</span>`).join('');

    $('layers').innerHTML = st.layers.length === 0
      ? '<p class="empty-note">Henüz katman oluşturulmadı.</p>'
      : st.layers.map((layer, lIdx) => {
        const nodesHtml = layer.map((item) => {
          let cls = 'chip';
          if (st.bestPath.includes(item.word)) cls += ' path';
          else if (item.word === st.curWord) cls += ' cur';
          else if (st.newWords.includes(item.word)) cls += ' new';
          const parentHtml = item.parent ? `<span class="node-parent">${item.parent} ↓</span>` : '<span class="node-parent">başlangıç</span>';
          return `<div class="node-card">${parentHtml}<div class="${cls}">${item.word}</div></div>`;
        }).join('');
        return `<div class="layer-row"><span class="layer-badge">Adım ${lIdx + 1}</span><div class="layer-nodes">${nodesHtml}</div></div>`;
      }).join('');

    const vars = [
      ['word', st.curWord ? `"${st.curWord}"` : '—'],
      ['steps', st.stepNum],
      ['levelSize', st.levelSize ?? '—'],
      ['queue.Count', st.queue.length],
    ];
    $('vars').innerHTML = vars.map(([name, v]) =>
      `<div class="var${st.changed.includes(name) ? ' changed' : ''}"><dt>${name}</dt><dd>${v}</dd></div>`).join('');

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
      b.setAttribute('aria-pressed', String(Number(b.dataset.p) === presetIdx)));
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Oynat';
  }

  function loadPreset(pIdx) {
    stop();
    presetIdx = pIdx;
    steps = buildSteps(PRESETS[pIdx]);
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
  document.querySelectorAll('.presets button').forEach((b) =>
    b.addEventListener('click', () => loadPreset(Number(b.dataset.p))));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  loadPreset(0);
})();
