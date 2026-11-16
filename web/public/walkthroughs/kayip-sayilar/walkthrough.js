(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_LEN = 10;

  // Steps: mirrors Solution.cs line by line.
  // readAt: the foreach element being read; target: the box being checked (box in loop 1, i in loop 2).
  function buildSteps(vals) {
    const n = vals.length;
    const nums = vals.slice();
    const result = [];
    const missing = [];
    const steps = [];
    let num;
    let box;
    let i;
    let phase = 'mark';
    const snap = (s) => steps.push({
      nums: nums.slice(), result: result.slice(), missing: missing.slice(),
      num, box, i, phase, readAt: -1, target: -1, changed: [], ...s,
    });

    snap({
      kind: 'start', lines: [],
      text: `Dizide ${n} eleman var, yani sayılar 1 ile ${n} arasında. Her sayının bir kutusu var: <code>x</code> sayısının kutusu <code>nums[x - 1]</code>. Önce diziyi gezip gördüğümüz her sayının kutusunu negatif yaparak işaretleyeceğiz.`,
    });

    for (let j = 0; j < n; j++) {
      num = nums[j];
      const abs = Math.abs(num);
      box = abs - 1;
      snap({
        kind: 'read', lines: ['foreach', 'box'], changed: ['num', 'box'], readAt: j, target: box,
        text: `Sıradaki eleman <code>num = ${num}</code>.` +
          (num < 0 ? ` Negatif, çünkü bu kutu daha önce işaretlendi; asıl sayı ${abs}.` : '') +
          ` <code>box = Math.Abs(${num}) - 1</code> → ${box}. ${abs} sayısının kutusu <code>nums[${box}]</code>.`,
      });

      if (nums[box] > 0) {
        const before = nums[box];
        nums[box] = -before;
        snap({
          kind: 'mark', lines: ['if', 'neg'], readAt: j, target: box,
          text: `<code>nums[${box}]</code> = ${before}, pozitif: ${abs} sayısını ilk kez görüyoruz. Kutuyu negatif yaparak işaretliyoruz: <code>nums[${box}] = ${-before}</code>.`,
        });
      } else {
        snap({
          kind: 'skip', lines: ['if'], readAt: j, target: box,
          text: `<code>nums[${box}]</code> = ${nums[box]}, zaten negatif: ${abs} sayısını daha önce görmüştük, bu bir tekrar. Hiçbir şey yapmıyoruz.`,
        });
      }
    }

    // num and box only live inside the foreach.
    num = undefined;
    box = undefined;
    phase = 'collect';
    snap({
      kind: 'list', lines: ['list'], changed: ['result'],
      text: 'İşaretleme bitti. Negatif kutular dizide olan sayıların, pozitif kalanlar hiç görülmeyen sayıların kutuları. Boş bir <code>result</code> listesi oluşturup kutulara baştan sona bakıyoruz.',
    });

    for (i = 0; i < n; i++) {
      if (nums[i] > 0) {
        result.push(i + 1);
        missing.push(i);
        snap({
          kind: 'add', lines: ['for', 'if2', 'add'], changed: ['i', 'result'], target: i,
          text: `<code>i = ${i}</code>: <code>nums[${i}]</code> = ${nums[i]}, pozitif. Bu kutu hiç işaretlenmedi, yani ${i + 1} sayısı dizide yok. <code>result.Add(${i + 1})</code>.`,
        });
      } else {
        const before = nums[i];
        nums[i] = -before;
        snap({
          kind: 'restore', lines: ['for', 'if2', 'else', 'restore'], changed: ['i'], target: i,
          text: `<code>i = ${i}</code>: <code>nums[${i}]</code> = ${before}, negatif. Yani ${i + 1} sayısı dizide var. İşareti geri alıyoruz: <code>nums[${i}] = ${-before}</code>.`,
        });
      }
    }

    snap({
      kind: 'done', lines: ['for', 'ret'],
      text: (result.length === 0
        ? 'Döngü bitti ve hiçbir kutu pozitif kalmadı: kayıp sayı yok. <code>return result</code> → <code>[]</code>.'
        : `Döngü bitti. <code>return result</code> → <code>[${result.join(', ')}]</code>. Bu sayılar dizide hiç yoktu.`) +
        ` <code>nums</code> da işaretler geri alındığı için eski hâline döndü: <code>[${nums.join(', ')}]</code>.`,
    });
    return steps;
  }

  // Rendering
  const CODE = [
    ['foreach', '<span class="kw">foreach</span> (<span class="kw">int</span> num <span class="kw">in</span> nums)'],
    ['', '{'],
    ['box', '    <span class="kw">int</span> box = Math.Abs(num) - 1;'],
    ['if', '    <span class="kw">if</span> (nums[box] &gt; 0)'],
    ['neg', '        nums[box] = -nums[box];'],
    ['', '}'],
    ['', ''],
    ['list', 'List&lt;<span class="kw">int</span>&gt; result = <span class="kw">new</span> List&lt;<span class="kw">int</span>&gt;();'],
    ['for', '<span class="kw">for</span> (<span class="kw">int</span> i = 0; i &lt; nums.Length; i++)'],
    ['', '{'],
    ['if2', '    <span class="kw">if</span> (nums[i] &gt; 0)'],
    ['add', '        result.Add(i + 1);'],
    ['else', '    <span class="kw">else</span>'],
    ['restore', '        nums[i] = -nums[i];'],
    ['', '}'],
    ['', ''],
    ['ret', '<span class="kw">return</span> result;'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Başlangıç', ''], read: ['Kutuyu bul', ''], mark: ['İşaretle', ''], skip: ['Tekrar', ''],
    list: ['Topla', 'phase2'], add: ['Kayıp sayı', 'phase2'], restore: ['Geri al', 'phase2'], done: ['Bitti', 'ok'],
  };

  let listText = '4, 3, 2, 7, 8, 2, 3, 1';
  let vals = [];
  let steps = [];
  let idx = 0;
  let timer = null;

  function parse(raw) {
    const parts = raw.split(/[\s,]+/).filter(Boolean);
    if (parts.length === 0 || parts.length > MAX_LEN) return null;
    const out = parts.map(Number);
    return out.every((v) => Number.isInteger(v) && v >= 1 && v <= out.length) ? out : null;
  }

  function render() {
    const st = steps[idx];
    const n = vals.length;

    let html = '';
    for (let k = 0; k < n; k++) {
      const state = st.missing.includes(k) ? 'missing' : st.nums[k] < 0 ? 'marked' : 'plain';
      const cls = 'box' + (k === st.readAt ? ' reading' : '') + (k === st.target ? ' target' : '');
      const t = [];
      if (k === st.readAt) t.push('<span class="t-num">num</span>');
      if (k === st.target) t.push(`<span class="t-box">${st.phase === 'mark' ? 'box' : 'i'}</span>`);
      html += `<div class="cell"><div class="tags">${t.join('')}</div>` +
        `<div class="${cls}" data-state="${state}">${st.nums[k]}</div>` +
        `<div class="idx">[${k}]</div><div class="owner">sayı <b>${k + 1}</b></div></div>`;
    }
    $('arr').innerHTML = html;

    const vars = [['num', st.num], ['box', st.box], ['i', st.i]];
    $('vars').innerHTML = vars.map(([name, v]) =>
      `<div class="var${st.changed.includes(name) ? ' changed' : ''}"><dt>${name}</dt><dd>${v === undefined ? '—' : v}</dd></div>`).join('');

    $('result').textContent = st.phase === 'mark' ? '—' : `[${st.result.join(', ')}]`;
    $('out').classList.toggle('changed', st.changed.includes('result'));

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
    vals = parsed;
    steps = buildSteps(vals);
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
