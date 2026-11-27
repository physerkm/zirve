(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const fmt = (v) => (Array.isArray(v) ? `[${v.map(fmt).join(', ')}]` : v === null ? 'null' : typeof v === 'string' ? `"${v}"` : String(v));
  const c = (v) => `<code>${esc(typeof v === 'string' ? v : fmt(v))}</code>`;

  // Input parsing helpers: return null on invalid input.
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
    // Grid written as "1 0 1; 0 1 1" or "[[1,0,1],[0,1,1]]".
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
    // Tree: level order "3, 9, 20, null, null, 15, 7".
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

  // Node structure built from a level-order array: { i, val, left, right, depth }.
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

  // Back from the node structure to a level-order array (trailing nulls dropped).
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

  // Snapshot that keeps node identities: { a: level-order values, ids: node ids at the same positions }.
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

  const empty = (p) => `<p class="empty">${p.empty || 'empty'}</p>`;
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
      const tail = p.cycle !== undefined && p.cycle >= 0 ? `<span class="lla">→</span><span class="llnull">↩ node ${p.cycle}</span>` : (p.noNull ? '' : '<span class="lla">→</span><span class="llnull">null</span>');
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
      return `<div class="tscroll"><svg class="tsvg" viewBox="0 0 ${w} ${h + (p.sub ? 10 : 0)}" width="${w}" height="${h + (p.sub ? 10 : 0)}" role="img" aria-label="Binary tree">${edges}${circles}</svg></div>`;
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
      return `<div class="tscroll"><svg class="gsvg" viewBox="0 0 ${W2} ${H2}" width="${W2}" height="${H2}" role="img" aria-label="Graph">${defs}${edges}${nodes}</svg></div>`;
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
    // Trie: node { kids: { letter: node }, end: bool }; nodes are referred to by their prefix.
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
        if (isRoot) lines.push(`<div class="tl"><span class="tch root${cl('')}">root</span></div>`);
        else lines.push(`<div class="tl"><span class="tg">${indent}${last ? '└─ ' : '├─ '}</span><span class="tch${cl(prefix)}">${esc(prefix.slice(-1))}</span>${node.end ? '<span class="tend">● end of word</span>' : ''}</div>`);
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
  var users = new HashSet<int> { userId };                     //@users
  if (following.TryGetValue(userId, out var f)) users.UnionWith(f); //@users
  var heap = new PriorityQueue<(int User, int Index), int>();  //@seed
  foreach (var user in users)                                   //@seed
      if (tweets.TryGetValue(user, out var list) && list.Count > 0) //@seed
          heap.Enqueue((user, list.Count - 1), -list[^1].Time); //@seed
  var feed = new List<int>();                                   //@pull
  while (feed.Count < 10 && heap.Count > 0)                     //@pull
  {
      var (user, index) = heap.Dequeue();                       //@pull
      feed.Add(tweets[user][index].Id);                         //@pull
      if (index > 0)                                            //@next
          heap.Enqueue((user, index - 1), -tweets[user][index - 1].Time); //@next
  }
  return feed;                                                  //@done`,
    parse(v) {
      const parts = String(v.ops).split(';').map((s) => s.trim()).filter(Boolean);
      if (parts.length < 1 || parts.length > 14) return null;
      const ops = [];
      for (const p of parts) {
        const w = p.split(/\s+/);
        const num = (s, max) => P.int(s, w[0] === 'post' && s === w[2] ? 0 : 1, max);
        if (w[0] === 'post' && w.length === 3) { const u = num(w[1], 9); const t = P.int(w[2], 0, 99); if (u === null || t === null) return null; ops.push({ op: 'post', u, t }); }
        else if (w[0] === 'feed' && w.length === 2) { const u = num(w[1], 9); if (u === null) return null; ops.push({ op: 'feed', u }); }
        else if ((w[0] === 'follow' || w[0] === 'unfollow') && w.length === 3) { const a = num(w[1], 9); const b = num(w[2], 9); if (a === null || b === null) return null; ops.push({ op: w[0], a, b }); }
        else return null;
      }
      return { ops };
    },
    build({ ops }) {
      const steps = [];
      const tweets = new Map();
      const following = new Map();
      let time = 0;
      const statePanels = () => [
        { t: 'map', label: 'tweets (user → [time:id])', e: [...tweets.entries()].map(([u, l]) => [`u${u}`, l.map(([tm, id]) => `${tm}:${id}`).join(', ')]), empty: 'empty', half: true },
        { t: 'map', label: 'following', e: [...following.entries()].filter(([, s]) => s.size).map(([u, s]) => [`u${u}`, [...s].map((x) => `u${x}`).join(', ')]), empty: 'empty', half: true },
      ];
      steps.push({ tag: 'Start', text: 'An empty system.', lines: [], vars: [], panels: statePanels() });
      for (const o of ops) {
        if (o.op === 'post') {
          if (!tweets.has(o.u)) tweets.set(o.u, []);
          tweets.get(o.u).push([time++, o.t]);
          steps.push({ tag: 'postTweet', text: `<code>postTweet(${o.u}, ${o.t})</code>: the tweet is appended to u${o.u}'s list with timestamp <code>${time - 1}</code>.`, lines: [], vars: [['time', time]], ch: ['time'], panels: statePanels() });
        } else if (o.op === 'follow' || o.op === 'unfollow') {
          if (o.a !== o.b) {
            if (!following.has(o.a)) following.set(o.a, new Set());
            if (o.op === 'follow') following.get(o.a).add(o.b); else following.get(o.a).delete(o.b);
          }
          steps.push({ tag: o.op, text: o.a === o.b ? `<code>${o.op}(${o.a}, ${o.b})</code>: a user already sees their own tweets; nothing changes.` : `<code>${o.op}(${o.a}, ${o.b})</code>: u${o.a} ${o.op === 'follow' ? `now follows u${o.b}` : `unfollowed u${o.b}`}.`, lines: [], vars: [], panels: statePanels() });
        } else {
          const users = new Set([o.u, ...(following.get(o.u) || [])]);
          const cursors = [...users].filter((u) => tweets.has(u)).map((u) => ({ u, i: tweets.get(u).length - 1 }));
          const heapView = () => cursors.filter((c) => c.i >= 0).map((c) => tweets.get(c.u)[c.i]).sort((a, b) => b[0] - a[0]).map(([tm, id]) => `${tm}:${id}`);
          const feed = [];
          steps.push({ tag: 'getNewsFeed', text: `<code>getNewsFeed(${o.u})</code>: the users in the feed are <code>${[...users].map((u) => `u${u}`).join(', ')}</code>. The newest tweet of each is put into the heap.`, lines: ['users', 'seed'], vars: [['userId', o.u], ['heap.Count', heapView().length]], ch: ['heap.Count'], panels: [...statePanels(), { t: 'arr', label: 'Max-heap (by time, newest on the left)', a: heapView(), noIdx: true, wide: true, empty: 'empty' }, { t: 'arr', label: 'feed', a: [], empty: 'empty' }] });
          while (feed.length < 10) {
            let best = null;
            for (const c of cursors) if (c.i >= 0 && (!best || tweets.get(c.u)[c.i][0] > tweets.get(best.u)[best.i][0])) best = c;
            if (!best) break;
            const [tm, id] = tweets.get(best.u)[best.i];
            const before = heapView();
            feed.push(id);
            best.i--;
            steps.push({ tag: 'Pop', text: `The top of the heap <code>${tm}:${id}</code> (u${best.u}) is popped and added to the feed.${best.i >= 0 ? ` u${best.u}'s previous tweet takes its place in the heap.` : ` u${best.u} has no more tweets.`}`, lines: ['pull', ...(best.i >= 0 ? ['next'] : [])], vars: [['userId', o.u], ['feed.Count', feed.length]], ch: ['feed.Count'], panels: [...statePanels(), { t: 'arr', label: 'Max-heap (before the pop)', a: before, cls: { 0: 'cur' }, noIdx: true, wide: true }, { t: 'arr', label: 'feed', a: feed.slice(), cls: Object.fromEntries(feed.map((_, k) => [k, 'ok'])) }] });
          }
          steps.push({ tag: 'Feed', kind: 'ok', text: `The heap is empty or 10 tweets have been collected. <code>getNewsFeed(${o.u})</code> → <code>${fmt(feed)}</code>.`, lines: ['done'], vars: [['userId', o.u], ['feed.Count', feed.length]], panels: [...statePanels(), { t: 'arr', label: 'feed', a: feed.slice(), cls: Object.fromEntries(feed.map((_, k) => [k, 'ok'])), empty: 'empty feed' }] });
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
    $('step-count').textContent = `Step ${idx + 1} / ${steps.length}`;
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
    $('play').textContent = '▶ Play';
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
    $('play').textContent = '❚❚ Pause';
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
