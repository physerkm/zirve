(function () {
  var M = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]];
  var ROWS = M.length, COLS = M[0].length, N = ROWS * COLS;
  function $(id) { return document.getElementById(id); }
  function rowOf(k) { return Math.floor(k / COLS); }
  function colOf(k) { return k % COLS; }
  function valOf(k) { return M[rowOf(k)][colOf(k)]; }

  // Code panel: mirrors the method body in Solution.cs.
  var CODE = [
    ['rows', '<span class="kw">int</span> rows = matrix.Length;'],
    ['cols', '<span class="kw">int</span> cols = matrix[<span class="nu">0</span>].Length;'],
    ['', ''],
    ['left', '<span class="kw">int</span> left = <span class="nu">0</span>;'],
    ['right', '<span class="kw">int</span> right = rows * cols - <span class="nu">1</span>;'],
    ['', ''],
    ['while', '<span class="kw">while</span> (left &lt;= right)'],
    ['', '{'],
    ['mid', '    <span class="kw">int</span> mid = left + (right - left) / <span class="nu">2</span>;'],
    ['value', '    <span class="kw">int</span> value = matrix[mid / cols][mid % cols];'],
    ['', ''],
    ['ifEq', '    <span class="kw">if</span> (value == target)'],
    ['retTrue', '        <span class="kw">return</span> <span class="kw">true</span>;'],
    ['', ''],
    ['ifLt', '    <span class="kw">if</span> (value &lt; target)'],
    ['setLeft', '        left = mid + <span class="nu">1</span>;'],
    ['else', '    <span class="kw">else</span>'],
    ['setRight', '        right = mid - <span class="nu">1</span>;'],
    ['', '}'],
    ['', ''],
    ['retFalse', '<span class="kw">return</span> <span class="kw">false</span>;']
  ];
  $('code').innerHTML = CODE.map(function (l) {
    return '<span class="ln"' + (l[0] ? ' data-id="' + l[0] + '"' : '') + '>' + (l[1] || ' ') + '</span>';
  }).join('');
  var codeLines = {};
  Array.prototype.forEach.call(document.querySelectorAll('.ln[data-id]'), function (el) { codeLines[el.dataset.id] = el; });

  // Matrix + strip
  var cellEls = [], markEls = [];
  for (var k = 0; k < N; k++) cellEls.push([]);
  var mh = '<span></span>';
  for (var c = 0; c < COLS; c++) mh += '<span class="mh">col ' + c + '</span>';
  for (var r = 0; r < ROWS; r++) {
    mh += '<span class="mr">row ' + r + '</span>';
    for (c = 0; c < COLS; c++) {
      var kk = r * COLS + c;
      mh += '<div class="cell" data-k="' + kk + '"><span class="k">' + kk + '</span><span class="v">' + M[r][c] + '</span></div>';
    }
  }
  $('matrix').innerHTML = mh;

  var sh = '';
  for (r = 0; r < ROWS; r++) {
    sh += '<div class="grp"><div class="grp-label">row ' + r + '</div><div class="grp-cells">';
    for (c = 0; c < COLS; c++) {
      var k2 = r * COLS + c;
      sh += '<div class="slot"><div class="scell" tabindex="0" data-k="' + k2 + '" aria-label="Index ' + k2 + ', value ' + M[r][c] + '">' +
        '<span class="v">' + M[r][c] + '</span><span class="k">' + k2 + '</span></div>' +
        '<div class="marks" id="mk-' + k2 + '"></div></div>';
    }
    sh += '</div></div>';
  }
  $('strip').innerHTML = sh;

  Array.prototype.forEach.call(document.querySelectorAll('[data-k]'), function (el) { cellEls[+el.dataset.k].push(el); });
  for (k = 0; k < N; k++) markEls.push($('mk-' + k));

  // Steps
  var TAGS = { init: 'Start', look: 'Look at the middle', goRight: 'Narrow to the right', goLeft: 'Narrow to the left', found: 'Found', end: 'Not found' };

  function buildSteps(t) {
    var S = [], left = 0, right = N - 1, looks = 0, lastMid = null, lastVal = null;
    S.push({
      kind: 'init', left: left, right: right, mid: null, value: null,
      changed: ['rows', 'cols', 'left', 'right'], lines: ['rows', 'cols', 'left', 'right'],
      text: 'At first the search range is the whole list: <code>left = 0</code>, <code>right = rows * cols - 1 = ' + ROWS + ' * ' + COLS + ' - 1 = ' + (N - 1) + '</code>. Number to find: <b>' + t + '</b>.'
    });
    while (left <= right) {
      var half = Math.floor((right - left) / 2), mid = left + half, r = rowOf(mid), c = colOf(mid), v = M[r][c];
      looks++; lastMid = mid; lastVal = v;
      var txt = 'The middle of the range: <code>mid = ' + left + ' + (' + right + ' - ' + left + ') / 2 = ' + mid + '</code>.';
      if ((right - left) % 2 === 1) txt += ' (In C#, integer division drops the fraction: ' + (right - left) + ' / 2 = ' + half + '.)';
      txt += ' In the matrix, this position is at <code>row = ' + mid + ' / ' + COLS + ' = ' + r + '</code>, <code>column = ' + mid + ' % ' + COLS + ' = ' + c + '</code>. So <code>value = matrix[' + r + '][' + c + '] = ' + v + '</code>.';
      S.push({ kind: 'look', left: left, right: right, mid: mid, value: v, changed: ['mid', 'value'], lines: ['while', 'mid', 'value'], text: txt });

      if (v === t) {
        S.push({
          kind: 'found', left: left, right: right, mid: mid, value: v, changed: [], lines: ['ifEq', 'retTrue'],
          text: '<code>' + v + ' == ' + t + '</code>: this is the number we are looking for. <code>return true</code>. We looked at only ' + looks + ' of the ' + N + ' cells.'
        });
        return S;
      }
      if (v < t) {
        var goneR = mid - left + 1;
        left = mid + 1;
        S.push({
          kind: 'goRight', left: left, right: right, mid: mid, value: v, changed: ['left'], lines: ['ifLt', 'setLeft'],
          text: '<code>' + v + ' &lt; ' + t + '</code>. Since the list is sorted, ' + v + ' and every number to its left are smaller than ' + t + '. If the target exists, it is on the right: <code>left = mid + 1 = ' + left + '</code>. This step eliminated ' + goneR + ' numbers.'
        });
      } else {
        var goneL = right - mid + 1;
        right = mid - 1;
        S.push({
          kind: 'goLeft', left: left, right: right, mid: mid, value: v, changed: ['right'], lines: ['ifLt', 'else', 'setRight'],
          text: '<code>' + v + ' &gt; ' + t + '</code>. Since the list is sorted, ' + v + ' and every number to its right are larger than ' + t + '. If the target exists, it is on the left: <code>right = mid - 1 = ' + right + '</code>. This step eliminated ' + goneL + ' numbers.'
        });
      }
    }
    S.push({
      kind: 'end', left: left, right: right, mid: lastMid, value: lastVal, changed: [], lines: ['while', 'retFalse'],
      text: '<code>left = ' + left + '</code>, <code>right = ' + right + '</code>. Since left is greater than right, the condition <code>while (left &lt;= right)</code> is now false. There are no numbers left to check, so ' + t + ' is not in the matrix: <code>return false</code>. We decided by looking at ' + looks + ' of the ' + N + ' cells.'
    });
    return S;
  }

  function cellState(s, k) {
    var showMid = s.kind === 'look';
    if (s.kind === 'found' && k === s.mid) return 'found';
    if (showMid && k === s.mid) return 'mid';
    return (k >= s.left && k <= s.right) ? 'in' : 'gone';
  }

  var target = 13, steps = buildSteps(target), idx = 0;

  function render() {
    var s = steps[idx];
    for (var k = 0; k < N; k++) {
      var st = cellState(s, k);
      var wasMid = (s.kind === 'goRight' || s.kind === 'goLeft') && k === s.mid ? '1' : '0';
      cellEls[k].forEach(function (el) { el.dataset.state = st; el.dataset.wasMid = wasMid; });
      var tags = [];
      if (k === s.left) tags.push('left');
      if ((s.kind === 'look' || s.kind === 'found') && k === s.mid) tags.push('mid');
      if (k === s.right) tags.push('right');
      markEls[k].innerHTML = tags.length
        ? '<span class="arrow" aria-hidden="true">▲</span>' + tags.map(function (t) { return '<span class="mark-' + t + '">' + t + '</span>'; }).join('')
        : '';
    }

    var vars = [['rows', ROWS], ['cols', COLS], ['left', s.left], ['right', s.right], ['mid', s.mid], ['value', s.value]];
    $('vars').innerHTML = vars.map(function (v) {
      var cls = s.changed.indexOf(v[0]) >= 0 ? ' changed' : '';
      return '<div class="var' + cls + '"><dt>' + v[0] + '</dt><dd>' + (v[1] === null ? '—' : v[1]) + '</dd></div>';
    }).join('');

    Object.keys(codeLines).forEach(function (id) { codeLines[id].classList.toggle('hl', s.lines.indexOf(id) >= 0); });

    $('step-count').textContent = 'Step ' + (idx + 1) + ' / ' + steps.length;
    $('step-tag').textContent = TAGS[s.kind];
    $('step-tag').dataset.kind = s.kind;
    $('step-text').innerHTML = s.text;
    $('prev').disabled = idx === 0;
    $('reset').disabled = idx === 0;
    $('next').disabled = idx === steps.length - 1;

    Array.prototype.forEach.call(document.querySelectorAll('.presets button'), function (b) {
      b.setAttribute('aria-pressed', String(+b.dataset.t === target));
    });
  }

  function restart(t) { target = t; steps = buildSteps(t); idx = 0; render(); }

  $('next').addEventListener('click', function () { if (idx < steps.length - 1) { idx++; render(); } });
  $('prev').addEventListener('click', function () { if (idx > 0) { idx--; render(); } });
  $('reset').addEventListener('click', function () { idx = 0; render(); });
  Array.prototype.forEach.call(document.querySelectorAll('.presets button'), function (b) {
    b.addEventListener('click', function () { $('target').value = b.dataset.t; $('target-err').hidden = true; restart(+b.dataset.t); });
  });
  $('target').addEventListener('input', function (e) {
    var raw = e.target.value.trim(), t = Number(raw);
    if (raw === '' || !Number.isInteger(t) || t < -10000 || t > 10000) { $('target-err').hidden = false; return; }
    $('target-err').hidden = true;
    restart(t);
  });
  document.addEventListener('keydown', function (e) {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') $('next').click();
    else if (e.key === 'ArrowLeft') $('prev').click();
  });

  // Index probe: shows where a list position lives in the matrix.
  var DEFAULT_PROBE = 'Hover over or tap a box: you will see here where that position lives in the matrix.';
  var probed = null;
  function probe(k) {
    if (probed !== null) cellEls[probed].forEach(function (el) { el.classList.remove('probe'); });
    probed = k;
    if (k === null) { $('probe').textContent = DEFAULT_PROBE; return; }
    cellEls[k].forEach(function (el) { el.classList.add('probe'); });
    $('probe').innerHTML = 'Position <b>' + k + '</b> → row = ' + k + ' / ' + COLS + ' = ' + rowOf(k) + ', column = ' + k + ' % ' + COLS + ' = ' + colOf(k) + ' → <code>matrix[' + rowOf(k) + '][' + colOf(k) + '] = ' + valOf(k) + '</code>';
  }
  ['matrix', 'strip'].forEach(function (id) {
    var host = $(id);
    host.addEventListener('pointerover', function (e) { var el = e.target.closest('[data-k]'); if (el) probe(+el.dataset.k); });
    host.addEventListener('pointerleave', function () { probe(null); });
    host.addEventListener('focusin', function (e) { var el = e.target.closest('[data-k]'); if (el) probe(+el.dataset.k); });
    host.addEventListener('focusout', function () { probe(null); });
  });

  probe(null);
  render();
})();
