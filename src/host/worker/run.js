// src/host/worker/run.js
// 10ms host · run: AST → chạy thật. Page/Input/Btn/Each/Assign (Web)
// và On/Need/Reply/EffectCall (Worker). Thuần: chỉ gọi ctx.fx, không fetch/Date.
// P1 · P4 · P7 · D16.
const { MAX_ITER } = require('../../core/cost');

function d13(kind, line, expected, fix, seed) {
  const e = new Error(kind);
  e.detail = { error: kind, pos: { line: line || 1, col: 1 }, expected, fix, seed };
  return e;
}

// ---- kiểu runtime ----
function runtimeType(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'string')  return 'text';
  if (typeof v === 'number')  return 'number';
  if (typeof v === 'boolean') return 'bool';
  if (Array.isArray(v))       return 'array';
  if (typeof v === 'object')  return 'object';
  return 'unknown';
}

function lookupPath(root, path) {
  const parts = String(path).split('.');
  let cur = root;
  for (let i = 0; i < parts.length; i++) {
    if (cur === null || typeof cur !== 'object' || !(parts[i] in cur)) {
      return { found: false, at: parts.slice(0, i + 1).join('.') };
    }
    cur = cur[parts[i]];
  }
  return { found: true, value: cur };
}

// Preserve the synchronous hot path and compose only values that contain an async effect (P1, P4).
function maybeAsync(values, apply) {
  if (values.some(value => value && typeof value.then === 'function')) {
    return Promise.all(values).then(apply);
  }
  return apply(values);
}

// Evaluate child expressions in source order so external effects cannot reorder their D15 entries (P4, D15).
function evalMany(nodes, ctx) {
  const values = [];
  let pending = null;
  for (const node of nodes) {
    if (pending) pending = pending.then(() => evalExpr(node, ctx)).then(value => { values.push(value); });
    else {
      const value = evalExpr(node, ctx);
      if (value && typeof value.then === 'function') pending = Promise.resolve(value).then(result => { values.push(result); });
      else values.push(value);
    }
  }
  return pending ? pending.then(() => values) : values;
}

// Keep dynamic host loops within the same bound used by the core proof (P1, D14).
function checkEachLimit(list, s, ctx) {
  if (list.length > MAX_ITER) {
    throw d13('cost', s.line,
      `each list has at most ${MAX_ITER} items`,
      `reduce each list to at most ${MAX_ITER} items`,
      ctx.seed === undefined ? 0 : ctx.seed);
  }
}

// ---- eval biểu thức ----
function evalExpr(n, ctx) {
  if (!n) return null;
  switch (n.type) {
    case 'Number': return n.value;
    case 'String': return n.value;
    case 'Var':    return ctx.env.has(n.name) ? ctx.env.get(n.name) : null;
    case 'Path': {
      const r = lookupPath(ctx.env.get(String(n.path).split('.')[0]), n.path.split('.').slice(1).join('.') || '');
      if (!r.found) return null;
      return r.value;
    }
    case 'Array': {
      const values = evalMany(n.items, ctx);
      return maybeAsync([values], ([resolved]) => resolved);
    }
    case 'Object': {
      const values = evalMany(n.entries.map(entry => entry.value), ctx);
      return maybeAsync([values], ([resolved]) => {
        const o = {};
        for (let i = 0; i < n.entries.length; i++) o[n.entries[i].key] = resolved[i];
        return o;
      });
    }
    case 'Binary': {
      const l = evalExpr(n.left, ctx);
      return maybeAsync([l], ([left]) => maybeAsync([evalExpr(n.right, ctx)], ([right]) => {
        if (n.op === '+') {
          if (Array.isArray(left) && Array.isArray(right)) return left.concat(right);
          if (typeof left === 'number' && typeof right === 'number') return left + right;
          return String(left) + String(right);
        }
        return null;
      }));
    }
    case 'Effect': {
      const args = evalMany(n.args || [], ctx);
      return maybeAsync([args], ([resolved]) => ctx.fx.call(n.path, resolved));
    }
    default:
      return null;
  }
}

// ---- statement ----
function execStmt(s, ctx) {
  switch (s.type) {
    case 'Need':
      // đã kiểm ở runOn; bỏ qua ở đây
      return;

    case 'Reply':
      return maybeAsync([evalExpr(s.value, ctx)], ([value]) => { ctx.response = value; });

    case 'EffectCall': {
      const args = evalMany(s.args || [], ctx);
      return maybeAsync([args], ([resolved]) => ctx.fx.call(s.path, resolved));
    }

    case 'Assign':
      return maybeAsync([evalExpr(s.value, ctx)], ([value]) => ctx.env.set(s.name, value));

    case 'Each': {
      const list = evalExpr(s.list, ctx);
      return maybeAsync([list], ([resolved]) => execEach(s, resolved, ctx));
    }

    case 'Input':
    case 'Btn':
    case 'P':
    case 'Page':
      // Các node Web xử lý trong renderStmt; execStmt chỉ chạy side-effect thuần.
      return;

    default:
      return;
  }
}

// ---- Web render (Page → HTML) ----
// Await each loop body only when it returns a Promise, preserving source order (P1, P4).
function execEach(s, list, ctx) {
  if (!Array.isArray(list)) return;
  checkEachLimit(list, s, ctx);
  const saved = s.var;
  const prev = ctx.env.has(saved) ? ctx.env.get(saved) : undefined;
  const restore = () => {
    if (prev === undefined) ctx.env.delete(saved);
    else ctx.env.set(saved, prev);
  };
  let pending = null;
  for (const item of list) {
    const runItem = () => {
      ctx.env.set(saved, item);
      return execStatements(s.body, ctx);
    };
    if (pending) pending = pending.then(runItem);
    else {
      const result = runItem();
      if (result && typeof result.then === 'function') pending = Promise.resolve(result);
    }
  }
  if (pending) return pending.then(restore, error => { restore(); throw error; });
  restore();
}

// Serialize statements without async overhead when every effect is synchronous (P1, D15).
function execStatements(statements, ctx) {
  let pending = null;
  for (const statement of statements) {
    if (pending) pending = pending.then(() => execStmt(statement, ctx));
    else {
      const result = execStmt(statement, ctx);
      if (result && typeof result.then === 'function') pending = Promise.resolve(result);
    }
  }
  return pending;
}

// ---- Web render (Page → HTML) ----
function escapeHtml(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderStmt(s, ctx) {
  switch (s.type) {
    case 'Assign':
      // Page assignments initialize defaults on GET; POST keeps submitted state (P4).
      if (!ctx.preserveState || !ctx.env.has(s.name)) {
        ctx.env.set(s.name, evalExpr(s.value, ctx));
      }
      return '';
    case 'Input':
      return '<input name="' + escapeHtml(s.var) + '" type="text" value="' +
        escapeHtml(ctx.env.get(s.var)) + '" />';
    case 'P':
      return '<p>' + escapeHtml(evalExpr(s.expr, ctx)) + '</p>';
    case 'Btn': {
      const id = ctx.buttons ? ctx.buttons.length : 0;
      if (ctx.buttons) ctx.buttons.push({ body: s.body, env: new Map(ctx.env) });
      return '<button type="submit" name="__btn" value="' + id + '" data-label="' +
        escapeHtml(s.label) + '">' + escapeHtml(s.label) + '</button>';
    }
    case 'Each': {
      const list = evalExpr(s.list, ctx);
      if (!Array.isArray(list)) return '';
      checkEachLimit(list, s, ctx);
      const saved = s.var;
      const prev = ctx.env.has(saved) ? ctx.env.get(saved) : undefined;
      let html = '';
      for (const item of list) {
        ctx.env.set(saved, item);
        for (const inner of s.body) html += renderStmt(inner, ctx);
      }
      if (prev === undefined) ctx.env.delete(saved);
      else ctx.env.set(saved, prev);
      return html;
    }
    default:
      return '';
  }
}

function renderPage(pageNode, ctx) {
  ctx.buttons = [];
  const parts = pageNode.body.map(s => renderStmt(s, ctx)).join('');
  const state = escapeHtml(JSON.stringify(Object.fromEntries(ctx.env)));
  return '<!doctype html><html><body><form method="post">' +
    '<input type="hidden" name="__state" value="' + state + '" />' +
    parts + '</form></body></html>';
}

// ---- On (Worker) ----
function runOn(onNode, ctx) {
  // Kiểm need trước khi chạy body (D13)
  for (const s of onNode.body) {
    if (s.type !== 'Need') continue;
    const r = lookupPath({ body: ctx.body }, s.path);
    if (!r.found) {
      throw d13(
        'type', s.line,
        s.path + ' present with type ' + s.ty,
        'include "' + s.path.split('.').pop() + '": "<' + s.ty + '>" at ' + s.path,
        ctx.seed
      );
    }
    const t = runtimeType(r.value);
    if (t !== s.ty) {
      throw d13(
        'type', s.line,
        s.path + ' : ' + s.ty,
        'change ' + s.path + ' from ' + t + ' to ' + s.ty,
        ctx.seed
      );
    }
  }
  const pending = execStatements(onNode.body, ctx);
  return pending ? pending.then(() => ctx.response) : ctx.response;
}

module.exports = { evalExpr, execStmt, execStatements, renderPage, renderStmt, runOn, runtimeType, lookupPath };
