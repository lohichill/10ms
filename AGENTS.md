# AGENTS.md
role: you are manager/dev on shift of repo 10ms. not a guest. follow exactly. invent no rules.
conflict: machine layer wins. always.

## 0. ARCHITECTURE (LOCKED)
| layer | files | style | edit |
|---|---|---|---|
| MACHINE (root) | AGENTS.md, STATE.md, 10ms.json | short, bullets, key:value, tables | here |
| HUMAN (translation) | README.md, DECISIONS.md | natural, story, community voice | never directly |
- flow: edit machine -> commit -> AI translates to human -> commit
- 2 layers disagree: machine is right, rewrite human
- human voice: community ("One of us", "Our ceiling"), never "I". see 10ms.json story

## 1. READ ORDER (cheapest first)
1. STATE.md
2. `git log -5`
3. AGENTS.md
4. 10ms.json
- README.md, DECISIONS.md: only when translating or answering humans
- STATE vs git disagree: trust git, fix STATE first

## 2. PROJECT
- what: ultra-lightweight, AI-native language; first runtime targets Cloudflare Workers
- goal: <10ms CPU per request, zero runtime dependencies, no quality loss
- CPU counts. waiting on fetch/KV/D1 is free
- philosophy: limit is the brief | CPU is gold | delete first, add last
- budget: CPU <10ms (target 2-4) | bundle <50KB (target <20KB) | deps 0
- license: MIT, public. copy freely, keep credit "10ms / Vionsky"
- copy = ad, not enemy. win by faster, clearer, more trusted

## 3. LAW = Contribution Logic v1 (5 Articles)
A1 THREE QUESTIONS (answer in writing before code)
- Q1 more CPU? Q2 bigger bundle? Q3 remove it, app still runs?
- Q3=yes: do not write. Q1/Q2=yes: justify with benchmark
- cannot answer: no code, log question in STATE Blocked
A2 NO BLOAT
- no dependency if hand-writable in <20 lines
- no feature without before/after benchmark
- delete beats add
A3 ONE SHAPE: every PR = Goal | Code | CPU Benchmark | How to test
- benchmark = same input, p50+p90 CPU ms, bundle KB. no benchmark = no merge
A4 NO ORPHAN CODE: every function has 1 comment = WHY, not WHAT. no reason = delete
A5 ONE README IS ENOUGH: code needing another doc -> simplify code
- web-standard APIs, short functions, early returns
- AI reply = (1) Q1-Q3 answers (2) smallest change (3) PR in A3 shape. never add dependency. unsure -> delete

## 4. ANTI-LIMIT (most important)
assume: you can be cut off any second.
- no big task. split into micro-steps, max 15 min each
- per micro-step: work -> update STATE.md -> commit -> next step
- never batch docs to the end. max loss on cut = 1 micro-step
- commit msg: `T<id>: <what> | cpu <n>ms` (git log = recovery trail)
- big outputs: deliver in parts, machine layer first

## 5. RECOVERY (someone was cut off, you take over)
1. read STATE.md + `git log -5` + `git status`
2. last commit = last finished step
3. uncommitted diff: valid -> commit, else discard
4. rewrite STATE.md to match truth -> commit `STATE: resync`
5. resume at next step
- stale lock (owner silent, no commit for 1 session): lead releases it

## 6. MULTI-AGENT
roles: lead (1) = review PRs, record to machine layer, translate to human. dev (n) = code.
- 1 agent = 1 task. claim = write your name in `owner` of that task in STATE.md BEFORE coding
- claim = 1-line commit to main touching only your task line (only allowed direct push)
- locked task: do not touch, pick another
- 1 agent = 1 branch `agent/<name>/T<id>`. never push code to main
- never 2 agents on 1 file at once. need it: wait or ask lead to split
- done: open own PR in A3 shape. no benchmark = no merge
- dev edits only code + own task line in STATE.md. never README/DECISIONS/AGENTS/10ms.json
- lead: merge -> update machine layer -> translate to human -> move task to Done/LOG

## 7. FILES (1 file = 1 job, no repeated ideas)
| file | max lines | job | forbidden |
|---|---|---|---|
| STATE.md | 30 | doing / done / blocked | history, story |
| AGENTS.md | 100 | law | story |
| 10ms.json | 60 | constants, canon | prose |
| README.md | 250 | story, demo, contribute | detailed law |
| DECISIONS.md | 80 | why | rules |
| LOG.md | 100 | 1 line per session | - |
- LOG.md > 100 lines: summarize to 5 lines, delete old, new LOG.md starts with the 5 lines
- LOG line: date | agent | did | cpu

## 8. HANDOVER (before you stop)
1. STATE.md: doing / done / blocked
2. LOG.md: +1 line
3. commit + push. uncommitted = lost
