(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_LEN = 10;
  const COLOR = ['red', 'white', 'blue'];

  // Steps: mirrors Solution.cs. Every turn is two steps: look at nums[mid], then act on it.
  // cur: the box mid is looking at; swap: the two boxes that swap (planned = not swapped yet).
  function buildSteps(vals) {
    const a = vals.slice();
    const n = a.length;
    const steps = [];
    let low;
    let mid;
    let high;
    let turns = 0;
    const snap = (s) => steps.push({
      arr: a.slice(), low, mid, high, cur: -1, swap: null, done: false, changed: [], ...s,
    });
    const check = () => `<code>mid &lt;= high</code>? ${mid} &lt;= ${high}, yes.`;

    snap({
      kind: 'start', lines: [],
      text: `The array has ${n} boxes: 0 is red, 1 is white, 2 is blue. The goal is to sort it in one pass, without allocating a new array, so that the 0s come first, then the 1s, then the 2s.`,
    });

    low = 0;
    mid = 0;
    high = n - 1;
    snap({
      kind: 'init', lines: ['low', 'mid', 'high'], changed: ['low', 'mid', 'high'],
      text: `<code>low = 0</code>, <code>mid = 0</code>, <code>high = ${high}</code>. We haven't examined any box yet; the whole array is in the <b>unexamined</b> region. The 0s, 1s and 2s regions are empty for now.`,
    });

    while (mid <= high) {
      turns++;
      const v = a[mid];

      if (v === 0) {
        const same = low === mid;
        snap({
          kind: 'look0', lines: ['while', 'if0'], changed: ['val'], cur: mid, swap: { from: low, to: mid, planned: true },
          text: `${check()} <code>nums[mid] = 0</code>, red. ` + (same
            ? "<code>low</code> points to this box too, so the 0 is already right at the end of the 0s. It will swap with itself and the array won't change."
            : `It will go to the end of the 0s, the box <code>low</code> points to (index ${low}). The 1 there will take its place.`),
        });
        const [oldLow, oldMid] = [low, mid];
        [a[low], a[mid]] = [a[mid], a[low]];
        low++;
        mid++;
        snap({
          kind: 'act0', lines: ['sw0', 'lowpp', 'midpp0'], changed: ['low', 'mid', 'val'], swap: { from: oldLow, to: oldMid, planned: false },
          text: same
            ? "It swapped with itself; the array is unchanged. <code>low++</code> and <code>mid++</code>: the 0s region grew by one box."
            : `They swapped: the 0 moved left (index ${oldLow}) and the 1 moved right (index ${oldMid}). We had already examined the incoming 1; it sits at the end of the 1s. <code>low++</code> and <code>mid++</code>: the 0s region grew by one box and the 1s region shifted one box to the right.`,
        });
      } else if (v === 1) {
        snap({
          kind: 'look1', lines: ['while', 'if1'], changed: ['val'], cur: mid,
          text: `${check()} <code>nums[mid] = 1</code>, white. The 1s region ends right here, so this box is already in the right place. No swap needed.`,
        });
        mid++;
        snap({
          kind: 'act1', lines: ['midpp1'], changed: ['mid', 'val'],
          text: "<code>mid++</code>: the 1s region grew by one box; we move on to the next box.",
        });
      } else {
        const same = mid === high;
        const w = a[high];
        snap({
          kind: 'look2', lines: ['while', 'else'], changed: ['val'], cur: mid, swap: { from: mid, to: high, planned: true },
          text: `${check()} <code>nums[mid] = 2</code>, blue. ` + (same
            ? '<code>high</code> points to this box too, so this is the last unexamined box. It will swap with itself and the array will not change.'
            : `It will go right before the 2s, to the box <code>high</code> points to (index ${high}). The box there (${w}, ${COLOR[w]}) will take its place.`),
        });
        const [oldMid, oldHigh] = [mid, high];
        [a[mid], a[high]] = [a[high], a[mid]];
        high--;
        let text;
        if (same) {
          text = "It swapped with itself; the array is unchanged. <code>high--</code>: the 2s region grew by one box.";
        } else {
          text = `They swapped: the 2 moved right (index ${oldHigh}) and the ${w} moved left (index ${oldMid}). <code>high--</code>: the 2s region grew by one box. ` +
            `<b><code>mid</code> does not advance:</b> the incoming ${w} came from the unexamined region, so we will examine it in the next iteration. `;
          if (w === 0) text += "It's a 0; if <code>mid</code> advanced, it would never be examined again and would be left in the 1s region.";
          else if (w === 2) text += "It's a 2 as well, so it will also go to the right.";
          else text += 'This time a 1 came back, but we could not know that without examining it.';
        }
        snap({
          kind: 'act2', lines: ['sw2', 'highmm'], changed: ['high', 'val'], swap: { from: oldMid, to: oldHigh, planned: false }, text,
        });
      }
    }

    snap({
      kind: 'end', lines: ['while'], done: true,
      text: `<code>mid &lt;= high</code>? ${mid} &lt;= ${high}, no. No unexamined boxes are left, so the loop ends. It ran exactly ${turns} iterations for ${n} boxes. <code>nums</code> is now sorted.`,
    });
    return steps;
  }

  // Rendering
  const CODE = [
    ['low', '<span class="kw">int</span> low = 0;'],
    ['mid', '<span class="kw">int</span> mid = 0;'],
    ['high', '<span class="kw">int</span> high = nums.Length - 1;'],
    ['', ''],
    ['while', '<span class="kw">while</span> (mid &lt;= high)'],
    ['', '{'],
    ['if0', '    <span class="kw">if</span> (nums[mid] == 0)'],
    ['', '    {'],
    ['sw0', '        (nums[low], nums[mid]) = (nums[mid], nums[low]);'],
    ['lowpp', '        low++;'],
    ['midpp0', '        mid++;'],
    ['', '    }'],
    ['if1', '    <span class="kw">else if</span> (nums[mid] == 1)'],
    ['', '    {'],
    ['midpp1', '        mid++;'],
    ['', '    }'],
    ['else', '    <span class="kw">else</span>'],
    ['', '    {'],
    ['sw2', '        (nums[mid], nums[high]) = (nums[high], nums[mid]);'],
    ['highmm', '        high--;'],
    ['', '    }'],
    ['', '}'],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Start', ''], init: ['Setup', ''],
    look0: ['Found 0', ''], act0: ['0 → left', ''],
    look1: ['Found 1', ''], act1: ['1 stays', ''],
    look2: ['Found 2', ''], act2: ['2 → right', ''],
    end: ['Sorted', 'ok'],
  };

  let listText = '2, 0, 2, 1, 1, 0';
  let steps = [];
  let idx = 0;
  let timer = null;

  function parse(raw) {
    const parts = raw.split(/[\s,]+/).filter(Boolean);
    if (parts.length === 0 || parts.length > MAX_LEN) return null;
    const out = parts.map(Number);
    return out.every((v) => v === 0 || v === 1 || v === 2) ? out : null;
  }

  function render() {
    const st = steps[idx];
    const n = st.arr.length;
    const col = (k) => `grid-column:${k + 2}`; // column 1 is the spare on the left
    const started = st.low !== undefined;

    let html = '';
    for (let k = 0; k < n; k++) {
      const labels = [];
      if (started) {
        if (st.low === k) labels.push('<span class="t-low">low</span>');
        if (st.mid === k) labels.push('<span class="t-mid">mid</span>');
        if (st.high === k) labels.push('<span class="t-high">high</span>');
      }
      html += `<div class="lbl" style="${col(k)}">${labels.join('')}</div>`;
      html += `<div class="box${k === st.cur ? ' cur' : ''}" data-c="${st.arr[k]}" style="${col(k)}">${st.arr[k]}</div>`;
      html += `<div class="idx" style="${col(k)}">[${k}]</div>`;
    }

    if (started) {
      // Pointers that stepped off the array go to the spare columns.
      const left = st.high === -1 ? ['<span class="t-high">high = -1</span>'] : [];
      const right = [];
      if (st.low === n) right.push(`<span class="t-low">low = ${n}</span>`);
      if (st.mid === n) right.push(`<span class="t-mid">mid = ${n}</span>`);
      html += `<div class="lbl" style="grid-column:1">${left.join('')}</div>`;
      html += `<div class="lbl" style="grid-column:${n + 2}">${right.join('')}</div>`;

      const regions = [
        ['0', 0, st.low, "0s"],
        ['1', st.low, st.mid, "1s"],
        ['u', st.mid, st.high + 1, 'unexamined'],
        ['2', st.high + 1, n, "2s"],
      ];
      regions.forEach(([r, from, to, name]) => {
        if (to > from) html += `<div class="reg" data-r="${r}" style="grid-column:${from + 2} / ${to + 2}">${name}</div>`;
      });
    }

    if (st.swap) {
      const { from, to, planned } = st.swap;
      html += from === to
        ? `<div class="swap-self" style="${col(from)}" title="with itself">↺</div>`
        : `<div class="swap${planned ? ' planned' : ''}" style="grid-column:${Math.min(from, to) + 2} / ${Math.max(from, to) + 3}"></div>`;
    }

    $('track').style.gridTemplateColumns = `max-content repeat(${n}, 56px) max-content`;
    $('track').innerHTML = html;

    const show = (v) => (v === undefined ? '—' : String(v));
    const looking = started && st.mid >= 0 && st.mid < n && st.mid <= st.high;
    const vars = [
      ['low', st.low, 'low'],
      ['mid', st.mid, 'mid'],
      ['high', st.high, 'high'],
      ['nums[mid]', looking ? st.arr[st.mid] : undefined, 'val'],
    ];
    $('vars').innerHTML = vars.map(([name, v, key]) =>
      `<div class="var${st.changed.includes(key) ? ' changed' : ''}"><dt>${name}</dt><dd>${show(v)}</dd></div>`).join('');

    $('result').textContent = `[${st.arr.join(', ')}]`;
    $('out').dataset.kind = st.done ? 'done' : '';

    Object.keys(codeLines).forEach((id) => codeLines[id].classList.toggle('hl', st.lines.includes(id)));

    const [tagText, tagKind] = TAGS[st.kind];
    $('step-count').textContent = `Step ${idx + 1} / ${steps.length}`;
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
    $('play').textContent = '▶ Play';
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
    $('play').textContent = '❚❚ Pause';
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
