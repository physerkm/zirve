(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const fmt = (v) => (Array.isArray(v) ? `[${v.map(fmt).join(', ')}]` : v === null ? 'null' : typeof v === 'string' ? `"${v}"` : String(v));
  const c = (v) => `<code>${esc(typeof v === 'string' ? v : fmt(v))}</code>`;

  // Girdi ayrıştırma yardımcıları: geçersiz girdide null döner.
  const P = {
    items(raw) {
      const t = String(raw).trim().replace(/^\[/, '').replace(/\]$/, '').trim();
      return t === '' ? [] : t.split(/[\s,]+/).filter(Boolean);
    },
    int(raw, min, max) {
      const t = String(raw).trim();
      if (!/^-?\d+$/.test(t)) return null;
      const v = Number(t);
      return v >= min && v <= max ? v : null;
    },
    ints(raw, min, max, minLen, maxLen) {
      const parts = P.items(raw);
      if (parts.length < minLen || parts.length > maxLen) return null;
      const out = [];
      for (const p of parts) {
        const v = P.int(p, min, max);
        if (v === null) return null;
        out.push(v);
      }
      return out;
    },
    word(raw, re, minLen, maxLen) {
      const t = String(raw).trim().replace(/^"|"$/g, '');
      return t.length >= minLen && t.length <= maxLen && re.test(t) ? t : null;
    },
    words(raw, re, minLen, maxLen, maxWordLen) {
      const parts = String(raw).trim().replace(/^\[/, '').replace(/\]$/, '').split(/[\s,]+/).map((w) => w.replace(/^"|"$/g, '')).filter(Boolean);
      if (parts.length < minLen || parts.length > maxLen) return null;
      return parts.every((w) => re.test(w) && w.length <= maxWordLen) ? parts : null;
    },
    // "1 0 1; 0 1 1" ya da "[[1,0,1],[0,1,1]]" biçiminde ızgara.
    rows(raw) {
      const t = String(raw).trim();
      if (t.startsWith('[[')) return t.slice(2, -2).split(/\]\s*,\s*\[/);
      return t.split(/[;|]/).map((r) => r.trim()).filter((r) => r !== '');
    },
    intGrid(raw, min, max, maxR, maxC) {
      const rows = P.rows(raw);
      if (rows.length < 1 || rows.length > maxR) return null;
      const g = rows.map((r) => P.ints(r, min, max, 1, maxC));
      if (g.some((r) => r === null) || g.some((r) => r.length !== g[0].length)) return null;
      return g;
    },
    charGrid(raw, re, maxR, maxC) {
      const rows = P.rows(raw);
      if (rows.length < 1 || rows.length > maxR) return null;
      const g = rows.map((r) => {
        const cells = r.replace(/["']/g, '').split(/[\s,]+/).filter(Boolean);
        const flat = cells.length === 1 && cells[0].length > 1 ? cells[0].split('') : cells;
        return flat.length >= 1 && flat.length <= maxC && flat.every((ch) => ch.length === 1 && re.test(ch)) ? flat : null;
      });
      if (g.some((r) => r === null) || g.some((r) => r.length !== g[0].length)) return null;
      return g;
    },
    pairs(raw, min, max, minLen, maxLen, size = 2) {
      const t = String(raw).trim();
      const groups = t.startsWith('[[') ? t.slice(2, -2).split(/\]\s*,\s*\[/) : t.split(/[;|]/).map((r) => r.trim()).filter(Boolean);
      if (t === '' || t === '[]') return minLen === 0 ? [] : null;
      if (groups.length < minLen || groups.length > maxLen) return null;
      const out = groups.map((g) => P.ints(g, min, max, size, size));
      return out.some((g) => g === null) ? null : out;
    },
    // Ağaç: seviye sıralı "3, 9, 20, null, null, 15, 7".
    tree(raw, min, max, maxLen) {
      const parts = P.items(raw);
      if (parts.length > maxLen) return null;
      const out = [];
      for (const p of parts) {
        if (p === 'null' || p === '#') { out.push(null); continue; }
        const v = P.int(p, min, max);
        if (v === null) return null;
        out.push(v);
      }
      if (out.length > 0 && out[0] === null) return null;
      while (out.length && out[out.length - 1] === null) out.pop();
      return out;
    },
  };

  // Seviye sıralı diziden düğüm yapısı: { i, val, left, right, depth }.
  function treeNodes(a) {
    const nodes = [];
    if (!a.length || a[0] === null) return { root: null, nodes };
    const root = { i: 0, id: 0, val: a[0], left: null, right: null, depth: 0 };
    nodes.push(root);
    const q = [root];
    let k = 1;
    while (q.length && k < a.length) {
      const n = q.shift();
      for (const side of ['left', 'right']) {
        if (k < a.length && a[k] !== null) {
          const ch = { i: k, id: k, val: a[k], left: null, right: null, depth: n.depth + 1 };
          n[side] = ch;
          nodes.push(ch);
          q.push(ch);
        }
        k++;
      }
    }
    return { root, nodes };
  }

  // Düğüm yapısından tekrar seviye sıralı dizi (sondaki null'lar atılır).
  function treeArray(root) {
    const out = [];
    const q = [root];
    while (q.length) {
      const n = q.shift();
      if (n === null || n === undefined) { out.push(null); continue; }
      out.push(n.val);
      q.push(n.left || null, n.right || null);
    }
    while (out.length && out[out.length - 1] === null) out.pop();
    return out;
  }

  // Düğüm kimlikleri korunarak anlık görüntü: { a: seviye sıralı değerler, ids: aynı konumdaki düğüm kimlikleri }.
  function treeSnap(root) {
    const a = [];
    const ids = [];
    const q = [root || null];
    while (q.length) {
      const n = q.shift();
      if (!n) { a.push(null); ids.push(null); continue; }
      a.push(n.val);
      ids.push(n.id);
      q.push(n.left || null, n.right || null);
    }
    while (a.length && a[a.length - 1] === null) { a.pop(); ids.pop(); }
    return { a, ids };
  }

  const empty = (p) => `<p class="empty">${p.empty || 'boş'}</p>`;
  const cellv = (v) => (v === null || v === undefined ? '·' : esc(v));

  const R = {
    arr(p) {
      if (!p.a.length) return empty(p);
      return `<div class="cells${p.wide ? ' wide' : ''}">${p.a.map((v, i) => {
        const cls = (p.cls && p.cls[i]) || '';
        const ptr = (p.ptr && p.ptr[i]) || '';
        const ix = p.noIdx ? '' : `<span class="ix">${p.idx ? esc(p.idx[i]) : i}</span>`;
        return `<div class="cell ${cls}">${ix}<span class="v">${cellv(v)}</span>${p.noPtr ? '' : `<span class="pt">${ptr}</span>`}</div>`;
      }).join('')}</div>`;
    },
    grid(p) {
      if (!p.g.length) return empty(p);
      const head = p.cols ? `<tr><th></th>${p.cols.map((h) => `<th>${esc(h)}</th>`).join('')}</tr>` : '';
      const body = p.g.map((row, r) => `<tr>${p.cols || p.rows ? `<th>${p.rows ? esc(p.rows[r]) : r}</th>` : ''}${row.map((v, k) => `<td class="${(p.cls && p.cls[`${r},${k}`]) || ''}">${v === null || v === undefined ? '' : esc(v)}</td>`).join('')}</tr>`).join('');
      return `<div class="gscroll"><table class="gt${p.small ? ' small' : ''}"><tbody>${head}${body}</tbody></table></div>`;
    },
    map(p) {
      if (!p.e.length) return empty(p);
      return `<div class="kv">${p.e.map(([k, v]) => {
        let cls = '';
        if (p.hl && p.hl.includes(k)) cls += ' cur';
        if (p.ok && p.ok.includes(k)) cls += ' ok';
        if (p.bad && p.bad.includes(k)) cls += ' bad';
        return `<span class="chip${cls}"><b>${esc(k)}</b>${v === undefined ? '' : `<span class="ar">→</span>${esc(Array.isArray(v) ? fmt(v) : v)}`}</span>`;
      }).join('')}</div>`;
    },
    ll(p) {
      if (!p.a.length) return empty(p);
      const parts = p.a.map((v, i) => {
        const cls = (p.cls && p.cls[i]) || '';
        const ptr = (p.ptr && p.ptr[i]) || '';
        return `<div class="lln ${cls}"><span class="v">${cellv(v)}</span><span class="pt">${ptr}</span></div>`;
      });
      const tail = p.cycle !== undefined && p.cycle >= 0 ? `<span class="lla">→</span><span class="llnull">↩ ${p.cycle}. düğüm</span>` : (p.noNull ? '' : '<span class="lla">→</span><span class="llnull">null</span>');
      return `<div class="llrow">${parts.join('<span class="lla">→</span>')}${tail}</div>`;
    },
    tree(p) {
      const { root, nodes } = treeNodes(p.a);
      if (!root) return empty(p);
      let order = 0;
      const pos = new Map();
      (function walk(n) { if (!n) return; walk(n.left); pos.set(n, order++); walk(n.right); })(root);
      const depth = Math.max(...nodes.map((n) => n.depth));
      const gap = p.gap || 44;
      const w = Math.max(order * gap + 16, 120);
      const h = depth * 62 + 52;
      const X = (n) => 8 + gap / 2 + pos.get(n) * gap;
      const Y = (n) => 26 + n.depth * 62;
      const key = (n) => (p.byVal ? n.val : p.ids ? p.ids[n.i] : n.i);
      let edges = '';
      let circles = '';
      for (const n of nodes) {
        for (const ch of [n.left, n.right]) {
          if (ch) edges += `<line class="te ${(p.ecls && p.ecls[key(ch)]) || ''}" x1="${X(n)}" y1="${Y(n)}" x2="${X(ch)}" y2="${Y(ch)}"/>`;
        }
        const sub = p.sub && p.sub[key(n)] !== undefined ? `<text class="tsub" x="${X(n)}" y="${Y(n) + 30}">${esc(p.sub[key(n)])}</text>` : '';
        circles += `<g class="tn ${(p.cls && p.cls[key(n)]) || ''}"><circle cx="${X(n)}" cy="${Y(n)}" r="17"/><text x="${X(n)}" y="${Y(n)}">${esc(n.val)}</text>${sub}</g>`;
      }
      return `<div class="tscroll"><svg class="tsvg" viewBox="0 0 ${w} ${h + (p.sub ? 10 : 0)}" width="${w}" height="${h + (p.sub ? 10 : 0)}" role="img" aria-label="İkili ağaç">${edges}${circles}</svg></div>`;
    },
    graph(p) {
      const ids = p.n;
      if (!ids.length) return empty(p);
      const W2 = p.w || 380;
      const H2 = p.h || 250;
      const at = {};
      ids.forEach((id, k) => {
        if (p.pos && p.pos[id]) { at[id] = [24 + p.pos[id][0] * (W2 - 48), 24 + p.pos[id][1] * (H2 - 48)]; return; }
        const ang = -Math.PI / 2 + (2 * Math.PI * k) / ids.length;
        at[id] = [W2 / 2 + Math.cos(ang) * (W2 / 2 - 30), H2 / 2 + Math.sin(ang) * (H2 / 2 - 28)];
      });
      let edges = '';
      for (const [u, v, wt] of p.e) {
        const [x1, y1] = at[u];
        const [x2, y2] = at[v];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1;
        const sx = x1 + (dx / len) * 18;
        const sy = y1 + (dy / len) * 18;
        const ex = x2 - (dx / len) * (p.dir ? 22 : 18);
        const ey = y2 - (dy / len) * (p.dir ? 22 : 18);
        const cls = (p.ecls && (p.ecls[`${u}-${v}`] || (!p.dir && p.ecls[`${v}-${u}`]))) || '';
        edges += `<line class="ge ${cls}" x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}"${p.dir ? ` marker-end="url(#${cls.includes('cur') ? 'ahc' : cls.includes('ok') ? 'aho' : 'ah'})"` : ''}/>`;
        if (wt !== undefined) {
          const mx = x1 + dx * 0.4 + (-dy / len) * 10;
          const my = y1 + dy * 0.4 + (dx / len) * 10;
          edges += `<text class="gw" x="${mx.toFixed(1)}" y="${my.toFixed(1)}">${esc(wt)}</text>`;
        }
      }
      const nodes = ids.map((id) => `<g class="gn ${(p.cls && p.cls[id]) || ''}"><circle cx="${at[id][0].toFixed(1)}" cy="${at[id][1].toFixed(1)}" r="17"/><text x="${at[id][0].toFixed(1)}" y="${at[id][1].toFixed(1)}">${esc(id)}</text>${p.sub && p.sub[id] !== undefined ? `<text class="tsub" x="${at[id][0].toFixed(1)}" y="${(at[id][1] + 29).toFixed(1)}">${esc(p.sub[id])}</text>` : ''}</g>`).join('');
      const defs = p.dir ? '<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="ahp" d="M0 0L10 5L0 10z"/></marker><marker id="ahc" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="ahp cur" d="M0 0L10 5L0 10z"/></marker><marker id="aho" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="ahp ok" d="M0 0L10 5L0 10z"/></marker></defs>' : '';
      return `<div class="tscroll"><svg class="gsvg" viewBox="0 0 ${W2} ${H2}" width="${W2}" height="${H2}" role="img" aria-label="Graf">${defs}${edges}${nodes}</svg></div>`;
    },
    bars(p) {
      if (!p.a.length) return empty(p);
      const top = Math.max(1, ...p.a.map((v, i) => v + ((p.water && p.water[i]) || 0)));
      const unit = Math.min(22, Math.floor(150 / top));
      return `<div class="bars">${p.a.map((v, i) => {
        const wv = (p.water && p.water[i]) || 0;
        const cls = (p.cls && p.cls[i]) || '';
        return `<div class="bcol ${cls}"><div class="bstack" style="height:${top * unit}px">${wv ? `<div class="bwater" style="height:${wv * unit}px"></div>` : ''}<div class="bbar" style="height:${v * unit}px"></div></div><span class="bv">${esc(v)}</span><span class="ix">${i}</span><span class="pt">${(p.ptr && p.ptr[i]) || ''}</span></div>`;
      }).join('')}</div>`;
    },
    // Trie: düğüm { kids: { harf: düğüm }, end: bool }; düğümler ön ekleriyle anılır.
    trie(p) {
      const lines = [];
      const cl = (prefix) => {
        let k = '';
        if (p.ok && p.ok.includes(prefix)) k = ' ok';
        if (p.bad && p.bad.includes(prefix)) k = ' bad';
        if (p.hl && p.hl.includes(prefix)) k = ' cur';
        return k;
      };
      const walk = (node, prefix, indent, last, isRoot) => {
        if (isRoot) lines.push(`<div class="tl"><span class="tch root${cl('')}">kök</span></div>`);
        else lines.push(`<div class="tl"><span class="tg">${indent}${last ? '└─ ' : '├─ '}</span><span class="tch${cl(prefix)}">${esc(prefix.slice(-1))}</span>${node.end ? '<span class="tend">● kelime sonu</span>' : ''}</div>`);
        const kids = Object.keys(node.kids).sort();
        kids.forEach((k, i) => walk(node.kids[k], prefix + k, isRoot ? '' : indent + (last ? '   ' : '│  '), i === kids.length - 1, false));
      };
      walk(p.root, '', '', true, true);
      return `<div class="trie">${lines.join('')}</div>`;
    },
    html(p) {
      return `<div class="free">${p.html}</div>`;
    },
  };

  const panelHtml = (p) => `<div class="pn${p.half ? ' half' : ''}"><p class="panel-label">${p.label}${p.hint ? ` <span class="hint">${p.hint}</span>` : ''}</p>${R[p.t](p)}</div>`;

  function highlight(line) {
    const at = line.indexOf('//');
    const codePart = at >= 0 ? line.slice(0, at) : line;
    const comment = at >= 0 ? line.slice(at) : '';
    const html = esc(codePart).replace(/(&quot;.*?&quot;|'.')|\b(public|private|static|readonly|const|int|long|uint|bool|string|char|double|void|var|new|return|for|foreach|while|do|if|else|in|out|ref|null|true|false|break|continue|class|this)\b/g, (m, str, kw) => (str ? `<span class="st">${str}</span>` : `<span class="kw">${kw}</span>`));
    return html + (comment ? `<span class="cm">${esc(comment)}</span>` : '');
  }
  function codeLines(src) {
    return src.replace(/^\n+/, '').replace(/\s+$/, '').split('\n').map((l) => {
      const m = l.match(/\s*\/\/@([\w,-]+)\s*$/);
      return { ids: m ? m[1].split(',') : [], text: m ? l.slice(0, m.index) : l };
    });
  }

  const W = {
    code: `
  public bool Insert(int val)
  {
      if (indexOf.ContainsKey(val)) return false;   //@insDup
      indexOf[val] = values.Count;                  //@ins
      values.Add(val);                              //@ins
      return true;                                  //@ins
  }

  public bool Remove(int val)
  {
      if (!indexOf.TryGetValue(val, out var i)) return false; //@remMiss
      var last = values[^1];                        //@swap
      values[i] = last; indexOf[last] = i;          //@swap
      values.RemoveAt(values.Count - 1);            //@pop
      indexOf.Remove(val);                          //@pop
      return true;                                  //@pop
  }

  public int GetRandom() => values[random.Next(values.Count)]; //@rand`,
    parse(v) {
      const parts = String(v.ops).split(';').map((s) => s.trim()).filter(Boolean);
      if (!parts.length || parts.length > 12) return null;
      const ops = [];
      for (const p of parts) {
        const m = p.match(/^(insert|remove)\s+(-?\d+)$/);
        if (m) { const x = P.int(m[2], -99, 99); if (x === null) return null; ops.push({ op: m[1], x }); continue; }
        if (p === 'getRandom') { ops.push({ op: 'getRandom' }); continue; }
        return null;
      }
      const set = new Set();
      for (const o of ops) {
        if (o.op === 'insert') set.add(o.x); else if (o.op === 'remove') set.delete(o.x); else if (!set.size) return 'getRandom boş kümede çağrılamaz.';
      }
      return { ops };
    },
    build({ ops }) {
      const steps = [];
      const values = [];
      const idx = new Map();
      const panels = (cls) => [
        { t: 'arr', label: 'values', a: values.slice(), cls: cls || {}, empty: 'boş' },
        { t: 'map', label: 'indexOf', e: [...idx.entries()].map(([k, i]) => [String(k), i]), empty: 'boş' },
      ];
      steps.push({ tag: 'Başlangıç', text: 'Boş küme.', lines: [], vars: [], panels: panels() });
      for (const o of ops) {
        if (o.op === 'insert') {
          if (idx.has(o.x)) { steps.push({ tag: 'insert', kind: 'bad', text: `<code>insert(${o.x})</code>: zaten var, <code>false</code>.`, lines: ['insDup'], vars: [['val', o.x]], panels: panels({ [idx.get(o.x)]: 'cur' }) }); continue; }
          idx.set(o.x, values.length);
          values.push(o.x);
          steps.push({ tag: 'insert', kind: 'ok', text: `<code>insert(${o.x})</code>: dizinin sonuna (indeks ${values.length - 1}) eklendi, sözlüğe yazıldı. <code>true</code>.`, lines: ['ins'], vars: [['val', o.x]], ch: ['val'], panels: panels({ [values.length - 1]: 'cur' }) });
        } else if (o.op === 'remove') {
          if (!idx.has(o.x)) { steps.push({ tag: 'remove', kind: 'bad', text: `<code>remove(${o.x})</code>: kümede yok, <code>false</code>.`, lines: ['remMiss'], vars: [['val', o.x]], panels: panels() }); continue; }
          const i = idx.get(o.x);
          const last = values[values.length - 1];
          steps.push({ tag: 'remove', text: `<code>remove(${o.x})</code>: konumu <code>${i}</code>. Son eleman <code>${last}</code> bu konuma taşınacak${last === o.x ? ' (silinen zaten son eleman)' : ''}.`, lines: ['swap'], vars: [['val', o.x], ['i', i], ['last', last]], ch: ['i', 'last'], panels: panels({ [i]: 'cur', [values.length - 1]: 'hot' }) });
          values[i] = last;
          idx.set(last, i);
          values.pop();
          idx.delete(o.x);
          steps.push({ tag: 'remove', kind: 'ok', text: `Dizinin sonu silindi ve <code>${o.x}</code> sözlükten çıkarıldı. Her şey O(1). <code>true</code>.`, lines: ['pop'], vars: [['val', o.x]], panels: panels(i < values.length ? { [i]: 'hot' } : {}) });
        } else {
          const pick = values[Math.floor(Math.random() * values.length)];
          steps.push({ tag: 'getRandom', kind: 'ok', text: `<code>getRandom()</code>: 0 ile ${values.length - 1} arasında rastgele bir indeks seçilir; her elemanın olasılığı <code>1/${values.length}</code>. (Bu çalıştırmada <code>${pick}</code>.)`, lines: ['rand'], vars: [['Count', values.length]], panels: panels({ [values.indexOf(pick)]: 'cur' }) });
        }
      }
      return steps;
    },
  };

  const lines = codeLines(W.code);
  $('code').innerHTML = lines.map((l) => `<span class="ln">${highlight(l.text) || ' '}</span>`).join('');
  const lineEls = [...document.querySelectorAll('#code .ln')];
  const inputs = [...document.querySelectorAll('[data-in]')];
  const presetBtns = [...document.querySelectorAll('[data-preset]')];
  const defaultErr = $('in-err').textContent;

  let steps = [];
  let idx = 0;
  let timer = null;

  const current = () => Object.fromEntries(inputs.map((el) => [el.dataset.in, el.value]));
  const show = (v) => (v === undefined ? '—' : esc(typeof v === 'string' ? v : fmt(v)));

  function render() {
    const st = steps[idx];
    $('viz').innerHTML = (st.panels || []).map(panelHtml).join('');
    const vars = st.vars || [];
    const ch = st.ch || [];
    $('vars').innerHTML = vars.length
      ? vars.map(([name, v]) => `<div class="var${ch.includes(name) ? ' changed' : ''}"><dt>${esc(name)}</dt><dd>${show(v)}</dd></div>`).join('')
      : '<p class="empty">—</p>';
    const hl = st.lines || [];
    lineEls.forEach((el, k) => el.classList.toggle('hl', lines[k].ids.some((id) => hl.includes(id))));
    $('step-count').textContent = `Adım ${idx + 1} / ${steps.length}`;
    $('step-tag').textContent = st.tag || '';
    $('step-tag').dataset.kind = st.kind || '';
    $('step-text').innerHTML = st.text;
    $('prev-btn').disabled = idx === 0;
    $('reset').disabled = idx === 0;
    $('next-btn').disabled = idx === steps.length - 1;
  }

  function syncPresets() {
    const cur = current();
    presetBtns.forEach((b) => {
      const v = JSON.parse(b.dataset.preset);
      b.setAttribute('aria-pressed', String(Object.keys(v).every((k) => String(cur[k] || '').trim() === v[k])));
    });
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    $('play').textContent = '▶ Oynat';
  }

  function restart() {
    stop();
    syncPresets();
    let parsed = null;
    try { parsed = W.parse(current()); } catch { parsed = null; }
    if (parsed === null || typeof parsed === 'string') {
      $('in-err').textContent = typeof parsed === 'string' ? parsed : defaultErr;
      $('in-err').hidden = false;
      return;
    }
    $('in-err').hidden = true;
    steps = W.build(parsed);
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
    }, W.speed || 1100);
  });
  presetBtns.forEach((b) => b.addEventListener('click', () => {
    const v = JSON.parse(b.dataset.preset);
    inputs.forEach((el) => { if (v[el.dataset.in] !== undefined) el.value = v[el.dataset.in]; });
    restart();
  }));
  inputs.forEach((el) => el.addEventListener('input', restart));
  document.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.key === 'ArrowRight') $('next-btn').click();
    else if (e.key === 'ArrowLeft') $('prev-btn').click();
  });

  restart();
})();
