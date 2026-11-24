# Why We Did It This Way

Eight decisions, each in two lines. This page is a translation: to change a decision, change it at the machine layer first.

- **D1. We made 10ms our brand and our filter.**
  Why: Workers Free gives 10ms of CPU, and a hard limit filters out useless work.

- **D2. We built our own core instead of using Hono.**
  Why: Hono is a safe default at 14KB; 10ms aims smaller with zero waste. We respect Hono. We are not a clone.

- **D3. We went public under MIT.**
  Why: Hidden means no community. People can copy the code, but not our community, story, trust or speed.

- **D4. The core stays tiny.**
  Why: Any AI can read a small core in one go. The ecosystem grows outside the core.

- **D5. The live status note stays under 30 lines.**
  Why: AI context is limited. The status note is "now", the log is "history".

- **D6. The AI-facing rulebook is written in English.**
  Why: Every AI reads English best, so we keep it simple.

- **D7. Two layers: the machine layer is the root, the human layer is its translation.**
  Why: AI reads fewer tokens, there is one source of truth, and the story stays warm for the community.

- **D8. Work in micro-steps and commit after each one.**
  Why: A sudden limit killed the previous merge halfway. Now the most we can lose is one step.
