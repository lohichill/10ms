// tests/core/web.test.js
// Chạy: node tests/core/web.test.js
// Nguồn: SPEC.md — ví dụ Web, dạng chuẩn (thụt 2 dấu cách, btn có ngoặc kép).
// (Prompt dán phẳng có thể mất thụt/nháy; đây mới là dạng đúng của ngôn ngữ.)

const { lex } = require('../../src/core/lex');
const { parse } = require('../../src/core/parse');

const WEB = `page /
  tasks = []
  text = ""
  input text
  btn "Add"
    tasks = tasks + [text]
    text = ""
  each tasks t
    p t
`;

function run(label, src) {
  console.log('\n=== ' + label + ' ===');
  try {
    const { tokens, seed } = lex(src);
    console.log('seed:', seed);
    const ast = parse(tokens, seed);
    console.log(JSON.stringify(ast, null, 2));
  } catch (e) {
    console.log('ERROR (D13):');
    console.log(JSON.stringify(e.detail, null, 2));
  }
}

// 1. Ví dụ Web — kỳ vọng in ra AST đầy đủ
run('Web example (SPEC)', WEB);

// 2. Bonus: lỗi cú pháp → JSON D13 (vị trí, mong đợi, bản sửa, seed)
run('Error case: "tasks == []"', `page /
  tasks == []
`);