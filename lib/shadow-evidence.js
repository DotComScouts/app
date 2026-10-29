'use strict';

const TRACKING_PARAMETER = /^(?:utm_.*|ref|source|campaign|fbclid|gclid|mc_cid|mc_eid|igshid|vero_id)$/i;
const LOCALE_PREFIX = /^\/(?:en|de|fr|es|it|pt|nl|ja|zh|cs|pl|sv|da|no|fi)(?=\/)/i;

function canonicalizeUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  try {
    const candidate = /^www\./i.test(raw) ? 'https://' + raw : raw;
    const url = new URL(candidate);
    if (!/^https?:$/.test(url.protocol)) return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
    let pathname = decodeURIComponent(url.pathname).replace(/\/{2,}/g, '/');
    pathname = pathname.replace(LOCALE_PREFIX, '').replace(/\/$/, '').replace(/\.html?$/i, '').toLowerCase();
    const keptParams = [...url.searchParams.entries()]
      .filter(([key]) => !TRACKING_PARAMETER.test(key))
      .sort(([a, av], [b, bv]) => a.localeCompare(b) || av.localeCompare(bv));
    const query = !pathname && keptParams.length
      ? '?' + new URLSearchParams(keptParams).toString()
      : '';
    return host + pathname + query;
  } catch {
    return raw.toLowerCase().replace(/^https?:\/\/(?:www\.|m\.)?/, '').replace(/[?#].*$/, '').replace(/\/$/, '');
  }
}

function classifyEvidence(record = {}) {
  const text = String(record.text || '');
  const promotion = /\b(webinar|register now|register here|save your seat|sponsored by|sponsored content|paid promotion|advertisement|paid partnership|book a demo|use code [a-z0-9_-]+|limited time offer)\b/i.test(text);
  if (promotion) {
    return { problem: false, demandIntent: false, product: false, discussion: false, promotion: true, independentDemandSupported: false };
  }

  const problem = /\b(crash(?:es|ed|ing)?|bug report|broken|error(?: message)?|fails? to connect|fails? when|does not work|doesn't work|not working|data loss|workaround|pain point|bottleneck|production issue|looking for a tool|need a tool|we need|seeking a tool|struggling with|cost reduction|token cost|latency problem)\b/i.test(text);
  const demandIntent = /\b(looking for|need a tool|we need|seeking (?:a |an )?(?:tool|solution)|searching for|any recommendations|does anyone know|is there a tool|what can i use|what should we use)\b/i.test(text);
  const product = /\b(we launched|launched a new|new open-source|new tool|new product|new framework|new library|now available|released|release notes|we built|i built|available on github|introducing)\b/i.test(text);
  const discussion = /\b(hot take|unpopular opinion|my opinion|i think|i feel|what do you think|thoughts\?)\b/i.test(text);

  return {
    problem,
    demandIntent,
    product,
    discussion,
    promotion: false,
    independentDemandSupported: false
  };
}

function aggregateEvidence(inputRecords = []) {
  const seenKeys = new Map();
  const records = inputRecords.map((input, index) => {
    const record = { ...input };
    const canonicalUrl = canonicalizeUrl(record.sourceUrl);
    const evidence = classifyEvidence(record);
    const sourceStatus = record.sourceStatus || 'validated';
    const fallbackKey = record.sourceRecordId
      ? String(record.source || 'unknown') + ':' + String(record.sourceRecordId)
      : null;
    const dedupeKey = canonicalUrl ? 'url:' + canonicalUrl : fallbackKey;
    // Failed/partial source entries must never reserve a dedupe key and hide later valid evidence.
    const isValidated = sourceStatus === 'validated';
    const duplicateOf = isValidated && dedupeKey && seenKeys.has(dedupeKey) ? seenKeys.get(dedupeKey) : null;
    if (isValidated && dedupeKey && !seenKeys.has(dedupeKey)) seenKeys.set(dedupeKey, index);
    return {
      ...record,
      canonicalUrl,
      sourceStatus,
      evidence,
      metrics: record.metrics && typeof record.metrics === 'object' ? { ...record.metrics } : {},
      duplicateOf
    };
  });

  const clusters = Object.create(null);
  for (const record of records) {
    if (record.sourceStatus !== 'validated' || record.duplicateOf !== null || record.evidence.promotion) continue;
    const clusterKey = String(record.problemClusterKey || '').trim();
    if (!clusterKey || (!record.evidence.problem && !record.evidence.demandIntent)) continue;
    if (!clusters[clusterKey]) clusters[clusterKey] = { authors: new Set(), sources: new Set(), recordCount: 0 };
    const cluster = clusters[clusterKey];
    cluster.recordCount += 1;
    const authorKey = String(record.authorKey || record.authorOrPublisher || '').trim().toLowerCase();
    if (authorKey) cluster.authors.add(authorKey);
    if (record.source) cluster.sources.add(String(record.source).toLowerCase());
  }

  const summarizedClusters = Object.create(null);
  for (const [key, cluster] of Object.entries(clusters)) {
    const independentAuthorCount = cluster.authors.size;
    const sourceCount = cluster.sources.size;
    summarizedClusters[key] = {
      recordCount: cluster.recordCount,
      independentAuthorCount,
      sourceCount,
      demandSupported: independentAuthorCount >= 2,
      crossSourceCorroborated: independentAuthorCount >= 2 && sourceCount >= 2
    };
  }

  return {
    records,
    uniqueRecordCount: records.filter(record => record.sourceStatus === 'validated' && record.duplicateOf === null).length,
    clusters: summarizedClusters
  };
}

module.exports = { canonicalizeUrl, classifyEvidence, aggregateEvidence };
