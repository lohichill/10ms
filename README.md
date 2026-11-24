# 10ms

**Redefine the limit.**

Every platform has a ceiling. Most of us pay to raise it, or walk away.
10ms is the third way: a tiny, zero-dependency framework for Cloudflare Workers
that runs in under 10ms of CPU, without losing quality.

[Run the demo](#the-demo) · [Contribute in 5 minutes](#contribute-in-5-minutes) · [Contribution Logic](#10ms-contribution-logic)

---

## The 10ms Story

**Two ceilings. Twenty years apart. One answer.**

**2006: The elevator.** A software crash stopped an elevator in Vancouver.
A programmer climbed twenty-one flights of stairs, annoyed that software fails so easily.
He refused to call that normal. He started a new language, named after a fungus built to survive.
That language is **Rust**.

**2026: The wall.** One of us was building Vionsky, a social AI platform, on a Cloudflare Pages Worker.
Then a request crossed 10ms of CPU. Past that line, it fails with Error 1102.
The usual advice arrived on cue: add a framework, add a layer, pay for a bigger plan.

**Our ceiling.** Everyone here knows a wall like this: a free tier, a tiny budget, a slow phone, a team of one.
Rust turned a crashed elevator into a language. 10ms turns a CPU ceiling into a discipline.
Different decade. Different limit. Same move: refuse to call it a wall.

> **What would we build if the limit were the brief?**

---

## The Philosophy

| Principle | What it means |
|---|---|
| **1. The limit is the brief.** | A constraint is a specification, not an excuse. Design for it from line one. |
| **2. CPU is gold. Waiting is free.** | Only CPU time counts toward the 10ms. Waiting on `fetch`, KV or a database does not. |
| **3. Delete first. Add last.** | The fastest code is the code that never runs. |

---

## What 10ms Is. And Is Not.

| 10ms is | 10ms is not |
|---|---|
| A tiny framework for Cloudflare Workers | A framework for every runtime |
| Zero runtime dependencies | A wrapper around other packages |
| A core small enough to read in one sitting | A codebase that needs a map |
| A CPU budget you can measure | A promise you have to trust |
| Quality kept, work moved off the hot path | Features cut to look fast |
| A habit: measure, trim, share | A race to add features |

10ms is the per-request CPU limit on the [Workers Free plan](https://developers.cloudflare.com/workers/platform/limits/).
Our budget: under 10ms CPU (goal 2 to 4ms), under 50KB bundle (goal under 20KB), zero dependencies.

---

## The Demo

Under 60 lines. Save as `index.js`, run `npx wrangler dev index.js --compatibility-date 2026-01-01`, then `curl localhost:8787/health`. Every comment says WHY.

```js
// index.js — a complete 10ms Worker. Copy it. Run it. Make it smaller.

// WHY: built once per isolate, not once per request.
const JSON_HEADERS = { 'content-type': 'application/json' }
const encoder = new TextEncoder()

// WHY: an object lookup costs less than regex matching or a router loop.
const routes = {
  'GET /health': () => new Response('ok'),
  'POST /echo': echo,
  'GET /stream': stream,
}

export default {
  // WHY: the single entry point. Workers calls it once per request.
  async fetch(req, env, ctx) {
    // WHY: slicing a string is cheaper than new URL() when only the path matters.
    const url = req.url
    const start = url.indexOf('/', 8)
    const end = url.indexOf('?', start)
    const path = end === -1 ? url.slice(start) : url.slice(start, end)

    // WHY: fail fast. Unknown routes should cost almost nothing.
    const handler = routes[req.method + ' ' + path]
    if (!handler) return new Response('Not Found', { status: 404 })

    const res = await handler(req, env, ctx)

    // WHY: work the response does not need runs after the response.
    ctx.waitUntil(log(req.method, path, res.status))
    return res
  },
}

// WHY: proves a JSON body round-trips. Waiting on I/O is free; only CPU counts.
async function echo(req) {
  let body
  try { body = await req.json() } catch { return new Response('Bad JSON', { status: 400 }) }
  return new Response(JSON.stringify({ echo: body }), { headers: JSON_HEADERS })
}

// WHY: send chunks as they are ready. Never buffer what you can stream.
function stream() {
  let i = 0
  const body = new ReadableStream({
    pull(controller) {
      controller.enqueue(encoder.encode(`chunk ${++i}\n`))
      if (i === 3) controller.close()
    },
  })
  return new Response(body, { headers: { 'content-type': 'text/plain' } })
}

// WHY: swap console.log for KV, D1 or analytics. The response never waits for it.
async function log(method, path, status) {
  console.log(JSON.stringify({ method, path, status }))
}
```

---

## Contribute in 5 Minutes

No permission needed. No meeting. No setup guide. Three steps.

**1. Run it (1 min)**

```bash
git clone https://github.com/shiba-108/10ms && cd 10ms
npx wrangler dev index.js --compatibility-date 2026-01-01
```

**2. Pick one target (2 min).** Change one thing. Take one from the table, or open an issue with your own.

| Target | Done when |
|---|---|
| `json()`, `text()`, `stream()` helpers | Each is tiny, benchmarked, dependency-free |
| Hand-written validation | It replaces a schema library, with CPU measured before and after |
| Light auth and rate limiting | Cache-friendly, with CPU measured |
| A repeatable CPU benchmark | Anyone can run it and paste the numbers |
| Your 10ms story | You open an issue: where did the wall hit you? |

**3. Open a PR (2 min).** Paste this into the description and fill every section.

```markdown
### Goal
One sentence: what gets faster, smaller or clearer?
### Code
What changed, and why it must exist.
### CPU Benchmark
| | Before | After |
|---|---|---|
| CPU ms (p50 / p90) | | |
| Bundle KB | | |
### How to test
Commands a stranger can paste.
```

Measure CPU on a deployed Worker (the Workers Free plan is enough): enable Workers Logs and read CPU time from each invocation log.
If you cannot deploy, say how you measured.

---

## 10ms Contribution Logic

The constitution of 10ms. Short enough to memorize. Plain enough to paste into any AI.
**Humans:** read it once. **AI (Claude, ChatGPT, Gemini, Grok, Meta AI, or any other):** paste the block below before asking for code.

```text
10MS CONTRIBUTION LOGIC v1
PURPOSE: a zero-dependency Cloudflare Workers framework. Under 10ms CPU per request, no loss of quality.

ARTICLE 1. THREE QUESTIONS (answer in writing before any code)
  Q1. Does it increase CPU?
  Q2. Does it increase the bundle?
  Q3. If we remove it, does the app still run?
  Q3 = yes: do not write it. Q1 or Q2 = yes: justify it with a benchmark.

ARTICLE 2. NO BLOAT
  - No dependency if it can be hand-written in under 20 lines.
  - No feature without a before/after benchmark.
  - Deleting code beats adding code.

ARTICLE 3. ONE SHAPE (everyone in sync)
  Every PR uses exactly this structure:
    1. Goal           one sentence
    2. Code           the change
    3. CPU Benchmark  before and after, same input, p50 and p90 CPU ms
    4. How to test    commands a stranger can paste
  No benchmark, no merge.

ARTICLE 4. NO ORPHAN CODE
  - Every function carries one comment: WHY it exists, not WHAT it does.
  - Code with no reason gets deleted.

ARTICLE 5. ONE README IS ENOUGH
  - A newcomer who reads only this file can contribute.
  - If code needs another document to be understood, simplify the code.
  - Use web-standard APIs, short functions, early returns.

FOR AI AGENTS: reply with (1) answers to Q1 to Q3, (2) the smallest change that works,
(3) the PR in the Article 3 shape. Never add a dependency. When unsure, delete.
```

| The pain | The rule that ends it |
|---|---|
| Confusing, hard to understand | Article 5: one README, plain code |
| Verbose | Article 1, Q3: delete first |
| Bloat and dependency creep | Article 2 |
| Everyone writes their own way | Article 3: one PR shape |
| Old code nobody dares to touch | Article 4: every function has a reason |
| Newcomers do not know where to start | Article 5 and the 5-minute path |

---

## Join Us

Every limit is somebody's wall. Bring yours: fork it, shrink it, ship it.

*Giới hạn không phải bức tường, mà là nơi chúng ta bắt đầu.*
