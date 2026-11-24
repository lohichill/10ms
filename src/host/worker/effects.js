// src/host/worker/effects.js
// 10ms host · effects: CHỖ DUY NHẤT chạm ra ngoài. @store.add/del/get.
// Lõi không gọi trực tiếp — mọi lần chạm đi qua log (D15). P1 · P4.

function d13(expected, fix, seed) {
  const e = new Error('effect');
  e.detail = { error: 'effect', pos: { line: 1, col: 1 }, expected, fix, seed };
  return e;
}

const ALLOWED = { 'store': ['add', 'del', 'get'] };

function createEffects(log, store, seed = 0) {
  const box = store instanceof Map ? store : new Map();

  function add(key, delta) {
    const cur = Number(box.get(key) || 0);
    const next = cur + Number(delta);
    box.set(key, next);
    log.record('store.add', [key, delta], next);
    return next;
  }

  function del(key) {
    const existed = box.delete(key);
    log.record('store.del', [key], existed);
    return existed;
  }

  function get(key) {
    const v = box.has(key) ? box.get(key) : null;
    log.record('store.get', [key], v);
    return v;
  }

  function call(path, args) {
    const [ns, fn] = String(path).split('.');
    if (!ALLOWED[ns] || !ALLOWED[ns].includes(fn)) {
      throw d13(
        'one of: ' + Object.entries(ALLOWED)
          .map(([n, fs]) => fs.map(f => '@' + n + '.' + f).join(', '))
          .join(', '),
        '@store.<' + ALLOWED.store.join('|') + '> … with valid args',
        seed
      );
    }
    if (!Array.isArray(args)) {
      throw d13('args as array for @' + path, '@' + path + ' [arg1, arg2]', seed);
    }
    return { add, del, get }[fn](...args);
  }

  function snapshotStore() { return new Map(box); }

  return { call, add, del, get, snapshotStore };
}

module.exports = { createEffects };