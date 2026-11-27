(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_LEN = 28;

  function buildSteps(expr) {
    const steps = [];
    const stack = [];
    let result = 0;
    let number = 0;
    let sign = 1;
    let pos = -1;
    let cVal = undefined;

    const snap = (s) => steps.push({
      expr,
      pos,
      cVal,
      result,
      number,
      sign,
      stack: stack.slice(),
      changed: [],
      ...s,
    });

    snap({
      kind: 'start',
      lines: ['stack', 'init'],
      changed: ['result', 'number', 'sign'],
      text: `At the start the stack is empty, <code>result = 0</code>, <code>number = 0</code> and <code>sign = +1</code>.`,
    });

    for (let i = 0; i < expr.length; i++) {
      pos = i;
      const c = expr[i];
      cVal = `'${c}'`;

      if (c >= '0' && c <= '9') {
        const digit = c.charCodeAt(0) - 48;
        number = number * 10 + digit;
        snap({
          kind: 'digit',
          lines: ['foreach', 'if-digit', 'num-acc'],
          changed: ['c', 'number'],
          text: `The character <code>'${c}'</code> is a digit. <code>number = number * 10 + ${digit}</code> → <code>${number}</code>.`,
        });
      } else if (c === '+' || c === '-') {
        const prevRes = result;
        const prevNum = number;
        const prevSign = sign;
        result += sign * number;
        number = 0;
        sign = c === '+' ? 1 : -1;
        snap({
          kind: 'op',
          lines: ['foreach', c === '+' ? 'if-plus' : 'if-minus', c === '+' ? 'plus-body' : 'minus-body'],
          changed: ['c', 'result', 'number', 'sign'],
          text: `Operator <code>'${c}'</code> arrives. Add the previous number to the total: <code>result = ${prevRes} + (${prevSign >= 0 ? '+' : ''}${prevSign} * ${prevNum}) = ${result}</code>. New <code>sign = ${sign >= 0 ? '+1' : '-1'}</code>, <code>number = 0</code>.`,
        });
      } else if (c === '(') {
        stack.push(result);
        stack.push(sign);
        const pushedRes = result;
        const pushedSign = sign;
        result = 0;
        sign = 1;
        snap({
          kind: 'push',
          lines: ['foreach', 'if-open', 'open-body'],
          changed: ['c', 'result', 'sign'],
          text: `<code>'('</code> seen: the current <code>result = ${pushedRes}</code> and <code>sign = ${pushedSign >= 0 ? '+1' : '-1'}</code> are pushed onto the stack. For the parenthesized part, <code>result = 0</code> and <code>sign = +1</code> are reset.`,
        });
      } else if (c === ')') {
        const innerBefore = result;
        const lastNum = number;
        const lastSign = sign;
        result += sign * number;
        const innerTotal = result;
        number = 0;
        const poppedSign = stack.pop();
        result *= poppedSign;
        const poppedRes = stack.pop();
        result += poppedRes;
        snap({
          kind: 'pop',
          lines: ['foreach', 'if-close', 'close-body'],
          changed: ['c', 'result', 'number'],
          text: `<code>')'</code> seen: the last number inside the parentheses is added (<code>${innerBefore} + ${lastSign >= 0 ? '+' : ''}${lastSign}*${lastNum} = ${innerTotal}</code>). The sign (<code>${poppedSign >= 0 ? '+1' : '-1'}</code>) and the previous total (<code>${poppedRes}</code>) are popped from the stack → <code>result = ${poppedRes} + (${poppedSign >= 0 ? '+' : ''}${poppedSign} * ${innerTotal}) = ${result}</code>.`,
        });
      } else {
        snap({
          kind: 'skip',
          lines: ['foreach'],
          changed: ['c'],
          text: `The space character <code>' '</code> is skipped.`,
        });
      }
    }

    pos = expr.length;
    cVal = undefined;
    const finalAns = result + sign * number;
    snap({
      kind: 'done',
      lines: ['ret'],
      changed: number !== 0 ? ['result'] : [],
      result: finalAns,
      text: `The loop is done. The last remaining term is added: <code>return ${result} + (${sign >= 0 ? '+' : ''}${sign} * ${number})</code> → <b>${finalAns}</b>.`,
    });

    return steps;
  }

  const CODE = [
    ['stack', 'Stack&lt;<span class="kw">int</span>&gt; stack = <span class="kw">new</span> Stack&lt;<span class="kw">int</span>&gt;();'],
    ['init', '<span class="kw">int</span> result = 0, number = 0, sign = 1;'],
    ['', ''],
    ['foreach', '<span class="kw">foreach</span> (<span class="kw">char</span> c <span class="kw">in</span> s)'],
    ['', '{'],
    ['if-digit', '    <span class="kw">if</span> (<span class="kw">char</span>.IsDigit(c))'],
    ['num-acc', '        number = number * 10 + (c - \'0\');'],
    ['if-plus', '    <span class="kw">else if</span> (c == \'+\')'],
    ['plus-body', '    { result += sign * number; number = 0; sign = 1; }'],
    ['if-minus', '    <span class="kw">else if</span> (c == \'-\')'],
    ['minus-body', '    { result += sign * number; number = 0; sign = -1; }'],
    ['if-open', '    <span class="kw">else if</span> (c == \'(\')'],
    ['open-body', '    { stack.Push(result); stack.Push(sign); result = 0; sign = 1; }'],
    ['if-close', '    <span class="kw">else if</span> (c == \')\')'],
    ['close-body', '    { result += sign * number; number = 0; result *= stack.Pop(); result += stack.Pop(); }'],
    ['', '}'],
    ['ret', '<span class="kw">return</span> result + sign * number;'],
  ];

  $('code').innerHTML = CODE.map(([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => { codeLines[el.dataset.id] = el; });

  const TAGS = {
    start: ['Start', ''],
    digit: ['Read digit', ''],
    op: ['Operator', ''],
    push: ['Open parenthesis (Push)', ''],
    pop: ['Close parenthesis (Pop)', ''],
    skip: ['Space', 'skip'],
    done: ['Done', 'ok'],
  };

  let exprText = '(1+(4+5+2)-3)+(6+8)';
  let steps = [];
  let idx = 0;
  let timer = null;

  function validateExpr(raw) {
    if (!raw || raw.length === 0 || raw.length > MAX_LEN) return null;
    if (!/^[0-9+\-() ]+$/.test(raw)) return null;
    let depth = 0;
    let hasDigit = false;
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (ch >= '0' && ch <= '9') hasDigit = true;
      if (ch === '(') depth++;
      if (ch === ')') {
        depth--;
        if (depth < 0) return null;
      }
    }
    if (depth !== 0 || !hasDigit) return null;
    return raw;
  }

  function render() {
    const st = steps[idx];

    let charsHtml = '';
    for (let i = 0; i < st.expr.length; i++) {
      const ch = st.expr[i];
      const disp = ch === ' ' ? '␣' : ch;
      let state = 'plain';
      if (i < st.pos) state = 'done';
      else if (i === st.pos) state = 'cur';
      else if (ch === '(' || ch === ')') state = 'paren';
      const tag = i === st.pos ? '<span class="t-num">c</span>' : '';
      charsHtml += `<div class="item"><div class="tags">${tag}</div><div class="chip" data-state="${state}">${disp}</div></div>`;
    }
    $('chars-line').innerHTML = charsHtml;

    if (st.stack.length === 0) {
      $('stack-row').innerHTML = '<p class="empty-note">The stack is empty.</p>';
    } else {
      const frames = [];
      for (let i = 0; i < st.stack.length; i += 2) {
        const r = st.stack[i];
        const s = st.stack[i + 1];
        frames.push(`<span class="frame">res: ${r}, sign: ${s >= 0 ? '+1' : '-1'}</span>`);
      }
      $('stack-row').innerHTML = frames.join('');
    }

    const vars = [
      ['c', st.cVal],
      ['number', st.number],
      ['sign', st.sign >= 0 ? '+1' : '-1'],
      ['result', st.result],
    ];
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

    document.querySelectorAll('.presets button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.e === exprText)));
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Play';
  }

  function restart(validExpr) {
    stop();
    exprText = validExpr;
    steps = buildSteps(exprText);
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
    }, 950);
  });
  document.querySelectorAll('.presets button').forEach((b) => b.addEventListener('click', () => {
    $('expr-input').value = b.dataset.e;
    $('expr-err').hidden = true;
    restart(b.dataset.e);
  }));
  $('expr-input').addEventListener('input', (e) => {
    const valid = validateExpr(e.target.value);
    if (!valid) { $('expr-err').hidden = false; return; }
    $('expr-err').hidden = true;
    restart(valid);
  });
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart(exprText);
})();
