// tests/host/cloudflare-example.test.js
// Run: node tests/host/cloudflare-example.test.js
// Execute the Cloudflare module from the guide so its AST cannot silently drift.
const fs = require('node:fs');
const vm = require('node:vm');
const { createWorker } = require('../../src/host/worker');

function assert(condition, message) {
  if (!condition) {
    console.error('FAIL:', message);
    process.exitCode = 1;
  } else {
    console.log('OK  :', message);
  }
}

function fencedBlock(markdown, heading, fence) {
  const section = markdown.split(heading)[1];
  if (!section) throw new Error(`Missing section: ${heading}`);
  const marker = `${fence}\n`;
  const start = section.indexOf(marker);
  if (start < 0) throw new Error(`Missing ${fence} block after ${heading}`);
  const contentStart = start + marker.length;
  const end = section.indexOf('\n```', contentStart);
  if (end < 0) throw new Error(`Unclosed ${fence} block after ${heading}`);
  return section.slice(contentStart, end);
}

const guide = fs.readFileSync(
  require('node:path').join(__dirname, '../../docs/cloudflare-worker.md'),
  'utf8'
);
const program = fencedBlock(guide, '## 10ms program', '```10ms');
const expectedProgram = [
  'on POST /count',
  '  need body.items array',
  '  total = 0',
  '  each body.items item',
  '    total = total + 1',
  '  reply {count: total}',
].join('\n');
assert(program === expectedProgram, 'documented 10ms program matches the canonical count example');

let moduleSource = fencedBlock(guide, '## Cloudflare module', '```js');
moduleSource = moduleSource.replace(
  'import { createWorker } from "./index.js";',
  'const { createWorker } = require("./index.js");'
).replace('export default {', 'module.exports = {');
if (moduleSource.includes('import { createWorker }') || moduleSource.includes('export default')) {
  throw new Error('Cloudflare module has unsupported or changed module syntax');
}
const moduleObject = { exports: {} };
vm.runInNewContext(moduleSource, {
  require(specifier) {
    if (specifier !== './index.js') throw new Error(`Unexpected import: ${specifier}`);
    return { createWorker };
  },
  module: moduleObject,
});
const worker = moduleObject.exports;
assert(worker && typeof worker.fetch === 'function', 'documented module exports a fetch handler');

function post(items) {
  return new Request('http://local/count', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ items }),
  });
}

async function main() {
  const response = await worker.fetch(post([1, 2, 3]));
  const body = await response.json();
  assert(response.status === 200 && body.count === 3,
    'POST /count returns {"count":3} for three items');

  const atLimit = await worker.fetch(post(Array(100).fill(1)));
  const atLimitBody = await atLimit.json();
  assert(atLimit.status === 200 && atLimitBody.count === 100,
    '100 items are accepted at the loop limit');

  const overLimit = await worker.fetch(post(Array(101).fill(1)));
  const overLimitBody = await overLimit.json();
  assert(overLimit.status === 400 && overLimitBody.error === 'cost' &&
    overLimitBody.fix === 'reduce each list to at most 100 items',
  '101 items return the machine-readable cost error and exact fix');

  const repeated = [];
  for (let i = 0; i < 100; i++) {
    const res = await worker.fetch(post([1, 2, 3]));
    repeated.push(`${res.status}:${JSON.stringify(await res.json())}`);
  }
  assert(repeated.every(value => value === '200:{"count":3}'),
    '100 repeated requests produce identical responses');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
