# Bluesky Beta regression test report

## Scope

- Base implementation: DotComScouts Beta 98.27 on the isolated development branch.
- Master V98 and the live site were not changed.
- No merge is authorized by this report.

## Executed in the available test harness

The current Bluesky explorer script was executed with mocked DOM elements and mocked API responses. All four inline JavaScript blocks were parsed with `new Function`.

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

These are simulated API-response tests, not a live browser test against Bluesky.

## Code correction

URL canonicalization now removes common tracking/session parameters from article URLs even when the URL has a non-empty path. Meaningful query parameters are retained only for URLs without a path. The change is isolated to the Bluesky explorer.

## Remaining verification

1. Run the committed Node.js regression suite in GitHub Actions.
2. Test the public Bluesky API from a real browser environment, including rate limiting and CORS behavior.
3. Check source isolation and existing domain-check, CSV-export, language, and risk-review flows for regressions.
4. Only after these pass, design a controlled integration test with the other signal APIs. Keep their evidence separate and do not alter domain availability checks.
5. Do not merge without explicit approval.
