# Bluesky Beta regression test report

## Scope

- Base implementation: DotComScouts Beta 98.28 on the isolated development branch.
- Master V98 remains unchanged.
- The user-authorized GitHub Pages live test site was updated to Beta 98.28; no PR merge has been performed.

## Executed in the available test harness

The committed deterministic Node.js suite has **53 tests; 53 passed, 0 failed** in GitHub Actions. This includes an 18-case labelled English/German/Spanish classification corpus, 14 shadow-evidence regression tests, three normal-flow integration architecture checks, and four shadow-normalization checks for term relevance, tracking-URL deduplication, distinct query preservation, and scoring isolation. All four inline JavaScript blocks were parsed with `new Function` in the prior syntax suite.

| Case | Result |
|---|---|
| All four inline JavaScript blocks parse | PASS |
| Empty search query is rejected before API access | PASS |
| Network failure is surfaced and button is restored | PASS |
| HTTP 429 is surfaced | PASS |
| Malformed API payload is surfaced | PASS |
| Webinar/registration promotion is excluded | PASS |
| Paid promotion is excluded | PASS |
| Genuine open-source product launch remains eligible | PASS |
| Concrete technical problem is classified and shown | PASS |
| General opinion without technical evidence is excluded | PASS |
| Localized ToolDurus account variants collapse to one result | PASS |
| Same article with tracking-parameter variants collapses | PASS after URL-normalization fix |
| Distinct article URLs remain separate | PASS |
| Empty API response renders an empty state | PASS |
| No-resonance product signal is not labelled a strong community signal | PASS |
| Result text is HTML-escaped | PASS |
| Bluesky DOM/state remains isolated from the core domain pipeline | PASS |

The functional unit cases use simulated API responses. The live API and browser checks below are separate real-network tests.

## Code correction

URL canonicalization removes common tracking/session parameters while preserving meaningful query parameters on search/article paths. This prevents different query results from being merged just because they share the same path. The change is isolated to the shadow prototype/Bluesky explorer.

The shadow classifier was also tightened after tests exposed a conceptual false positive: a post saying “Looking for a tool…” is demand intent, not proof that the writer has personally encountered a confirmed technical failure. The current prototype separately counts concrete problem reports and explicit solution requests; corroborated problems no longer automatically count as corroborated demand. Basic German and Spanish phrases are covered by labelled fixtures.

## Live API baseline executed in GitHub Actions

The following real network smoke tests passed from a GitHub-hosted Node.js 22 runner on 2026-10-29:

- Public Bluesky search endpoint: HTTP 200; response contains a posts array with the expected basic post/author fields.
- Hacker News Algolia: response contains a hits array.
- GitHub repository search: response contains an items array.
- Hugging Face model search: response is an array.
- Stack Exchange advanced search: response contains an items array.
- npm Registry search: response contains an objects array.
- DEV Community API: response is an array.

The deployed-origin Chromium browser smoke test passed across all five source panels: Hugging Face, npm Registry, Stack Exchange, DEV Community, and Bluesky. It then clicked the ordinary “Trends prüfen → .coms finden” button and verified that the normal run invoked all five shadow adapters. The panel check also confirmed that the standalone panels did not mutate core domain results, core trend candidates, or domain-check progress. No uncaught browser errors were reported.

- Deployed-origin browser integration run: https://github.com/DotComScouts/app/actions/runs/40974213585
- Live test deployment commit: https://github.com/DotComScouts/app/commit/c8a215aaab6f8cd3f6b1d1b18e04da9d3ecfcfc3
- Live test site: https://dotcomscouts.github.io/app/

## Shadow evidence prototype

A separate, non-production module at `lib/shadow-evidence.js` now models evidence without feeding the main domain pipeline. Its 14 tests cover problem evidence, explicit demand intent, product evidence, promotion exclusion, resonance separation, URL canonicalization, independent authors, cross-source corroboration, and failed-source handling.

The new tests exposed and helped fix a concrete edge case: a failed source record could reserve a URL deduplication key and suppress a later valid record. Failed records no longer reserve deduplication keys. This fix remains confined to the shadow prototype.

The deterministic suite and the shadow-evidence suite pass together: **46/46** (including 18 labelled classification fixtures).

These tests prove that the public endpoints were reachable and their response shapes matched expectations at the time of the run. The deployed-origin browser test proves that the ordinary trend run calls all five shadow adapters and that the standalone panels do not mutate core state. It does not yet prove semantic relevance of every returned record, cross-source deduplication quality, or long-term availability. External-source smoke jobs are diagnostic and do not block the deterministic suite.

## Remaining verification

1. Compare the normalized evidence collected by the five adapters against known labelled examples, including relevance, duplicate handling, and source failures.
2. Verify CSV export, language-risk filtering, and domain-availability flows after the shadow requests complete; the new adapters currently do not write to those flows.
3. Keep source evidence in shadow mode until comparison results demonstrate improved signal quality. Only then consider changing the core trend score.
4. Do not merge the draft PR without explicit approval.
