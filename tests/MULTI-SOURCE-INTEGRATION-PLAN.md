# Controlled multi-source integration plan

## Current state

- The Bluesky explorer is an isolated panel and does not feed the production domain trend pipeline.
- Deterministic Bluesky regression tests and live endpoint/browser smoke tests are available in GitHub Actions.
- Public API smoke tests for Hacker News Algolia, GitHub Search, Hugging Face, Stack Exchange, npm Registry, and DEV Community have passed in the CI runner.
- A non-production shadow prototype exists at `lib/shadow-evidence.js`; it is covered by deterministic tests and is not imported by `index.html`.
- These checks validate endpoint reachability and response shape, not market quality or cross-source scoring.
- Do not merge this branch without explicit approval.

## Evidence dimensions must remain separate

Every future source adapter should preserve the distinction between:

1. **Problem evidence** — a concrete failure, unmet need, workaround, cost, or recurring friction.
2. **Independent demand evidence** — distinct people or organizations expressing a similar need, not merely multiple reposts or translations of one item.
3. **Product evidence** — an existing product, repository, package, model, demo, or launch that may validate a category but may also indicate competition.
4. **Resonance** — likes, replies, votes, stars, downloads, comments, views, or reposts. These are source-specific snapshots and must not be treated as growth rates.
5. **Freshness** — source timestamp and retrieval timestamp, kept separately.
6. **Source reliability** — endpoint status, payload validation, source type, and whether a record is original, syndicated, promotional, or user-generated.

A technical issue by itself is not proof of demand. A product launch is not proof of market size. Engagement is not a substitute for either.

## Proposed normalized record for a later integration layer

```json
{
  "source": "bluesky | hackernews | github | huggingface | npm | stackexchange | devto",
  "sourceRecordId": "source-specific stable identifier",
  "sourceUrl": "canonical public URL",
  "publishedAt": "ISO-8601 or null",
  "retrievedAt": "ISO-8601",
  "authorOrPublisher": "handle, organization, or project",
  "language": "BCP-47 tag or unknown",
  "text": "title and/or description",
  "evidence": {
    "problem": false,
    "demand": false,
    "product": false,
    "discussion": false,
    "promotion": false
  },
  "resonance": {
    "kind": "source-specific metric names",
    "values": {}
  },
  "dedupe": {
    "canonicalUrl": "normalized URL or null",
    "entityKey": "verified project/product key or null",
    "syndicationKey": "verified shared-origin key or null"
  },
  "sourceStatus": "validated | partial | failed"
}
```

This is a design proposal, not a production data contract. The isolated prototype currently implements basic classification, URL deduplication, and independent-author/source counts, but it must be revised against real payloads and labelled examples before any production integration.

## Required regression fixtures before cross-source scoring

- Same article repeated with tracking parameters: count once.
- Same post translated by known localized accounts: count once only when shared origin/product identity is supported.
- Two different projects using the same technical keywords: retain both.
- One bug report with no independent corroboration: problem evidence may be true; independent demand remains unproven.
- Similar problem reports by distinct authors on separate sources: demand evidence may increase only after duplicate/syndication checks.
- Product launch without problem evidence: product evidence only.
- Popular opinion with high engagement: resonance only; no automatic demand claim.
- Promotional/webinar post: exclude from demand evidence.
- Stale post with high historic engagement: preserve freshness and resonance separately.
- Source API timeout, HTTP 429, malformed payload: mark source partial/failed without stopping other sources.
- Domain availability response: never infer market demand from available/taken status.
- Experimental source failure: must not alter the main trend pipeline, language-risk results, CSV export, or availability-check counters.

## Rollout gates

1. Keep all source panels independent while running endpoint and browser smoke tests.
2. Add fixture-based adapters that normalize data without changing existing scores.
3. Add cross-source deduplication tests using stable IDs, canonical URLs, and verified entity keys; avoid keyword-only fuzzy merges.
4. Compare normalized evidence against manually labelled examples and record false positives/false negatives.
5. Run a shadow comparison that shows proposed combined evidence beside current scores but does not change domain rankings.
6. Review results and approve a separate integration change explicitly.
7. Never modify the domain availability API or make availability a proxy for demand.


## Evidence-strength scoring prototype – 30.10.2026

The isolated classifier now exposes a transparent, deterministic `evidenceScore` (0–100) per problem cluster. It is a **strength-of-evidence indicator**, not a market-size estimate, purchase probability, or forecast of commercial success.

Scoring components:
- Up to 21 points for up to three independently identified problem authors.
- Up to 30 points for up to three independently identified solution-seeking authors.
- 10 points when problem reports are corroborated by at least two sources and two authors.
- 10 points when explicit demand is corroborated by at least two sources and two authors.
- Up to 16 points for up to two independent authors expressing both solution-seeking and budget/payment language.
- Up to 6 points for urgency among up to two independent authors.

The raw maximum (93) is normalized to 0–100. Repeated records from the same author do not add author points. Canonical-URL duplicates are excluded before aggregation. Promotion is excluded. Feature requests are counted separately and add no score by themselves. Product inventory, likes, downloads, and raw record volume do not add points.

Evidence levels are descriptive bands: insufficient (<20), early (20–39), developing (40–59), corroborated (60–79), strong (80–100). These are provisional thresholds for triage, not validated commercial labels.

Regression fixtures verify that:
- One author repeating a problem cannot manufacture independent corroboration.
- Independent problem, demand, buying, and cross-source signals increase the score.
- Feature requests do not become demand or buying intent.
- Promotional records are excluded.
- Duplicate canonical URLs count once.

The scoring remains isolated in `lib/shadow-evidence.js`. It is not imported by `index.html`, does not change TrendScore, candidate generation, language-risk assessment, CSV output, or availability checks. Do not surface it as a production ranking until it has been calibrated on a broader, manually labelled sample containing both positive and negative cases across multiple markets and languages.
