(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_LEN = 10;

  function buildSteps(temps) {
    const steps = [];
    const answer = new Array(temps.length).fill(0);
    const resolved = new Array(temps.length).fill(false);
    const waiting = [];
    let day;
    let earlier;

    const snap = (s) => steps.push({
      temps,
      answer: answer.slice(),
      resolved: resolved.slice(),
      waiting: waiting.slice(),
      day,
      earlier,
      changed: [],
      ...s,
    });

    snap({
      kind: 'start',
      lines: ['ans', 'stack'],
      text: `<code>answer</code> dizisi ${temps.length} adet <code>0</code> ile oluşturuldu. Bekleyen gün indekslerini tutacak <code>waiting</code> yığını boş.`,
    });

    for (let d = 0; d < temps.length; d++) {
      day = d;
      earlier = undefined;

      while (waiting.length > 0 && temps[day] > temps[waiting[waiting.length - 1]]) {
        const top = waiting.pop();
        earlier = top;
        answer[earlier] = day - earlier;
        resolved[earlier] = true;

        snap({
          kind: 'pop',
          lines: ['for', 'while', 'pop', 'set'],
          changed: ['earlier', 'diff'],
          text: `Gün ${day} (${temps[day]}°) &gt; yığının tepesindeki gün ${earlier} (${temps[earlier]}°). <code>earlier = ${earlier}</code> yığından çıkarıldı ve <code>answer[${earlier}] = ${day} - ${earlier} = ${day - earlier}</code> yazıldı.`,
        });
      }

      const topIdx = waiting.length > 0 ? waiting[waiting.length - 1] : undefined;
      earlier = undefined;
      waiting.push(day);

      snap({
        kind: 'push',
        lines: ['for', 'while', 'push'],
        changed: ['day'],
        text: (topIdx === undefined
          ? `Yığın boş olduğu için <code>while</code> sona erdi. `
          : `Yığının tepesindeki gün ${topIdx} (${temps[topIdx]}°), bugünden (${temps[day]}°) daha soğuk değil. `) +
          `Bugün (gün ${day}, ${temps[day]}°) kendi sıcak gününü beklemek üzere yığına eklendi: <code>waiting.Push(${day})</code>.`,
      });
    }

    day = undefined;
    earlier = undefined;
    snap({
      kind: 'done',
      lines: ['ret'],
      text: `Tüm günler işlendi. Yığında kalan ${waiting.length} gün için daha sıcak bir gün gelmedi (yanıtları <code>0</code> kaldı). <code>return answer</code> → <b>[${answer.join(', ')}]</b>.`,
    });

    return steps;
  }

  const CODE = [
    ['ans', '<span class="kw">var</span> answer = <span class="kw">new</span> <span class="kw">int</span>[temperatures.Length];'],
    ['stack', '<span class="kw">var</span> waiting = <span class="kw">new</span> Stack&lt;<span class="kw">int</span>&gt;();'],
    ['', ''],
    ['for', '<span class="kw">for</span> (<span class="kw">var</span> day = 0; day &lt; temperatures.Length; day++)'],
    ['', '{'],
    ['while', '    <span class="kw">while</span> (waiting.Count &gt; 0 &amp;&amp; temperatures[day] &gt; temperatures[waiting.Peek()])'],
    ['', '    {'],
    ['pop', '        <span class="kw">var</span> earlier = waiting.Pop();'],
    ['set', '        answer[earlier] = day - earlier;'],
    ['', '    }'],
    ['', ''],
    ['push', '    waiting.Push(day);'],
    ['', '}'],
    ['', ''],
    ['ret', '<span class="kw">return</span> answer;'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Başlangıç', ''],
    pop: ['Yanıt bulundu (Pop)', 'ok'],
    push: ['Yığına ekle (Push)', ''],
    done: ['Bitti', 'ok'],
  };

  let listText = '73, 74, 75, 71, 69, 72, 76, 73';
  let vals = [];
  let steps = [];
  let idx = 0;
  let timer = null;

  function parse(raw) {
    const parts = raw.split(/[\s,]+/).filter(Boolean);
    if (parts.length < 1 || parts.length > MAX_LEN) return null;
    const out = parts.map(Number);
    return out.every((v) => Number.isInteger(v) && v >= 30 && v <= 100) ? out : null;
  }

  function render() {
    const st = steps[idx];

    $('days-row').innerHTML = st.temps.map((t, i) => {
      const inStack = st.waiting.includes(i);
      const isDone = st.resolved[i];
      const isCur = i === st.day;
      const isPop = i === st.earlier;
      const state = isDone ? 'done' : inStack ? 'waiting' : 'plain';
      let chipCls = 'chip';
      if (isCur) chipCls += ' cur';
      if (isPop) chipCls += ' popped';

      let tagHtml = '';
      if (isCur) tagHtml = '<span class="day-tag">day</span>';
      else if (isPop) tagHtml = '<span class="day-tag pop">earlier</span>';
      else tagHtml = '<span class="day-tag"></span>';

      const ansCls = 'ans-box' + (isDone ? ' set' : '') + (isPop ? ' fresh' : '');
      return `<div class="day-card">
        ${tagHtml}
        <div class="${chipCls}" data-state="${state}">${t}°</div>
        <div class="${ansCls}">${st.answer[i]}</div>
        <span class="day-idx">gün ${i}</span>
      </div>`;
    }).join('');

    if (st.waiting.length === 0) {
      $('stack').innerHTML = '<p class="empty-note">boş</p>';
    } else {
      $('stack').innerHTML = st.waiting.slice().reverse().map((dIdx, pos) =>
        `<div class="plate${pos === 0 ? ' top' : ''}"><span>gün ${dIdx}</span><b>${st.temps[dIdx]}°</b></div>`
      ).join('');
    }

    if (st.earlier !== undefined) {
      $('pop-chip').textContent = `gün ${st.earlier} (${st.temps[st.earlier]}°)`;
      $('pop-chip').className = 'pop-chip active';
    } else {
      $('pop-chip').textContent = '—';
      $('pop-chip').className = 'pop-chip';
    }

    const peekIdx = st.waiting.length > 0 ? st.waiting[st.waiting.length - 1] : undefined;
    const vars = [
      ['day', st.day, 'day'],
      ['temperatures[day]', st.day !== undefined ? `${st.temps[st.day]}°` : undefined, 'day'],
      ['waiting.Peek()', peekIdx !== undefined ? `${peekIdx} (${st.temps[peekIdx]}°)` : undefined, ''],
      ['earlier', st.earlier, 'earlier'],
      ['day - earlier', st.earlier !== undefined && st.day !== undefined ? st.day - st.earlier : undefined, 'diff'],
      ['waiting.Count', st.waiting.length, ''],
    ];
    $('vars').innerHTML = vars.map(([name, v, key]) =>
      `<div class="var${key && st.changed.includes(key) ? ' changed' : ''}"><dt>${name}</dt><dd>${v === undefined ? '—' : v}</dd></div>`
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
