(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_LEN = 8;

  // Steps: mirrors Solution.cs line by line.
  // answerState per box: 'empty' (still 0 from new int[n]), 'partial' (holds the left product), 'done' (final).
  // group: which nums boxes to tint for this step ('left', 'right', 'self' or 'plain').
  function buildSteps(vals) {
    const n = vals.length;
    const answer = Array(n).fill(0);
    const answerState = Array(n).fill('empty');
    const steps = [];
    let i;
    let right;
    let firstMul = true;
    let firstGrow = true;
    const fmt = (v) => (v < 0 ? `(${v})` : `${v}`);
    const prod = (arr) => (arr.length === 0 ? '1 (hiç sayı yok)' : arr.map(fmt).join(' × '));
    const groups = (spec) => vals.map((_, k) => spec(k));
    const snap = (s) => steps.push({
      answer: answer.slice(), answerState: answerState.slice(), i, right,
      target: -1, group: Array(n).fill('plain'), changed: [], ...s,
    });

    snap({
      kind: 'start', lines: ['n', 'answer'], changed: ['n'],
      text: `<code>n = ${n}</code>. <code>answer</code> dizisi ${n} kutuyla oluşturuldu; C#'ta yeni bir <code>int</code> dizisinin kutuları 0 ile başlar. Plan: <code>answer[i]</code> = (solundakilerin çarpımı) × (sağındakilerin çarpımı). Önce soldakileri yazacağız.`,
    });

    answer[0] = 1;
    answerState[0] = 'partial';
    snap({
      kind: 'left', lines: ['a0'], target: 0, group: groups((k) => (k === 0 ? 'self' : 'plain')),
      text: '<code>answer[0] = 1</code>. 0. kutunun solunda hiç sayı yok. Çarpmada "hiç sayı yok" 1 demek, çünkü 1 ile çarpmak hiçbir şeyi değiştirmez.',
    });

    for (i = 1; i < n; i++) {
      answer[i] = answer[i - 1] * vals[i - 1];
      answerState[i] = 'partial';
      snap({
        kind: 'left', lines: ['for1', 'left'], changed: ['i'], target: i,
        group: groups((k) => (k < i ? 'left' : k === i ? 'self' : 'plain')),
        text: `<code>answer[${i}] = answer[${i - 1}] * nums[${i - 1}]</code> → ${fmt(answer[i - 1])} × ${fmt(vals[i - 1])} = ${answer[i]}. Bu, ${i}. kutunun solundaki sayıların çarpımı: ${prod(vals.slice(0, i))}.`,
      });
    }

    i = undefined;
    right = 1;
    snap({
      kind: 'right', lines: ['right'], changed: ['right'],
      text: 'Sol çarpımlar <code>answer</code>\'a yazıldı. Şimdi sağdan sola gideceğiz. <code>right</code>, i\'nin sağındaki sayıların çarpımını tutacak; en sağdaki kutunun sağında sayı olmadığı için 1 ile başlıyor.',
    });

    for (i = n - 1; i >= 0; i--) {
      const before = answer[i];
      answer[i] = before * right;
      answerState[i] = 'done';
      snap({
        kind: 'mul', lines: ['for2', 'mul'], changed: ['i'], target: i,
        group: groups((k) => (k < i ? 'left' : k === i ? 'self' : 'right')),
        text: `<code>answer[${i}] *= right</code> → ${fmt(before)} × ${fmt(right)} = ${answer[i]}. ` +
          `${fmt(before)} solundakilerin, ${fmt(right)} sağındakilerin çarpımıydı; ${i}. kutunun cevabı tamamlandı.` +
          (firstMul ? ' (<code>a *= b</code>, <code>a = a * b</code>\'nin kısa yazılışı.)' : ''),
      });
      firstMul = false;

      const oldRight = right;
      right *= vals[i];
      snap({
        kind: 'grow', lines: ['grow'], changed: ['right'], target: -1,
        group: groups((k) => (k >= i ? 'right' : 'plain')),
        text: `<code>right *= nums[${i}]</code> → ${fmt(oldRight)} × ${fmt(vals[i])} = ${right}.` +
          (i > 0
            ? ` ${i - 1}. kutuya geçince ${fmt(vals[i])} de onun sağında kalıyor, o yüzden <code>right</code>'a katıyoruz.`
            : ' Döngünün son turu; bu çarpım artık kullanılmayacak.') +
          (firstGrow ? ' (<code>right *= nums[i]</code>, <code>right = right * nums[i]</code> demek.)' : ''),
      });
      firstGrow = false;
    }

    snap({
      kind: 'done', lines: ['ret'],
      text: `Döngü bitti. <code>return answer</code> → <code>[${answer.join(', ')}]</code>. Her kutuda, kendisi hariç bütün sayıların çarpımı var.`,
    });
    return steps;
  }

  // Rendering
  const CODE = [
    ['n', '<span class="kw">int</span> n = nums.Length;'],
    ['answer', '<span class="kw">int</span>[] answer = <span class="kw">new int</span>[n];'],
    ['', ''],
    ['a0', 'answer[0] = 1;'],
    ['for1', '<span class="kw">for</span> (<span class="kw">int</span> i = 1; i &lt; n; i++)'],
    ['left', '    answer[i] = answer[i - 1] * nums[i - 1];'],
    ['', ''],
    ['right', '<span class="kw">int</span> right = 1;'],
    ['for2', '<span class="kw">for</span> (<span class="kw">int</span> i = n - 1; i &gt;= 0; i--)'],
    ['', '{'],
    ['mul', '    answer[i] *= right;'],
    ['grow', '    right *= nums[i];'],
    ['', '}'],
    ['', ''],
    ['ret', '<span class="kw">return</span> answer;'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Başlangıç', ''], left: ['Sol çarpım', ''], right: ['Sağa geç', 'right'],
    mul: ['Sağla çarp', 'right'], grow: ['right büyür', 'right'], done: ['Bitti', 'ok'],
  };

  let listText = '1, 2, 3, 4';
  let vals = [];
  let steps = [];
  let idx = 0;
  let timer = null;

  function parse(raw) {
    const parts = raw.split(/[\s,]+/).filter(Boolean);
    if (parts.length < 2 || parts.length > MAX_LEN) return null;
    const out = parts.map(Number);
    return out.every((v) => Number.isInteger(v) && v >= -30 && v <= 30) ? out : null;
  }

  const fmt = (v) => (v < 0 ? `(${v})` : `${v}`);
  const prodLine = (arr) => (arr.length === 0 ? 'hiç sayı yok → 1' : `${arr.map(fmt).join(' × ')} = ${arr.reduce((a, b) => a * b, 1)}`);

  function render() {
    const st = steps[idx];
    const n = vals.length;
    const grid = $('grid');
    grid.style.gridTemplateColumns = `auto repeat(${n}, 58px)`;

    let html = '<span></span>';
    for (let k = 0; k < n; k++) html += `<div class="tags">${k === st.i ? 'i' : ''}</div>`;
    html += '<span class="rowlabel">nums</span>';
    for (let k = 0; k < n; k++) html += `<div class="cell" data-state="${st.group[k]}">${vals[k]}</div>`;
    html += '<span class="rowlabel">answer</span>';
    for (let k = 0; k < n; k++) {
      html += `<div class="cell${k === st.target ? ' target' : ''}" data-state="${st.answerState[k]}">${st.answer[k] === 0 ? 0 : st.answer[k]}</div>`;
    }
    html += '<span></span>';
    for (let k = 0; k < n; k++) html += `<div class="idx">[${k}]</div>`;
    grid.innerHTML = html;

    const vars = [['n', n], ['i', st.i], ['right', st.right]];
    $('vars').innerHTML = vars.map(([name, v]) =>
      `<div class="var${st.changed.includes(name) ? ' changed' : ''}"><dt>${name}</dt><dd>${v === undefined ? '—' : v === 0 ? 0 : v}</dd></div>`).join('');

    if (st.i === undefined) {
      $('left-part').textContent = '—';
      $('right-part').textContent = '—';
    } else {
      $('left-part').textContent = prodLine(vals.slice(0, st.i));
      $('right-part').textContent = prodLine(vals.slice(st.i + 1));
    }

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
