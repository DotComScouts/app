# Bluesky Beta regression test report

## Scope

- Base implementation: DotComScouts Beta 98.27 on the isolated development branch.
- Master V98 and the live site were not changed.
- No merge is authorized by this report.

## Executed in the available test harness

The committed deterministic Node.js suite has **35 tests; 35 passed, 0 failed** in GitHub Actions. It covers the Bluesky explorer, JavaScript syntax, source isolation, and a separate shadow-evidence prototype. All four inline JavaScript blocks were parsed with `new Function`.

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

URL canonicalization now removes common tracking/session parameters from article URLs even when the URL has a non-empty path. Meaningful query parameters are retained only for URLs without a path. The change is isolated to the Bluesky explorer.

## Live API baseline executed in GitHub Actions

The following real network smoke tests passed from a GitHub-hosted Node.js 22 runner on 2026-10-29:

- Public Bluesky search endpoint: HTTP 200; response contains a posts array with the expected basic post/author fields.
- Hacker News Algolia: response contains a hits array.
- GitHub repository search: response contains an items array.
- Hugging Face model search: response is an array.
- Stack Exchange advanced search: response contains an items array.
- npm Registry search: response contains an objects array.
- DEV Community API: response is an array.

The actual Chromium browser smoke test also passed across all five experimental source panels: Hugging Face, npm Registry, Stack Exchange, DEV Community, and Bluesky. With the default Hugging Face topic list, it loaded 40 projects and displayed 7 relevant ones; npm returned 20 packages, Stack Exchange 20 questions, DEV 20 articles, and Bluesky 50 posts with 28 unique posts displayed. No uncaught browser errors were reported.

Run with 35 deterministic tests, live Bluesky API, six other API smoke tests, and all five browser source panels successful: https://github.com/DotComScouts/app/actions/runs/40972172471

## Shadow evidence prototype

A separate, non-production module at `lib/shadow-evidence.js` now models evidence without feeding the main domain pipeline. Its 14 tests cover problem evidence, explicit demand intent, product evidence, promotion exclusion, resonance separation, URL canonicalization, independent authors, cross-source corroboration, and failed-source handling.

The new tests exposed and helped fix a concrete edge case: a failed source record could reserve a URL deduplication key and suppress a later valid record. Failed records no longer reserve deduplication keys. This fix remains confined to the shadow prototype.

The deterministic suite and the shadow-evidence suite pass together: **35/35**.

These tests prove that the public endpoints were reachable and their response shapes matched expectations at the time of the run. The browser test also proves that all five experimental UI panels fetched live data from the CI browser origin. It does not prove behavior on the production domain, semantic relevance of every real result, or long-term availability. External-source smoke jobs are diagnostic and do not block the deterministic suite.

## Remaining verification

1. Repeat browser testing against the actual deployed preview/origin, including rate limiting and retry behavior.
2. Check source isolation and existing domain-check, CSV-export, language, and risk-review flows for regressions.
3. Build controlled cross-source fixtures to distinguish problem evidence, independent demand evidence, product evidence, and resonance. Keep source evidence separate and do not let Bluesky alter domain availability checks.
4. Only after these pass, design a controlled multi-source integration test.
5. Do not merge without explicit approval.
