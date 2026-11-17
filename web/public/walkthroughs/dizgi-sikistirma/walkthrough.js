(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_LEN = 16;

  function buildSteps(rawStr) {
    const chars = rawStr.split('');
    const n = chars.length;
    const steps = [];
    let write = 0;
    let read = 0;
    let current = undefined;
    let count = undefined;
    let groupRange = [];

    const snap = (s) => steps.push({
      chars: chars.slice(),
      write,
      read,
      current,
      count,
      groupRange: groupRange.slice(),
      done: false,
      changed: [],
      ...s,
    });

    snap({
      kind: 'start',
      lines: ['init'],
      changed: ['write', 'read'],
      text: `Başlangıçta <code>write = 0</code> ve <code>read = 0</code>. Dizi uzunluğu: <code>${n}</code>.`,
    });

    while (read < n) {
      const groupStart = read;
      current = `'${chars[read]}'`;
      const rawChar = chars[read];
      count = 0;
      groupRange = [groupStart, groupStart];

      snap({
        kind: 'begin',
        lines: ['while-outer', 'cur-init'],
        changed: ['current', 'count'],
        text: `Yeni grup başlıyor: <code>current = '${rawChar}'</code> (indeks ${groupStart}), <code>count = 0</code>.`,
      });

      while (read < n && chars[read] === rawChar) {
        read++;
        count++;
      }
      groupRange = [groupStart, read - 1];

      snap({
        kind: 'count',
        lines: ['while-inner', 'read-inc'],
        changed: ['read', 'count'],
        text: `Ardışık <code>'${rawChar}'</code> grubu sayıldı: <code>count = ${count}</code>, <code>read</code> indeksi <code>${read}</code> konumuna ilerledi.`,
      });

      const writeCharIdx = write;
      chars[write] = rawChar;
      write++;
      snap({
        kind: 'write-char',
        lines: ['write-ch'],
        changed: ['write'],
        text: `Grup karakteri <code>'${rawChar}'</code>, <code>chars[${writeCharIdx}]</code> konumuna yazıldı. <code>write</code> → <code>${write}</code>.`,
      });

      if (count > 1) {
        const digits = String(count).split('');
        for (const d of digits) {
          const dIdx = write;
          chars[write] = d;
          write++;
          snap({
            kind: 'write-digit',
            lines: ['if-cnt', 'for-dig', 'write-dig'],
            changed: ['write'],
            text: `<code>count = ${count} &gt; 1</code> olduğu için basamak <code>'${d}'</code>, <code>chars[${dIdx}]</code> konumuna yazıldı. <code>write</code> → <code>${write}</code>.`,
          });
        }
      } else {
        snap({
          kind: 'skip',
          lines: ['if-cnt'],
          changed: [],
          text: `<code>count = 1</code> olduğu için uzunluk basamağı yazılmıyor.`,
        });
      }
    }

    current = undefined;
    count = undefined;
    groupRange = [];
    const resultArr = chars.slice(0, write);
    snap({
      kind: 'done',
      done: true,
      lines: ['ret'],
      changed: [],
      text: `Tüm gruplar işlendi. İlk <code>write = ${write}</code> eleman döndürülüyor: <code>["${resultArr.join('", "')}"]</code>.`,
    });

    return steps;
  }

  const CODE = [
    ['init', '<span class="kw">int</span> write = 0, read = 0;'],
    ['', ''],
    ['while-outer', '<span class="kw">while</span> (read &lt; chars.Length)'],
    ['', '{'],
    ['cur-init', '    <span class="kw">char</span> current = chars[read]; <span class="kw">int</span> count = 0;'],
    ['while-inner', '    <span class="kw">while</span> (read &lt; chars.Length &amp;&amp; chars[read] == current)'],
    ['read-inc', '    { read++; count++; }'],
    ['', ''],
    ['write-ch', '    chars[write++] = current;'],
    ['if-cnt', '    <span class="kw">if</span> (count &gt; 1)'],
    ['for-dig', '        <span class="kw">foreach</span> (<span class="kw">char</span> digit <span class="kw">in</span> count.ToString())'],
    ['write-dig', '            chars[write++] = digit;'],
    ['', '}'],
    ['ret', '<span class="kw">return</span> chars[..write];'],
  ];

  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Başlangıç', ''],
    begin: ['Yeni grup', ''],
    count: ['Grubu say', ''],
    'write-char': ['Karakteri yaz', ''],
    'write-digit': ['Basamak yaz', ''],
    skip: ['Tek karakter', 'skip'],
    done: ['Tamamlandı', 'ok'],
  };

  let rawText = 'aabbccc';
  let steps = [];
  let idx = 0;
  let timer = null;

  function validate(raw) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.length > MAX_LEN) return null;
    if (!/^[a-zA-Z0-9]+$/.test(trimmed)) return null;
    return trimmed;
  }

  function render() {
    const st = steps[idx];

    let html = '';
    for (let i = 0; i < st.chars.length; i++) {
      const tags = [];
      if (i === st.read) tags.push('<span class="t-read">read</span>');
      if (i === st.write) tags.push('<span class="t-write">write</span>');

      let state = 'plain';
      if (st.done && i >= st.write) {
        state = 'tail';
      } else if (i < st.write) {
        state = 'written';
      } else if (st.groupRange.length === 2 && i >= st.groupRange[0] && i <= st.groupRange[1]) {
        state = 'group';
      }

      let cls = 'chip';
      if (i === st.read) cls += ' cur-read';
      else if (i === st.write) cls += ' cur-write';

      html += `<div class="item"><div class="tags">${tags.join('')}</div><div class="${cls}" data-state="${state}">${st.chars[i]}</div><span class="idx-lbl">${i}</span></div>`;
    }
    $('chars-line').innerHTML = html;

    const vars = [
      ['read', st.read],
      ['write', st.write],
      ['current', st.current],
      ['count', st.count],
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

    document.querySelectorAll('.presets button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.s === rawText)));
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Oynat';
  }

  function restart(validStr) {
    stop();
    rawText = validStr;
    steps = buildSteps(rawText);
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
  document.querySelectorAll('.presets button').forEach((b) => b.addEventListener('click', () => {
    $('chars-input').value = b.dataset.s;
    $('chars-err').hidden = true;
    restart(b.dataset.s);
  }));
  $('chars-input').addEventListener('input', (e) => {
    const valid = validate(e.target.value);
    if (!valid) { $('chars-err').hidden = false; return; }
    $('chars-err').hidden = true;
    restart(valid);
  });
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(rawText);
})();
