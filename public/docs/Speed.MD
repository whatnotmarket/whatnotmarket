# Speed.MD

## Goal
Keep every page production-safe for Core Web Vitals while preserving SSR, SEO, analytics essentials, and business flows.

## Permanent Checklist
- Use canonical, direct-entry URLs for primary landing pages.
- Keep above-the-fold render path free from non-essential JS.
- Ensure hero/LCP asset is discoverable in initial HTML.
- Defer non-critical third-party scripts to `lazyOnload` or idle.
- Avoid route-level client bundles that include entire page trees when only one section is interactive.
- Validate no hydration warnings/errors in browser console.
- Validate no broken links (`404`) and no repeated failing API calls (`4xx/5xx`) on first render.
- Confirm icon-only buttons expose accessible names.

## CWV Rules
### LCP
- LCP resource must be present in initial HTML and not hidden behind client-only rendering.
- Use `priority` and `fetchPriority="high"` for LCP image.
- Keep LCP element stable (no late DOM swaps for hero block).

### CLS
- Reserve dimensions for media and dynamic content.
- Avoid injecting bars/banners above existing content after paint without reserved space.

### INP / TBT
- Keep startup JS minimal on initial route.
- Move below-the-fold sections to dynamic chunks where SEO impact is negligible.
- Avoid synchronous layout reads after DOM writes; batch in `requestAnimationFrame`.

### TTFB
- Prefer static/server-rendered content for public pages when possible.
- Avoid unnecessary redirect hops on primary entry route.

## Hero & Above-the-Fold
- Hero image must be eager and high-priority.
- Keep hero markup server-renderable.
- Delay heavy widgets under hero to post-interaction or post-idle if not critical.

## Dynamic Imports
- Use `next/dynamic` for below-the-fold, modal-only, or interaction-gated sections.
- Use `ssr: false` only for non-index-critical client UI.
- Keep key SEO content server-rendered.

## Analytics / GTM / PostHog / Replay
- Initialize GA/GTM with `lazyOnload` and idle callback.
- Initialize PostHog lazily (idle or first interaction), not in critical path.
- Keep session replay/surveys/dead-click/web-vitals collection opt-in via env flags.
- Never block first paint for analytics scripts.

## Critical CSS vs Non-Critical CSS
- Keep global CSS minimal; avoid importing large style bundles unless globally required.
- Route-only visual systems must not be pulled into unrelated first paint paths.
- Re-check Lighthouse render-blocking CSS after every major UI addition.

## Accessibility Minimum Bar
- Every interactive control must have an accessible name.
- Icon buttons require `aria-label`.
- Avoid nested interactive controls (`button` inside `a`, etc.).

## Caching Rules
- `/_next/static/*`: `public, max-age=31536000, immutable`.
- Static image assets: long immutable cache where filenames are versioned.
- Third-party scripts are not controllable server-side: mitigate by loading late.

## Hydration / SSR / Client Components
- Keep root/layout deterministic between server and client.
- Prevent hydration mismatch sources: time-dependent render output in server HTML, invalid DOM nesting, client-only random output before mount.
- Use client components only for interactive islands.

## Red Flags
- Root page redirecting to main marketing page.
- Missing routes referenced in nav/footer.
- Global providers importing heavy client libraries at startup.
- Console errors ignored as "non-blocking" in production.
- Forced reflow from immediate mutate + measure loops.

## Pre-Merge Performance Procedure
1. Run Lighthouse mobile + desktop on target page.
2. Check Core Web Vitals diagnostics: LCP candidate, render-blocking, unused JS, forced reflow.
3. Inspect console for hydration, 404, and API errors.
4. Verify tracking still fires in network tab after deferred loading.
5. Re-check accessibility names for all icon/button triggers in updated UI.

## Definition of Done (Performance-Safe Page)
- No avoidable redirect on canonical entry.
- LCP image prioritized and discovered in initial document.
- No high-impact render-blocking warnings left from avoidable app code.
- Third-party analytics/replay not on critical path.
- No hydration mismatch or route 404 errors in console.
- No accessibility-name violations for buttons.
- Lighthouse/PageSpeed shows measurable improvement on mobile and desktop with no business regression.
