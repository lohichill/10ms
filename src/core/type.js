// src/core/type.js
// 10ms core · type: kiểm tra `need` trong Handler. Thuần, zero dep, không I/O.
// P4 deterministic · P6 một cách viết · D13 errors are data.
// Luật: need <path> <type> — path phân cấp bằng dấu chấm, type ∈ 5 kiểu của 10ms.

const TYPES = new Set(['text', 'number', 'bool', 'array', 'object']);

function err(line, expected, fix, seed) {
  const e = new Error('type');
  e.detail = { error: 'type', pos: { line, col: 1 }, expected, fix, seed };
  throw e;
}

// Kiểu runtime của một giá trị JS trong hệ kiểu 10ms.
function runtimeType(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'string')  return 'text';
  if (typeof v === 'number')  return 'number';
  if (typeof v === 'boolean') return 'bool';
  if (Array.isArray(v))       return 'array';
  if (typeof v === 'object')  return 'object';
  return 'unknown';
}

// Duyệt path "body.msg" trên request. Trả {found, value} hoặc {found:false, at}.
function resolve(obj, path) {
  let cur = obj;
  for (const part of path.split('.')) {
    if (cur === null || typeof cur !== 'object' || !(part in cur)) {
      return { found: false, at: part };
    }
    cur = cur[part];
  }
  return { found: true, value: cur };
}

// Duyệt AST, gom mọi `Need` khai báo trong các `On`.
function collectNeeds(ast, seed) {
  const needs = [];
  const seen = new Set();

  function walk(n) {
    if (!n || typeof n !== 'object') return;
    if (seen.has(n)) return;
    seen.add(n);

    if (n.type === 'On') {
      for (const s of n.body || []) {
        if (!s || s.type !== 'Need') continue;
        // Need chính tả phải chuẩn — D12 canonical-or-error.
        if (typeof s.path !== 'string' || s.path.length === 0) {
          err(s.line || n.line || 1,
            'need <path> <type>',
            'need body.msg text',
            seed);
        }
        if (!TYPES.has(s.ty)) {
          err(s.line || n.line || 1,
            'one of types: ' + [...TYPES].join(', '),
            'need ' + s.path + ' text',
            seed);
        }
        needs.push({
          line: s.line || n.line || 1,
          path: s.path,
          type: s.ty,
          on: n.method || ('every ' + n.every),
        });
      }
    }

    for (const k of Object.keys(n)) {
      const v = n[k];
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') walk(v);
    }
  }

  walk(ast);
  return needs;
}

// typeCheck(ast) → { ok, needs }. Ném D13 nếu cú pháp need sai.
function typeCheck(ast, seed = 0) {
  if (!ast || ast.type !== 'Program') {
    err(1, 'a Program AST from parse.js', 'parse(source) first', seed);
  }
  return { ok: true, needs: collectNeeds(ast, seed) };
}

// validateRequest(ast, request) → { ok, checked } hoặc ném D13.
// Thiếu → fix "gửi kèm …". Sai kiểu → fix "đổi … thành …".
function validateRequest(ast, request, seed = 0) {
  const needs = collectNeeds(ast, seed);
  for (const need of needs) {
    const r = resolve(request, need.path);
    if (!r.found) {
      const last = need.path.split('.').pop();
      err(need.line,
        need.path + ' present with type ' + need.type,
        'include "' + last + '": "<' + need.type + '>" at ' + need.path,
        seed);
    }
    const t = runtimeType(r.value);
    if (t !== need.type) {
      err(need.line,
        need.path + ' : ' + need.type,
        'change ' + need.path + ' from ' + t + ' to ' + need.type,
        seed);
    }
  }
  return { ok: true, checked: needs.length };
}

module.exports = { typeCheck, validateRequest, runtimeType };