# Vigia Congresso

Static public frontend in `dist/`. Serve with any static HTTP server. No database, credentials, payment integration or fabricated legislative records.

## Data contract

Monthly files contain `month`, `days`, `proposals`, `events`. Index lists available files and confirmed coverage. Unconsulted days are never treated as empty confirmed days. Months load on demand; ranking loads only months intersecting the chosen period.

Proposal fields: official prefixed `id`, `house` (Câmara or Senado), `type`, `number`, `year`, `presentedAt`, `officialSummary`, `source`, `authors`. Author fields: official `id`, `name`, context-specific `party`, `state`, `office`, `role` (`principal` or `coautoria`). Events have stable official `id`, `proposalId`, event `date`, separate `collectedAt`, `description`, `kind`, `stage`, `target` (texto principal/emenda/parecer/requerimento), and optional `vote` with official source and `nominalOfficial`. Never infer votes from attendance. AI summaries must set `aiSummary: true`. Conflicts set `conflict: true`.

## Collection status and limitations

The Senado collector now uses the current `/dadosabertos/processo` API and normalizes official authors and legislative reports into monthly JSON. Run `node scripts/collect-senado.mjs`. Initial import: processes identified in 2026, reports from 1 November 2026 through the collection date. House-specific counts and partial coverage are exposed in the index. Official report IDs deduplicate records across autuacoes. Signature order does not establish principal authorship; Senate authors use a separate official-authorship category. Original authorship-summary party/UF is preserved when matched; disagreements with structured affiliation fields are flagged. No votes are inferred from reports or attendance.

Responses are archived immutably with content hashes. Normalized records keep their original collection timestamp when their content is unchanged. Repeated runs on unchanged responses do not create new data commits. Configure `SENADO_YEAR`, `COLLECTION_FROM`, and `COLLECTION_TO` for explicit import scope. The annual scope and incomplete nominal-vote coverage remain visible. Proposals identified before 2026 and complete Senate voting results still need expanded collection. The Câmara collector now normalizes proposals, authors and movements selected both by presentation dates and by movement dates. Historical affiliation comes from the official deputy history at proposal presentation; missing or conflicting affiliation is not inferred from the current party. Official proponente flags separate principal and supporting signatures. Portraits refresh independently and never overwrite historical affiliations. Both collectors are invoked by `scripts/collect.mjs` in the prepared daily workflow.

The GitHub Actions workflow now collects, validates, commits changed data and deploys `dist` directly to GitHub Pages in the same run. Read [PUBLICAR-NO-GITHUB.md](PUBLICAR-NO-GITHUB.md) for the complete Portuguese setup guide. This workflow is independent of Codex/Sites cloud schedules and needs no personal token or API key. The daily run includes `scripts/summarize.mjs`; the 19 initial explanations are stored with source fingerprints in `content/summaries.json`, and future records get a local rule-based simplification with terminology explanations. Original ementas and legislative reports remain available in expanded details.

## Donations

Configure `dist/data/support.json` with `pixKey`, `recipient` and optionally a local `qrImage` path. Until a key and recipient are configured, only the upcoming availability message appears. Do not add unverified payment data.

## Checks

`node --check dist/app.js` and `node scripts/validate.mjs`.
