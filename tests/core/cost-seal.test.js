// tests/core/cost-seal.test.js
// Chạy: node tests/core/cost-seal.test.js
const { lex }    = require('../../src/core/lex');
const { parse }  = require('../../src/core/parse');
const { cost }   = require('../../src/core/cost');
const { seal, verifySeal } = require('../../src/core/seal');

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

// Nested loop = 100 × 100 × thân = vượt ngân sách → chứng minh THẤT BẠI.
const NESTED = `page /
  each xs a
    each ys b
      p b
`;

function tryCost(label, src) {
  console.log('\n=== cost: ' + label + ' ===');
  try {
    const { tokens, seed } = lex(src);
    const ast = parse(tokens, seed);
    const r = cost(ast, seed);
    console.log(JSON.stringify(r, null, 2));
  } catch (e) {
    console.log('ERROR (D13):');
    console.log(JSON.stringify(e.detail, null, 2));
  }
}

tryCost('Web example (expect PASS)', WEB);
tryCost('nested each (expect D13 error)', NESTED);

// ----- seal -----
console.log('\n=== seal: Web ===');
const s1 = seal(WEB);
const s2 = seal(WEB);
console.log('seal #1         :', s1);
console.log('seal #2         :', s2);
console.log('same?           :', s1 === s2);

const s3 = seal(WEB + '\n');
console.log('seal #3 (+ "\\n"):', s3);
console.log('different?      :', s1 !== s3);

console.log('verify correct  :', verifySeal(WEB, s1));          // true
console.log('verify wrong    :', verifySeal(WEB, 'deadbeefdeadbeef')); // false

// P4: 100 lần chạy → 1 seal duy nhất
const set = new Set();
for (let i = 0; i < 100; i++) set.add(seal(WEB));
console.log('100 runs, distinct seals:', set.size);