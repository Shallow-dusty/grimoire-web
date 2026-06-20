# Grimoire Web Release Readiness

> Last updated: 2026-06-20
> Scope: Current release checklist and known verification boundaries.

## Must-Have (Before Internal Launch)

- [x] Sentry error monitoring integrated
- [x] `.env.example` added and updated
- [x] Build regression fixed (`lucide-react` wildcard import removed)
- [x] Core quality gates passing (`lint`, `typecheck`, `test:run`, `build`, pre-deploy check)
- [x] Supabase project status verified via MCP (`ACTIVE_HEALTHY`)
- [x] Supabase Realtime publication verified via MCP

## Should-Have (Before Public Beta)

- [x] E2E coverage expanded (home, sandbox, realistic room setup flow)
- [x] Added sandbox E2E coverage for role assignment + phase transition
- [x] E2E stability hardening (safe click helpers, resilient sandbox/home flows, controlled Playwright workers)
- [x] Web Vitals monitoring integrated (`CLS`, `FCP`, `INP`, `LCP`, `TTFB`)
- [x] User feedback entry added (configurable link, default GitHub Issues)
- [x] GitHub Actions CI workflow added
- [x] Default E2E matrix passing locally (`44 passed, 1 skipped` on Chromium, Firefox, Mobile Chrome)

## Nice-to-Have (Can Follow After Launch)

- [x] Full multiplayer E2E chain with multi-user coordination (create -> join -> assign -> night -> vote -> end)
- [x] Push notification backend endpoint implementation (`push-subscription` Edge Function, `/api/push-subscription` compatible)
- [x] Offline queue backend endpoint hardening (`game-operation` Edge Function + audit/dedup)
- [x] PWA install prompt optimization (`beforeinstallprompt` flow)
- [x] Periodic room-state sync for PWA background behavior

## Notes

- This checklist is the source of truth for release readiness.
- 2026-06-08 current checkout verification: `npm run lint`, `npx tsc --noEmit`, `npm run test:src:logic`, `npm run test:src:ui`, `npm run test:tests`, `npm run build`, `node scripts/pre-deployment-check.js`, and default `npm run test:e2e` passed locally. The default E2E matrix ended with 44 passed / 1 skipped and no flaky tests after stabilizing `e2e/home.spec.ts`.
- Historical deep-dive reports from 2026-02-07 were removed to avoid stale/conflicting status.
- CI and Mobile Chrome skip the duplicate `game-setup-flow` spec; room creation remains covered by `home.spec.ts` and the full `multiplayer-flow` chain.
- WebKit/Mobile Safari are optional in the local matrix and require host-level Playwright WebKit system dependencies.
