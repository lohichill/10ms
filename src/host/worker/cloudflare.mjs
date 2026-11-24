// src/host/worker/cloudflare.mjs
// Entrypoint thật cho Wrangler; giữ chương trình Worker trong host, không tự parse (P1 · P7).
// WHY AST literal: parser hiện tại chưa tạo node Worker; đây là cùng ví dụ Worker của SPEC.md (P7).
import hostModule from './index.js';

const { createWorker } = hostModule;
const ast = {
  type: 'Program',
  body: [
    {
      type: 'On', method: 'POST', path: '/echo', line: 1,
      body: [
        { type: 'Need', path: 'body.msg', ty: 'text', line: 2 },
        {
          type: 'Reply', line: 3,
          value: {
            type: 'Object',
            entries: [{ key: 'echo', value: { type: 'Path', path: 'body.msg' } }],
          },
        },
      ],
    },
    {
      type: 'On', method: 'GET', path: '/hits', line: 5,
      body: [
        {
          type: 'Reply', line: 6,
          value: {
            type: 'Object',
            entries: [{
              key: 'hits',
              value: {
                type: 'Effect', path: 'store.add',
                args: [
                  { type: 'String', value: 'hits' },
                  { type: 'Number', value: 1 },
                ],
              },
            }],
          },
        },
      ],
    },
    {
      type: 'On', every: '1h', line: 8,
      body: [
        {
          type: 'EffectCall', path: 'store.del', line: 9,
          args: [{ type: 'String', value: 'hits' }],
        },
      ],
    },
  ],
};

const app = createWorker({ ast, seed: 7 });
export default { fetch: app.fetch, scheduled: app.scheduled };
