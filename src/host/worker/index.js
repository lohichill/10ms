// src/host/worker/index.js
// 10ms host · worker entry. fetch() nhận request, route theo `on` (Worker)
// hoặc `page` (Web). KHÔNG tự parse — chỉ nhận AST từ lõi. P1 · P4 · P7 · D16.
// `scheduled()` phục vụ `on every 1h` (Cloudflare cron trigger).

const { createLog }     = require('./log');
const { createEffects } = require('./effects');
const { runOn, renderPage, execStmt } = require('./run');

function jsonResponse(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function htmlResponse(html, status) {
  return new Response(html, {
    status: status || 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

function createWorker({ ast, seed, store }) {
  const log = createLog();
  const fx  = createEffects(log, store instanceof Map ? store : new Map(), seed || 0);
  const S   = seed || 0;

  function findRoute(method, path) {
    for (const n of ast.body) {
      if (n.type !== 'On') continue;
      if (n.method === method && n.path === path) return n;
    }
    return null;
  }

  function findPage(path) {
    for (const n of ast.body) {
      if (n.type === 'Page' && (n.path || '/') === path) return n;
    }
    return null;
  }

  async function readBody(request) {
    const ct = (request.headers.get('content-type') || '').toLowerCase();
    if (!ct.includes('json')) return {};
    try { return await request.json(); }
    catch (_) { return {}; }
  }

  async function fetch(request) {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const path = url.pathname;

    // 1. Route Worker
    const on = findRoute(method, path);
    if (on) {
      const body = (method === 'POST' || method === 'PUT' || method === 'PATCH')
        ? await readBody(request)
        : {};
      const ctx = {
        env: new Map([['body', body]]),
        fx, log, body, response: null, seed: S,
      };
      try {
        const result = runOn(on, ctx);
        return jsonResponse(result);
      } catch (e) {
        if (e && e.detail) return jsonResponse(e.detail, 400);
        return jsonResponse({ error: 'internal', message: String(e && e.message) }, 500);
      }
    }

    // 2. Page (Web)
    if (method === 'GET') {
      const page = findPage(path);
      if (page) {
        const ctx = { env: new Map(), fx, log, response: null, seed: S };
        return htmlResponse(renderPage(page, ctx));
      }
    }

    return jsonResponse({ error: 'not_found', method, path }, 404);
  }

  // `on every` — Cloudflare cron trigger gọi scheduled
  async function scheduled(_event) {
    const results = [];
    for (const n of ast.body) {
      if (n.type === 'On' && n.every) {
        const ctx = { env: new Map(), fx, log, body: {}, response: null, seed: S };
        for (const s of n.body) execStmt(s, ctx);
        results.push({ every: n.every, ok: true });
      }
    }
    return results;
  }

  // Cho test truy cập
  return { fetch, scheduled, log, fx, store: fx.snapshotStore() };
}

module.exports = { createWorker };