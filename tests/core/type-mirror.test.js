// tests/core/type-mirror.test.js
// Chạy: node tests/core/type-mirror.test.js
const { lex }   = require('../../src/core/lex');
const { parse } = require('../../src/core/parse');
const { typeCheck, validateRequest } = require('../../src/core/type');
const { text: mirrorText } = require('../../src/mirror/text');

// Worker AST dựng tay theo SPEC.md — vì parse.js chưa sinh node Worker.
// on POST /echo
//   need body.msg text
//   reply {echo: body.msg}
// on GET /hits
//   reply {hits: @store.add "hits" 1}
// on every 1h
//   @store.del "hits"
const WORKER_AST = {
  type: 'Program',
  body: [
    {
      type: 'On', method: 'POST', path: '/echo', line: 1,
      body: [
        { type: 'Need', path: 'body.msg', ty: 'text', line: 2 },
        {
          type: 'Reply', line: 3, value: {
            type: 'Object',
            entries: [
              { key: 'echo', value: { type: 'Path', path: 'body.msg' } },
            ],
          },
        },
      ],
    },
    {
      type: 'On', method: 'GET', path: '/hits', line: 5,
      body: [
        {
          type: 'Reply', line: 6, value: {
            type: 'Object',
            entries: [
              { key: 'hits', value: { type: 'Effect', path: 'store.add' } },
            ],
          },
        },
      ],
    },
    {
      type: 'On', every: '1h', line: 8,
      body: [
        { type: 'EffectCall', path: 'store.del', line: 9 },
      ],
    },
  ],
};

const SEED = 12345;

function tryIt(label, fn) {
  console.log('\n=== ' + label + ' ===');
  try {
    const r = fn();
    console.log(JSON.stringify(r, null, 2));
  } catch (e) {
    if (e.detail) {
      console.log('ERROR (D13):');
      console.log(JSON.stringify(e.detail, null, 2));
    } else {
      console.log('UNEXPECTED:', e);
    }
  }
}

// ---- TYPE ----
tryIt('typeCheck: Worker AST', () => typeCheck(WORKER_AST, SEED));

tryIt('validateRequest: OK', () =>
  validateRequest(WORKER_AST, { body: { msg: 'hello' } }, SEED));

tryIt('validateRequest: missing body.msg (expect D13)', () =>
  validateRequest(WORKER_AST, { body: {} }, SEED));

tryIt('validateRequest: wrong type number (expect D13)', () =>
  validateRequest(WORKER_AST, { body: { msg: 42 } }, SEED));

// ---- MIRROR ----
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

console.log('\n=== mirror: Web example (parser thật) ===');
const { tokens, seed } = lex(WEB);
const ast = parse(tokens, seed);
console.log(mirrorText(ast));

// Mirror cũng đọc được Worker AST dựng tay
console.log('\n=== mirror: Worker AST (dựng tay) ===');
console.log(mirrorText(WORKER_AST));