// Cloudflare module entry: adapt the SPEC worker to platform fetch/scheduled (P7).
const { createWorker } = require('./index');

// Keep the SPEC's Worker AST in one canonical runtime instance per isolate (P4).
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
      body: [{
        type: 'EffectCall', path: 'store.del', line: 9,
        args: [{ type: 'String', value: 'hits' }],
      }],
    },
  ],
};
const app = createWorker({ ast, seed: 7, store: new Map() });

// Export only Cloudflare's standard module handlers; no Node-only APIs (P7).
export default {
  fetch(request) {
    return app.fetch(request);
  },
  scheduled(_controller, _env, context) {
    context.waitUntil(app.scheduled({}));
  },
};
