// src/core/cost.js
// 10ms core · cost: AST → cận trên CPU (ticks), chứng minh ≤ 10ms.
// Thuần, zero dep, không I/O. P1 · P4 · D13 · D14.
// Luật: mọi `each` bị chặn bởi hằng ngôn ngữ MAX_ITER = 100.
// Đó là "chặn" ngôn ngữ bảo đảm; nếu 100 × thân vòng vượt ngân sách → lỗi D13.

const TICK_PER_MS = 1000;                 // 1 tick = 1 µs (thô, cố ý bảo thủ)
const MAX_MS      = 10;
const MAX_TICKS   = MAX_MS * TICK_PER_MS; // 10_000
const MAX_ITER    = 100;                  // chặn ngôn ngữ cho mỗi `each`

// Bảng giá mỗi loại nút, đơn vị tick.
const T = {
  Literal: 1, // Number, String
  Var:     1,
  Array:   1, // + từng item
  Binary:  1, // + hai vế
  Assign:  1,
  Input:   1,
  P:       1,
  Btn:     1,
  Page:    1,
  Each:    1, // + list + MAX_ITER × body
};

function err(pos, expected, fix, seed) {
  const e = new Error('cost');
  e.detail = { error: 'cost', pos, expected, fix, seed };
  throw e;
}

function costExpr(n) {
  if (!n) return 0;
  switch (n.type) {
    case 'Number':
    case 'String': return T.Literal;
    case 'Var':    return T.Var;
    case 'Array':  return T.Array  + n.items.reduce((s, x) => s + costExpr(x), 0);
    case 'Binary': return T.Binary + costExpr(n.left) + costExpr(n.right);
    default:       return 0;
  }
}

function cost(ast, seed = 0) {
  if (!ast || ast.type !== 'Program') {
    err({ line: 1, col: 1 }, 'a Program AST from parse.js', 'parse(source) first', seed);
  }

  let worst = null; // vòng đắt nhất, để báo lỗi đúng chỗ

  function costStmt(n) {
    switch (n.type) {
      case 'Assign': return T.Assign + costExpr(n.value);
      case 'Input':  return T.Input;
      case 'P':      return T.P + costExpr(n.expr);
      case 'Btn':    return T.Btn  + n.body.reduce((s, x) => s + costStmt(x), 0);
      case 'Page':   return T.Page + n.body.reduce((s, x) => s + costStmt(x), 0);
      case 'Each': {
        const body = n.body.reduce((s, x) => s + costStmt(x), 0);
        const loop = T.Each + costExpr(n.list) + MAX_ITER * body;
        if (!worst || loop > worst.cost) worst = { cost: loop, node: n };
        return loop;
      }
      default: return 0;
    }
  }

  const total = ast.body.reduce((s, x) => s + costStmt(x), 0);

  if (total > MAX_TICKS) {
    // Ưu tiên báo vòng đắt nhất nếu nó chiếm > nửa ngân sách.
    if (worst && worst.cost > MAX_TICKS / 2) {
      err(
        { line: worst.node.line || 1, col: 1 },
        `each loop cost ≤ ${Math.floor(MAX_TICKS / 2)} ticks (so total ≤ ${MAX_TICKS})`,
        `reduce each-body cost or split the loop ` +
        `(this loop = ${worst.cost} ticks, total = ${total} ticks, cap = ${MAX_ITER} iter)`,
        seed
      );
    }
    err(
      { line: 1, col: 1 },
      `total CPU ≤ ${MAX_TICKS} ticks (${MAX_MS}ms)`,
      `reduce code size (total = ${total} ticks)`,
      seed
    );
  }

  return {
    ok: true,
    ticks: total,
    ms: total / TICK_PER_MS,
    budget_ms: MAX_MS,
    max_iter: MAX_ITER,
    worst_loop: worst ? worst.cost : 0,
    proof: `every each bounded by MAX_ITER=${MAX_ITER}; total ${total} ≤ ${MAX_TICKS}`,
  };
}

module.exports = { cost, MAX_ITER, MAX_TICKS };