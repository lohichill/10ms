# Why We Did It This Way

Eleven decisions, each in two lines. This page is a translation: to change a decision, change it at the machine layer first.

- **D1. 10ms is a language. The framework is only its first host.**
  Why: Platforms and frameworks age. A language made for AI can outlive both.

- **D2. The eight principles never change. Only the human owner may amend them.**
  Why: A compass that moves is not a compass. Agents drift; principles must not.

- **D3. We write for AI first. People get a view, not the source.**
  Why: Serving both makes the code worse for both. AI pays per token; a person can always ask for a translation.

- **D4. A program never names a platform.**
  Why: Hosts are mortal. Moving to a new one must never mean a rewrite.

- **D5. We made 10ms our name and our filter.**
  Why: The number came from a real wall, and a hard limit filters out useless work.

- **D6. We went public under MIT.**
  Why: Hidden means no community. People can copy the code, but not our community, story, trust or speed.

- **D7. The core stays tiny, then freezes.**
  Why: Any AI can read a small core in one go. Once frozen, it only grows by addition and never breaks an old program. The ecosystem grows outside.

- **D8. No rule names a syntax, a version or a vendor.**
  Why: A rule must stay true if today's platforms and models vanish. Syntax lives in the one-page spec; vendors live in the host list.

- **D9. Two layers: the machine layer is the root, the human layer is its translation. The machine layer is in English.**
  Why: AI reads fewer tokens, there is one source of truth, and the story stays warm for the community. Every AI reads English best.

- **D10. The live status note stays under 30 lines.**
  Why: AI context is limited. The status note is "now", the log is "history".

- **D11. Work in micro-steps and commit after each one.**
  Why: A sudden limit once killed a merge halfway. Now the most we can lose is one step.