(() => {
  const $ = (id) => document.getElementById(id);

  const PRESETS = [
    { target: 12, pos: [10, 8, 0, 5, 3], spd: [2, 4, 1, 1, 3] },
    { target: 100, pos: [0, 2, 4], spd: [4, 2, 1] },
    { target: 10, pos: [6, 8], spd: [3, 2] },
    { target: 15, pos: [2, 5, 9, 12], spd: [5, 2, 3, 1] },
  ];

  const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

  function buildSteps(preset) {
    const { target, pos, spd } = preset;
    const cars = pos
      .map((p, i) => ({ pos: p, spd: spd[i], time: (target - p) / spd[i] }))
      .sort((a, b) => b.pos - a.pos);

    const steps = [];
    let fleets = 0;
    let leadTime = 0;
    const states = new Array(cars.length).fill('pending');
    const fleetIds = new Array(cars.length).fill(null);

    const snap = (s) =>
      steps.push({
        target,
        cars,
        states: states.slice(),
        fleetIds: fleetIds.slice(),
        cur: -1,
        carPos: undefined,
        carTime: undefined,
        fleets,
        leadTime,
        changed: [],
        ...s,
      });

    snap({
      kind: 'start',
      lines: ['pair', 'sort', 'init'],
      changed: ['fleets', 'leadTime'],
      text: `Arabalar hedefe (<code>target = ${target}</code>) en yakın olandan en uzağa doğru sıralandı ve her birinin engelsiz varış süresi <code>(target - pos) / speed</code> hesaplandı.`,
    });

    for (let i = 0; i < cars.length; i++) {
      const c = cars[i];
      if (c.time > leadTime) {
        const oldLead = leadTime;
        fleets++;
        leadTime = c.time;
        states[i] = 'leader';
        fleetIds[i] = fleets;
        snap({
          kind: 'leader',
          cur: i,
          carPos: c.pos,
          carTime: fmt(c.time),
          lines: ['loop', 'if', 'inc', 'lead'],
          changed: ['car.Pos', 'car.Time', 'fleets', 'leadTime'],
          text: `Konum <code>${c.pos}</code> (hız ${c.spd}): varış süresi <code>${fmt(c.time)}</code> saat &gt; <code>leadTime (${fmt(oldLead)})</code>. Öndeki filoya yetişemez; <b>Filo #${fleets}</b> başlattı ve <code>leadTime = ${fmt(leadTime)}</code> oldu.`,
        });
      } else {
        states[i] = 'merged';
        fleetIds[i] = fleets;
        snap({
          kind: 'merge',
          cur: i,
          carPos: c.pos,
          carTime: fmt(c.time),
          lines: ['loop', 'if'],
          changed: ['car.Pos', 'car.Time'],
          text: `Konum <code>${c.pos}</code> (hız ${c.spd}): varış süresi <code>${fmt(c.time)}</code> saat &le; <code>leadTime (${fmt(leadTime)})</code>. Hedefe varmadan öndeki <b>Filo #${fleets}</b>'e yetişip katılır; <code>leadTime</code> değişmez.`,
        });
      }
    }

    snap({
      kind: 'done',
      lines: ['ret'],
      text: `Tüm arabalar incelendi. Hedefe toplam <b>${fleets}</b> araba filosu ulaşır. <code>return ${fleets}</code>.`,
    });

    return steps;
  }

  const CODE = [
    ['pair', 'cars[i] = (position[i], (<span class="kw">double</span>)(target - position[i]) / speed[i]);'],
    ['sort', 'Array.Sort(cars, (a, b) =&gt; b.Pos.CompareTo(a.Pos));'],
    ['init', '<span class="kw">int</span> fleets = 0; <span class="kw">double</span> leadTime = 0;'],
    ['', ''],
    ['loop', '<span class="kw">foreach</span> (<span class="kw">var</span> car <span class="kw">in</span> cars)'],
    ['', '{'],
    ['if', '    <span class="kw">if</span> (car.Time &gt; leadTime)'],
    ['', '    {'],
    ['inc', '        fleets++;'],
    ['lead', '        leadTime = car.Time;'],
    ['', '    }'],
    ['', '}'],
    ['ret', '<span class="kw">return</span> fleets;'],
  ];
  $('code').innerHTML = CODE.map(
    ([id, html]) => `<span class="ln"${id ? ` data-id="${id}"` : ''}>${html || ' '}</span>`
  ).join('');
  const codeLines = {};
  document.querySelectorAll('.ln[data-id]').forEach((el) => {
    codeLines[el.dataset.id] = el;
  });

  const TAGS = {
    start: ['Sıralama', ''],
    leader: ['Yeni filo', ''],
    merge: ['Filoya katıldı', 'skip'],
    done: ['Tamamlandı', 'ok'],
  };

  let presetIdx = 0;
  let steps = [];
  let idx = 0;
  let timer = null;

  function render() {
    const st = steps[idx];

    $('cars-row').innerHTML = st.cars
      .map((c, i) => {
        const state = st.states[i];
        const fid = st.fleetIds[i];
        const badge =
          state === 'leader'
            ? `Filo #${fid} (Lider)`
            : state === 'merged'
            ? `Filo #${fid}'e katıldı`
            : 'bekliyor';
        return `<div class="car-card${i === st.cur ? ' cur' : ''}" data-state="${state}">
          <div class="car-top"><span>pos: ${c.pos}</span><span>hız: ${c.spd}</span></div>
          <div class="car-time">${fmt(c.time)} sa</div>
          <span class="car-badge">${badge}</span>
        </div>`;
      })
      .join('');

    const vars = [
      ['target', st.target],
      ['car.Pos', st.carPos],
      ['car.Time', st.carTime],
      ['leadTime', fmt(st.leadTime)],
      ['fleets', st.fleets],
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
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    $('play').textContent = '▶ Oynat';
  }

  function loadPreset(pIdx) {
    stop();
    presetIdx = pIdx;
    steps = buildSteps(PRESETS[pIdx]);
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
    $('play').textContent = '❚❚ Durdur';
    timer = setInterval(() => {
      if (idx < steps.length - 1) {
        idx++;
        render();
      }
      if (idx === steps.length - 1) stop();
    }, 1100);
  });

  document.querySelectorAll('.presets button').forEach((b) =>
    b.addEventListener('click', () => loadPreset(Number(b.dataset.p)))
  );

  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  loadPreset(0);
})();
