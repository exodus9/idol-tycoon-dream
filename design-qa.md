# Dream Group idol-card product QA

## Visual source of truth

- Reference: `/Users/tae-woonahn/Documents/Codex/2026-07-31/new-chat-7/outputs/dream-group-idol-card-home-target.png`
- Implementation: `/Users/tae-woonahn/Documents/Codex/2026-07-31/new-chat-7/outputs/qa-home-390x844.png`
- Combined comparison: `/Users/tae-woonahn/Documents/Codex/2026-07-31/new-chat-7/outputs/dream-group-target-vs-build.png`
- Reference and implementation comparison size: 390 × 844 each
- Responsive checks: 390 × 740, 390 × 844, 390 × 920

## Comparison result

The implementation preserves the target's character-first dark lobby, one central permanent idol card, spatial shortcuts, single primary action, next-growth strip, and fixed five-tab shell. It intentionally uses the product's existing real idol portrait without generative transformation; the fictional target portrait is a composition reference only.

At 390 × 740, 844, and 920 the document height equals the viewport height, the primary CTA remains above the 64px tab bar, and the home has no outer scroll. Taller screens increase character/scene breathing room. Long tool, collection, result, and ceremony screens use explicit inner scrolling.

## Twenty critic passes: accepted fixes

| Area | Severity | Fix |
| --- | --- | --- |
| Main card hook | P1 | Made the idol card the permanent home hero with RUN, stars, best record, progress, and one state-aware CTA. |
| Growth integrity | P1 | Star promotion now requires both accepted best-record runs and score gates instead of attendance alone. |
| Terminology | P1 | Separated personal audition success from later group debut and stage competition. |
| First-session contract | P1 | Guaranteed the first idol card, added a pre-run reward preview, and made 12/24-turn copy dynamic. |
| Failure retention | P1 | Failed idols now leave incomplete cards and retry paths; completed cards retain failed attempts in the version album. |
| Decision clarity | P1 | Exposed mental, expected card gains, resource impact, and risk on the training screen. |
| Version ownership | P2 | Added a per-idol RUN album and retained the current representative version. |
| Card taxonomy | P1 | Separated permanent IDOL CARD from play-earned SUPPORT DECK equipment in navigation, copy, and result blocks. |
| Group feedback | P1 | Card stars affect battle power and a loss recommends a specific member retry with the score gap. |
| Honest goals | P1 | Replaced the hard-coded fake daily objective with a state-derived NEXT GOAL. |
| Achievement integrity | P1 | Repaired battle achievements to read the current per-group lifetime record. |
| Mobile access | P1 | Restored zoom, added reduced-motion support, 44px primary utility targets, hidden scroller chrome, and long-screen inner scrolling. |
| Live lobby | P2 | Reconnected the dormant particle layer so the spatial lobby is not static. |
| Onboarding priority | P1 | Before three completed cards, new-member acquisition beats same-idol star grinding; incomplete cards still prioritize retry. |
| Result priority | P1 | Before three candidates, the result primary action recruits the next idol; retries become contextual. |
| Data isolation | P0 | Cleared and validated retraining identity context to prevent one idol overwriting another. |
| Group score propagation | P0 | Group scores now derive from live roster cards and are resubmitted after a member changes. |
| Save durability | P1 | Capped histories at 20 runs per idol, removed duplicate images, and surfaced local storage failure. |
| State correctness | P0 | A successful retry always replaces an incomplete representative; failed complete-card runs no longer claim a best-version update. |
| Final resilience | P1 | Verified fixed-home layout and scroll escape paths across 740/844/920 heights; no remaining P0 was found. |

## Five additional whole-app passes

1. Added explicit height, inner scroll, and debut CTA clearance to long sub-screens.
2. Restored the previously authored home `extra` actions and verified 3–10px separation from primary/daily controls at 740/844/920.
3. Made tutorial duration copy follow the selected 12/24-turn mode.
4. Repaired the first-home tutorial spotlight selector after the spatial-home migration.
5. Added a continue/new-run confirmation before replacing an active training save.

## Functional verification

- Home card states: empty, in-progress, complete, incomplete: implemented.
- First-run card promise and 12/24-turn copy: implemented.
- Retraining identity guard for catalog, missing-catalog, and custom idols: implemented.
- Star and best-record progression: implemented.
- Version album and failed-run retention: implemented.
- Group/battle live card bonus and retry feedback: implemented.
- Five-tab navigation, menu return, collection filters, and long-screen scrolling: implemented.
- 390 × 740 / 844 / 920 home geometry: verified.
- Page scroll height equals viewport at 390 × 844: verified.
- Primary CTA clears the tab bar: verified.
- Home extra/primary/daily controls do not overlap at 390 × 740 / 844 / 920: verified.
- Active-run replacement confirmation: verified.
- JavaScript syntax: passed.
- `git diff --check`: passed.
- Browser console errors: none.
- Local HTTP response: 200.

Production uses the existing Firestore-backed leaderboard. Server-authoritative anti-cheat is outside this frontend redesign; this pass does resubmit live group power after card changes.

## Final result

passed
