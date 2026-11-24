// src/core/parse.js
// 10ms core · parser: token → cây AST. Thuần, zero dependency.
// P4 deterministic · P6 một cách viết · D12 canonical · D13 errors are data · D16 intent.

function fail(tok, expected, fix, seed) {
  const e = new Error('syntax');
  e.detail = {
    error: 'syntax',
    pos: { line: tok.line, col: tok.col },
    expected,
    fix,
    seed,
  };
  throw e;
}

function parse(tokens, seed = 0) {
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  function expect(type, expectedDesc, fix) {
    const t = peek();
    if (!t || t.type !== type) {
      fail(t || tokens[tokens.length - 1], expectedDesc, fix, seed);
    }
    return next();
  }

  // Block = NEWLINE INDENT statement* DEDENT.
  // P6: chỉ một cách mở block — sau header, thụt 2+ dấu cách.
  function parseBlock() {
    expect('NEWLINE', 'end of line', 'add a newline');
    expect('INDENT', 'an indented block (2 spaces)', '  <statement>');
    const body = [];
    while (peek() && peek().type !== 'DEDENT' && peek().type !== 'EOF') {
      body.push(parseStatement());
      if (peek() && peek().type === 'NEWLINE') next();
    }
    if (peek() && peek().type === 'DEDENT') next();
    return body;
  }

  // Statement: 5 từ khoá + gán. Không có biểu thức trần (D16 intent).
  function parseStatement() {
    const t = peek();
    if (!t || t.type !== 'IDENT') {
      fail(t || tokens[tokens.length - 1],
        'one of: page, input, btn, p, each, or <name> =',
        '<statement>', seed);
    }
    if (t.value === 'page')  return parsePage();
    if (t.value === 'input') return parseInput();
    if (t.value === 'btn')   return parseBtn();
    if (t.value === 'p')     return parseP();
    if (t.value === 'each')  return parseEach();
    return parseAssign();
  }

  function parsePage() {
    const kw = next();
    expect('SLASH', '"/" (page path)', 'page /');
    const body = parseBlock();
    return { type: 'Page', path: '/', body, line: kw.line };
  }

  function parseInput() {
    const kw = next();
    const name = expect('IDENT', 'a variable name', 'input <name>');
    return { type: 'Input', var: name.value, line: kw.line };
  }

  function parseBtn() {
    const kw = next();
    const label = expect('STRING', 'a button label in quotes', 'btn "Label"');
    const body = parseBlock(); // click handler
    return { type: 'Btn', label: label.value, body, line: kw.line };
  }

  function parseP() {
    const kw = next();
    const expr = parseExpr();
    return { type: 'P', expr, line: kw.line };
  }

  function parseEach() {
    const kw = next();
    const list = parseExpr();
    const name = expect('IDENT', 'a loop variable name', 'each <list> <name>');
    const body = parseBlock();
    return { type: 'Each', list, var: name.value, body, line: kw.line };
  }

  function parseAssign() {
    const name = expect('IDENT', 'a variable name', '<name> = <expr>');
    expect('ASSIGN', '"=" after the name', name.value + ' = <expr>');
    const value = parseExpr();
    return { type: 'Assign', name: name.value, value, line: name.line };
  }

  // Expr: atom (('+' atom)*) — kết hợp trái, một phép cộng duy nhất (P6).
  function parseExpr() {
    let left = parseAtom();
    while (peek() && peek().type === 'PLUS') {
      next();
      const right = parseAtom();
      left = { type: 'Binary', op: '+', left, right };
    }
    return left;
  }

  // Atom: số, chuỗi, biến, hoặc mảng [expr] | [].
  function parseAtom() {
    const t = peek();
    if (!t) fail(tokens[tokens.length - 1], 'an expression', '<expr>', seed);
    if (t.type === 'NUMBER') { next(); return { type: 'Number', value: t.value }; }
    if (t.type === 'STRING') { next(); return { type: 'String', value: t.value }; }
    if (t.type === 'IDENT')  { next(); return { type: 'Var',    name:  t.value }; }
    if (t.type === 'LBRACK') {
      next();
      const items = [];
      if (peek() && peek().type !== 'RBRACK') items.push(parseExpr());
      expect('RBRACK', '"]"', '[] or [<expr>]');
      return { type: 'Array', items };
    }
    fail(t, 'an expression (number, string, name, or array)', '<expr>', seed);
  }

  // Chương trình = danh sách statement ở cấp 0.
  const body = [];
  while (peek() && peek().type !== 'EOF') {
    if (peek().type === 'NEWLINE') { next(); continue; }
    body.push(parseStatement());
    if (peek() && peek().type === 'NEWLINE') next();
  }
  return { type: 'Program', body };
}

module.exports = { parse };