# Internal Linking Operations

## Goal
Build and maintain a complete internal-link graph across public pages, with no orphan URLs and consistent crawl paths.

## Implemented Assets
- Global internal link catalog: `src/lib/internal-linking.ts`
- Global SEO internal links renderer: `src/components/SeoInternalLinks.tsx`
- Reusable breadcrumb component: `src/components/InternalBreadcrumbs.tsx`
- Internal link audit generator: `scripts/seo/generate-internal-link-audit.mjs`
- Audit outputs:
  - `reports/internal-link-audit.csv`
  - `reports/internal-link-unknown-paths.csv`

## Run Audit
```bash
npm run seo:internal-links:audit
```

## CSV Columns
- `url`: target page URL
- `cluster`: Marketplace / Listings / Categorie / Utenti / Company / ProdottiServizi
- `incoming_links`: number of internal references detected
- `outgoing_links`: number of links emitted by that page template
- `orphan`: `yes` when no incoming links
- `priority`: `Alta`, `Media`, `Bassa`
- `source_files`: code files where incoming links were found

## KPI Targets
- `orphan = 0` on all public URLs
- `unknown paths = 0` in `internal-link-unknown-paths.csv`
- reduce `priority=Alta` rows by adding contextual links on high-value pages

## Weekly Workflow
1. Run `npm run seo:internal-links:audit`.
2. Open `reports/internal-link-audit.csv`.
3. Filter `priority=Alta`.
4. Add contextual links in page templates with highest traffic and business value.
5. Re-run audit and compare counts.

## Rollout Order
1. Global templates (footer, breadcrumbs, SEO internal links).
2. Contextual links in:
   - `/requests/[id]`
   - `/category/[category]`
   - `/category/[category]/[product]`
   - `/user/[username]`
3. Dynamic related-links components backed by DB filters (public + active only).
