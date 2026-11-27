(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_DIGITS = 10;
  const PLACES = ['Ones', 'Tens', 'Hundreds', 'Thousands', 'Ten thousands', 'Hundred thousands', 'Millions', 'Ten millions', 'Hundred millions', 'Billions', 'Ten billions'];

  // Steps: mirrors Solution.cs line by line.
  // a and b are the digits of l1 and l2 from head to tail (ones digit first).
  // p1 and p2 are the positions l1 and l2 point at; a position past the end means null.
  // calc is shared by every step: the digits written and the carry that went into each column.
  function buildSteps(a, b) {
    const steps = [];
    const calc = { a, b, digits: [], carryIn: [], n: 0 };
    let carry = 0;
    let sum;
    let col = -1;
    let p1 = 0;
    let p2 = 0;
    const snap = (s) => steps.push({ calc, col, carry, sum, p1, p2, resLen: calc.digits.length, changed: [], ...s });

    snap({
      kind: 'start', lines: ['dummy', 'tail', 'carry0'], changed: ['carry'],
      text: 'An empty <code>dummy</code> node is created for the result list; the digits will be appended after it. For now <code>tail</code> points at <code>dummy</code>, <code>carry = 0</code>.',
    });

    while (p1 < a.length || p2 < b.length || carry !== 0) {
      col++;
      calc.carryIn[col] = carry;
      sum = carry;
      const lines = ['while', 'sum', 'if1'];
      const changed = ['sum'];
      const x = p1 < a.length ? a[p1] : null;
      if (x !== null) { sum += x; p1++; lines.push('add1', 'next1'); changed.push('l1'); }
      lines.push('if2');
      const y = p2 < b.length ? b[p2] : null;
      if (y !== null) { sum += y; p2++; lines.push('add2', 'next2'); changed.push('l2'); }

      let read;
      if (x !== null && y !== null) read = `Read ${x} from l1 and ${y} from l2, carry ${carry}: <code>sum = ${carry} + ${x} + ${y} = ${sum}</code>. Both lists move to their next node.`;
      else if (x !== null) read = `l2 has ended and adds nothing. Only ${x} is read from l1, carry ${carry}: <code>sum = ${carry} + ${x} = ${sum}</code>. l1 moves to its next node.`;
      else if (y !== null) read = `l1 has ended and adds nothing. Only ${y} is read from l2, carry ${carry}: <code>sum = ${carry} + ${y} = ${sum}</code>. l2 moves to its next node.`;
      else read = `Both lists have ended, but there's a carry of ${carry}, so the loop runs one more round: <code>sum = ${carry}</code>.`;
      snap({ kind: 'read', lines, changed, text: `<b>${PLACES[col]} digit.</b> ${read}` });

      calc.digits.push(sum % 10);
      carry = Math.floor(sum / 10);
      snap({
        kind: 'write', lines: ['write', 'move', 'carry'], changed: ['carry'],
        text: `<code>${sum} % 10 = ${sum % 10}</code> is appended to the result as a new node, and <code>tail</code> moves to it. <code>${sum} / 10 = ${carry}</code>: ` +
          (carry ? '<b>carry 1</b>, passed on to the next digit.' : 'no carry.'),
      });
    }

    calc.n = calc.digits.length;
    col = calc.n;
    sum = undefined;
    const asNumber = (digits) => digits.slice().reverse().join('');
    snap({
      kind: 'done', lines: ['while', 'ret'],
      text: 'l1 and l2 have ended and the carry is 0: the loop condition no longer holds. ' +
        `<code>return dummy.next</code> → <code>[${calc.digits.join(',')}]</code>. ` +
        `As numbers: ${asNumber(a)} + ${asNumber(b)} = ${asNumber(calc.digits)}.`,
    });
    return steps;
  }

  // Rendering
  const K = (word) => `<span class="kw">${word}</span>`;
  const CODE = [
    ['dummy', `ListNode dummy = ${K('new')} ListNode();`],
    ['tail', 'ListNode tail = dummy;'],
    ['carry0', `${K('int')} carry = 0;`],
    ['', ''],
    ['while', `${K('while')} (l1 != ${K('null')} || l2 != ${K('null')} || carry != 0)`],
    ['', '{'],
    ['sum', `    ${K('int')} sum = carry;`],
    ['if1', `    ${K('if')} (l1 != ${K('null')})`],
    ['', '    {'],
    ['add1', '        sum += l1.val;'],
    ['next1', '        l1 = l1.next;'],
    ['', '    }'],
    ['if2', `    ${K('if')} (l2 != ${K('null')})`],
    ['', '    {'],
    ['add2', '        sum += l2.val;'],
    ['next2', '        l2 = l2.next;'],
    ['', '    }'],
    ['write', `    tail.next = ${K('new')} ListNode(sum % 10);`],
    ['move', '    tail = tail.next;'],
    ['carry', '    carry = sum / 10;'],
    ['', '}'],
    ['', ''],
    ['ret', `${K('return')} dummy.next;`],
  ];
  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = { start: ['Start', ''], read: ['Add', ''], write: ['Write', ''], done: ['Done', 'ok'] };

  let aText = '2, 4, 3';
  let bText = '5, 6, 4';
  let steps = [];
  let idx = 0;
  let timer = null;

  // Returns the digits, or null when the text is not a valid LeetCode list.
  function parse(raw) {
    const parts = raw.split(/[\s,]+/).filter(Boolean);
    if (parts.length === 0 || parts.length > MAX_DIGITS) return null;
    if (!parts.every((p) => /^\d$/.test(p))) return null;
    const digits = parts.map(Number);
    if (digits.length > 1 && digits[digits.length - 1] === 0) return null; // no leading zero
    return digits;
  }

  // Is column k already reached on this step (or the whole sum finished)?
  const reached = (st, k) => (st.kind === 'done' ? k < st.calc.n : k <= st.col && st.col >= 0);
  const active = (st, k) => (st.kind === 'read' || st.kind === 'write') && k === st.col;

  function listRow(st, label, digits) {
    let html = `<div class="lrow"><span class="rlabel">${label}</span><div class="slot"><span class="chip blank"></span></div><div class="arr"></div>`;
    for (let k = 0; k < st.calc.n; k++) {
      let cls = 'chip';
      let text = '';
      if (k < digits.length) {
        text = digits[k];
        if (active(st, k)) cls += ' probe';
        else if (reached(st, k)) cls += ' used';
      } else if (reached(st, k)) {
        cls += ' ghost';
        text = '0';
      } else {
        cls += ' blank';
      }
      html += `<div class="slot"><span class="${cls}">${text}</span></div>`;
      if (k < st.calc.n - 1) html += `<div class="arr">${k + 1 < digits.length ? '→' : ''}</div>`;
    }
    return html + '</div>';
  }

  function renderLists(st) {
    const { n, carryIn, digits } = st.calc;

    // Carry row: the carry that goes into each column, like the small 1 written above a column on paper.
    let carryRow = '<div class="lrow carry"><span class="rlabel">carry</span><div class="slot"></div><div class="arr"></div>';
    for (let k = 0; k < n; k++) {
      let cell = '';
      const fresh = st.kind === 'write' && k === st.col + 1;
      if (reached(st, k) || fresh) {
        const v = carryIn[k];
        cell = `<span class="cin${v ? ' one' : ''}${fresh ? ' new' : ''}">${v}</span>`;
      }
      carryRow += `<div class="slot">${cell}</div>`;
      if (k < n - 1) carryRow += '<div class="arr"></div>';
    }
    carryRow += '</div>';

    // Result row: dummy, then the digits written so far; tail points at the last node.
    const tailAt = st.resLen - 1; // -1 means tail is still on dummy
    const tags = (k) => {
      const t = [];
      if (st.kind === 'done' && k === 0) t.push('<span class="ret">dummy.next</span>');
      if (k === tailAt) t.push('<span>tail</span>');
      return `<div class="tagline">${t.join('')}</div>`;
    };
    let result = `<div class="lrow"><span class="rlabel">result</span><div class="slot">${tags(-1)}<span class="chip dummy">dummy</span></div>` +
      `<div class="arr">${st.resLen > 0 ? '→' : ''}</div>`;
    for (let k = 0; k < n; k++) {
      let chip = '<span class="chip blank"></span>';
      if (k < st.resLen) {
        const state = st.kind === 'done' ? 'final' : st.kind === 'write' && k === st.col ? 'new' : 'plain';
        chip = `<span class="chip" data-state="${state}">${digits[k]}</span>`;
      }
      result += `<div class="slot">${tags(k)}${chip}</div>`;
      if (k < n - 1) result += `<div class="arr">${k + 1 < st.resLen ? '→' : ''}</div>`;
    }
    result += '</div>';

    const barWidth = n * 70 - 24;
    return carryRow + listRow(st, 'l1', st.calc.a) + listRow(st, 'l2', st.calc.b) +
      `<div class="bar" style="width:${barWidth}px"></div>` + result;
  }

  function renderSum(st) {
    const { n, a, b, digits } = st.calc;
    // Grid column for place k (0 = ones digit): the sign sits in column 1, the ones digit in the last column.
    const numberRow = (row, sign, ds, known, stateOf) => {
      let html = `<span class="sign" style="grid-row:${row};grid-column:1">${sign}</span>`;
      for (let k = 0; k < known; k++) {
        html += `<span class="${stateOf(k)}" style="grid-row:${row};grid-column:${n - k + 1}">${ds[k]}</span>`;
      }
      return html;
    };
    const inputState = (k) => (active(st, k) ? 'now' : '');
    const resultState = (k) => (st.kind === 'done' ? 'final' : st.kind === 'write' && k === st.col ? 'new' : '');
    $('sum-grid').style.gridTemplateColumns = `repeat(${n + 1}, 1.1em)`;
    return numberRow(1, '', a, a.length, inputState) +
      numberRow(2, '+', b, b.length, inputState) +
      '<span class="rule" style="grid-row:3"></span>' +
      numberRow(4, '', digits, st.resLen, resultState);
  }

  function restOf(digits, p) {
    if (p >= digits.length) return 'null';
    const rest = digits.slice(p);
    return rest.length > 3 ? `${rest.slice(0, 3).join(' → ')} → …` : rest.join(' → ');
  }

  function render() {
    const st = steps[idx];

    $('lists').innerHTML = renderLists(st);
    $('sum-grid').innerHTML = renderSum(st);

    const vars = [['l1', restOf(st.calc.a, st.p1)], ['l2', restOf(st.calc.b, st.p2)], ['sum', st.sum], ['carry', st.carry]];
    $('vars').innerHTML = vars.map(([name, v]) =>
      `<div class="var${st.changed.includes(name) ? ' changed' : ''}"><dt>${name}</dt><dd>${v === undefined ? '—' : v}</dd></div>`).join('');

    Object.keys(codeLines).forEach((id) => codeLines[id].classList.toggle('hl', st.lines.includes(id)));

    const [tagText, tagKind] = TAGS[st.kind];
    $('step-count').textContent = `Step ${idx + 1} / ${steps.length}`;
    $('step-tag').textContent = tagText;
    $('step-tag').dataset.kind = tagKind;
    $('step-text').innerHTML = st.text;
    $('prev-btn').disabled = idx === 0;
    $('reset').disabled = idx === 0;
    $('next-btn').disabled = idx === steps.length - 1;

    document.querySelectorAll('.presets button').forEach((btn) =>
      btn.setAttribute('aria-pressed', String(btn.dataset.a === aText && btn.dataset.b === bText)));
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Play';
  }

  function restart(textA, textB, a, b) {
    stop();
    aText = textA;
    bText = textB;
    steps = buildSteps(a, b);
    idx = 0;
    render();
  }

  function onInput() {
    const a = parse($('in-a').value);
    const b = parse($('in-b').value);
    if (!a || !b) { $('in-err').hidden = false; return; }
    $('in-err').hidden = true;
    restart($('in-a').value, $('in-b').value, a, b);
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
  document.querySelectorAll('.presets button').forEach((btn) => btn.addEventListener('click', () => {
    $('in-a').value = btn.dataset.a;
    $('in-b').value = btn.dataset.b;
    $('in-err').hidden = true;
    restart(btn.dataset.a, btn.dataset.b, parse(btn.dataset.a), parse(btn.dataset.b));
  }));
  $('in-a').addEventListener('input', onInput);
  $('in-b').addEventListener('input', onInput);
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(aText, bText, parse(aText), parse(bText));
})();
