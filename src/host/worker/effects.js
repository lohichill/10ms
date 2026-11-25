// src/host/worker/effects.js
// 10ms host · effects: CHỖ DUY NHẤT chạm ra ngoài. @store.add/del/get/set, @time.now, @rand.int.
// Lõi không gọi trực tiếp — mọi lần chạm đi qua log (D15). P1 · P4.

function d13(expected, fix, seed) {
  const e = new Error('effect');
  e.detail = { error: 'effect', pos: { line: 1, col: 1 }, expected, fix, seed };
  return e;
}

const ALLOWED = {
  store: ['add', 'del', 'get', 'set'],
  time: ['now'],
  rand: ['int'],
};

function createEffects(log, store, seed = 0) {
  const box = store instanceof Map ? store : new Map();
  // Keep random output stable for the same seed without adding entropy or dependencies (P1, P4).
  let randState = Number(seed) >>> 0;

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

  function set(key, value) {
    box.set(key, value);
    log.record('store.set', [key, value], value);
    return value;
  }

  // Capture wall-clock output once so D15 replay never reads a new time (P4).
  function now(...args) {
    if (args.length !== 0) {
      throw d13('no arguments for @time.now', '@time.now', seed);
    }
    const result = Date.now();
    log.record('time.now', [], result);
    return result;
  }

  // Expand one seed into a deterministic 32-bit stream for bounded integer draws (P1, P4).
  function nextUint32() {
    randState = (randState + 0x6D2B79F5) >>> 0;
    let t = randState;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  }

  // Use rejection sampling to avoid modulo bias while keeping the inclusive range exact (P4).
  function int(...args) {
    if (args.length !== 2) {
      throw d13('two safe integer bounds for @rand.int', '@rand.int <min> <max>', seed);
    }
    const [min, max] = args;
    const span = max - min + 1;
    if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || min > max || span > 0x100000000) {
      throw d13(
        'safe integer bounds with min ≤ max and range ≤ 2^32 for @rand.int',
        '@rand.int <min> <max> with safe integer bounds and min ≤ max',
        seed
      );
    }
    const limit = Math.floor(0x100000000 / span) * span;
    let draw;
    do { draw = nextUint32(); } while (draw >= limit);
    const result = min + (draw % span);
    log.record('rand.int', args, result);
    return result;
  }

  function call(path, args) {
    const [ns, fn] = String(path).split('.');
    if (!ALLOWED[ns] || !ALLOWED[ns].includes(fn)) {
      const choices = Object.entries(ALLOWED)
        .flatMap(([name, fns]) => fns.map(nameFn => '@' + name + '.' + nameFn))
        .join(', ');
      throw d13(
        'one of: ' + choices,
        'call one declared @ effect with valid args',
        seed
      );
    }
    if (!Array.isArray(args)) {
      throw d13('args as array for @' + path, '@' + path + ' [arg1, arg2]', seed);
    }
    return { add, del, get, set, now, int }[fn](...args);
  }

  function snapshotStore() { return new Map(box); }

  return { call, add, del, get, set, now, int, snapshotStore };
}

module.exports = { createEffects };
