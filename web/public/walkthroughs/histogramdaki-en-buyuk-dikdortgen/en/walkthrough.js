(() => {
  const $ = (id) => document.getElementById(id);
  const MAX_LEN = 8;

  function buildSteps(heights) {
    const steps = [];
    const stack = [];
    let maxArea = 0;
    let bestRect = null; // { l, r, h }

    const snap = (s) =>
      steps.push({
        heights,
        stack: stack.map((x) => ({ ...x })),
        i: undefined,
        start: undefined,
        area: undefined,
        maxArea,
        rect: null,
        bestRect: bestRect ? { ...bestRect } : null,
        changed: [],
        ...s,
      });

    snap({
      kind: 'start',
      lines: ['init'],
      changed: ['maxArea'],
      text: `We start with an empty stack and <code>maxArea = 0</code>. We will check every bar from left to right.`,
    });

    for (let i = 0; i < heights.length; i++) {
      let start = i;
      const h = heights[i];

      while (stack.length > 0 && stack[stack.length - 1].height > h) {
        const { start: prevStart, height: prevHeight } = stack.pop();
        const width = i - prevStart;
        const area = prevHeight * width;
        const oldMax = maxArea;
        if (area > maxArea) {
          maxArea = area;
          bestRect = { l: prevStart, r: i - 1, h: prevHeight };
        }
        start = prevStart;
        snap({
          kind: 'pop',
          i,
          start,
          area,
          rect: { l: prevStart, r: i - 1, h: prevHeight },
          lines: ['for', 'while', 'pop', 'max1', 'ext'],
          changed: area > oldMax ? ['start', 'area', 'maxArea'] : ['start', 'area'],
          text: `<code>heights[${i}] = ${h}</code> &lt; top height <code>${prevHeight}</code>. <code>(${prevStart}, ${prevHeight})</code> is popped: width <code>${i} - ${prevStart} = ${width}</code>, area <code>${prevHeight} · ${width} = ${area}</code>. The left boundary is extended back to <code>start = ${start}</code>.`,
        });
      }

      stack.push({ start, height: h });
      snap({
        kind: 'push',
        i,
        start,
        lines: ['for', 'start', 'push'],
        changed: ['i', 'start'],
        text: `For <code>i = ${i}</code> (height <code>${h}</code>), the pair <code>(start: ${start}, height: ${h})</code> is pushed onto the stack.`,
      });
    }

    while (stack.length > 0) {
      const { start, height } = stack.pop();
      const width = heights.length - start;
      const area = height * width;
      const oldMax = maxArea;
      if (area > maxArea) {
        maxArea = area;
        bestRect = { l: start, r: heights.length - 1, h: height };
      }
      snap({
        kind: 'pop',
        i: heights.length,
        start,
        area,
        rect: { l: start, r: heights.length - 1, h: height },
        lines: ['w2', 'pop2', 'max2'],
        changed: area > oldMax ? ['start', 'area', 'maxArea'] : ['start', 'area'],
        text: `The array is done; <code>(${start}, ${height})</code> is popped from the stack. The right boundary is the end of the array (<code>${heights.length}</code>): width <code>${heights.length} - ${start} = ${width}</code>, area <code>${height} · ${width} = ${area}</code>.`,
      });
    }

    snap({
      kind: 'done',
      lines: ['ret'],
      text: `The stack is completely empty. The largest rectangle area is <code>maxArea = ${maxArea}</code>. <code>return ${maxArea}</code>.`,
    });

    return steps;
  }

  const CODE = [
    ['init', '<span class="kw">var</span> stack = <span class="kw">new</span> Stack&lt;(<span class="kw">int</span> Start, <span class="kw">int</span> Height)&gt;(); <span class="kw">int</span> maxArea = 0;'],
    ['for', '<span class="kw">for</span> (<span class="kw">int</span> i = 0; i &lt; heights.Length; i++)'],
    ['', '{'],
    ['start', '    <span class="kw">int</span> start = i;'],
    ['while', '    <span class="kw">while</span> (stack.Count &gt; 0 &amp;&amp; stack.Peek().Height &gt; heights[i])'],
    ['', '    {'],
    ['pop', '        <span class="kw">var</span> (prevStart, prevHeight) = stack.Pop();'],
    ['max1', '        maxArea = Math.Max(maxArea, prevHeight * (i - prevStart));'],
    ['ext', '        start = prevStart;'],
    ['', '    }'],
    ['push', '    stack.Push((start, heights[i]));'],
    ['', '}'],
    ['w2', '<span class="kw">while</span> (stack.Count &gt; 0)'],
    ['', '{'],
    ['pop2', '    <span class="kw">var</span> (start, height) = stack.Pop();'],
    ['max2', '    maxArea = Math.Max(maxArea, height * (heights.Length - start));'],
    ['', '}'],
    ['ret', '<span class="kw">return</span> maxArea;'],
  ];
  $('code').innerHTML = CODE.map(
    ([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`
  ).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => {
    codeLines[el.dataset.id] = el;
  });

  const TAGS = {
    start: ['Start', ''],
    push: ['Push', ''],
    pop: ['Compute area', 'pop'],
    done: ['Done', 'ok'],
  };

  let listText = '2, 1, 5, 6, 2, 3';
  let steps = [];
  let idx = 0;
  let timer = null;

  function parse(raw) {
    const parts = raw.split(/[\s,]+/).filter(Boolean);
    if (parts.length === 0 || parts.length > MAX_LEN) return null;
    const out = parts.map(Number);
    return out.every((v) => Number.isInteger(v) && v >= 0 && v <= 20) ? out : null;
  }

  function render() {
    const st = steps[idx];
    const maxH = Math.max(1, ...st.heights);

    $('hist').innerHTML = st.heights
      .map((h, k) => {
        const px = Math.max(8, Math.round((h / maxH) * 130));
        let state = 'plain';
        if (st.rect && k >= st.rect.l && k <= st.rect.r) {
          state = 'rect';
        } else if (st.kind === 'done' && st.bestRect && k >= st.bestRect.l && k <= st.bestRect.r) {
          state = 'best';
        }
        const curCls = k === st.i ? ' cur' : '';
        return `<div class="bar-col">
          <span class="bar-val">${h}</span>
          <div class="bar${curCls}" data-state="${state}" style="height:${px}px"></div>
          <span class="bar-idx">[${k}]</span>
        </div>`;
      })
      .join('');

    $('stack-box').innerHTML =
      st.stack.length === 0
        ? '<p class="empty-note">Stack is empty</p>'
        : st.stack
            .map(
              (item, k) =>
                `<div class="stk-item${k === st.stack.length - 1 ? ' top' : ''}">
                  <span>start: ${item.start}</span>
                  <span>h: ${item.height}</span>
                </div>`
            )
            .join('');

    const vars = [
      ['i', st.i],
      ['start', st.start],
      ['area', st.area],
      ['maxArea', st.maxArea],
    ];
    $('vars').innerHTML = vars
      .map(
        ([name, v]) =>
          `<div class="var${st.changed.includes(name) ? ' changed' : ''}"><dt>${name}</dt><dd>${
            v === undefined ? '—' : v
          }</dd></div>`
      )
      .join('');

    Object.keys(codeLines).forEach((id) =>
      codeLines[id].classList.toggle('hl', st.lines.includes(id))
    );

    const [tagText, tagKind] = TAGS[st.kind];
    $('step-count').textContent = `Step ${idx + 1} / ${steps.length}`;
    $('step-tag').textContent = tagText;
    $('step-tag').dataset.kind = tagKind;
    $('step-text').innerHTML = st.text;

    $('prev-btn').disabled = idx === 0;
    $('reset').disabled = idx === 0;
    $('next-btn').disabled = idx === steps.length - 1;

    document.querySelectorAll('.presets button').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.l === listText));
    });
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    $('play').textContent = '▶ Play';
  }

  function restart(text, parsed) {
    stop();
    listText = text;
    steps = buildSteps(parsed);
    idx = 0;
    render();
  }

  $('next-btn').addEventListener('click', () => {
    stop();
    if (idx < steps.length - 1) {
      idx++;
      render();
    }
  });
  $('prev-btn').addEventListener('click', () => {
    stop();
    if (idx > 0) {
      idx--;
      render();
    }
  });
  $('reset').addEventListener('click', () => {
    stop();
    idx = 0;
    render();
  });
  $('play').addEventListener('click', () => {
    if (timer) {
      stop();
      return;
    }
    if (idx === steps.length - 1) {
      idx = 0;
      render();
    }
    $('play').textContent = '❚❚ Pause';
    timer = setInterval(() => {
      if (idx < steps.length - 1) {
        idx++;
        render();
      }
      if (idx === steps.length - 1) stop();
    }, 1100);
  });

  document.querySelectorAll('.presets button').forEach((b) =>
    b.addEventListener('click', () => {
      $('list').value = b.dataset.l;
      $('list-err').hidden = true;
      restart(b.dataset.l, parse(b.dataset.l));
    })
  );

  $('list').addEventListener('input', (e) => {
    const parsed = parse(e.target.value);
    if (!parsed) {
      $('list-err').hidden = false;
      return;
    }
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
