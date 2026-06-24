/**
 * Filters out low-credibility domains BEFORE results ever reach the LLM.
 * This is a FIRST-PASS filter only - fast, free, and catches the obvious cases
 * (social media, forums we know about). It is NOT sufficient on its own, since
 * the internet has effectively infinite forum/community/blog domains we can't
 * enumerate. See credibility-check.ts for the second-layer LLM-based judgment
 * that catches what this blocklist misses (e.g. community.latenode.com style
 * forums, LinkedIn "pulse" opinion posts, content farms with legitimate-looking domains).
 */

const BLOCKED_DOMAIN_PATTERNS = [
  "facebook.com",
  "twitter.com",
  "x.com",
  "instagram.com",
  "tiktok.com",
  "reddit.com",
  "quora.com",
  "pinterest.com",
  "linkedin.com/posts",
  "linkedin.com/pulse", // personal opinion essays, not vetted reporting
  "scribd.com",
  "medium.com",
];

export function isLowCredibilitySource(url: string): boolean {
  const lower = url.toLowerCase();
  return BLOCKED_DOMAIN_PATTERNS.some((pattern) => lower.includes(pattern));
}

export function filterCredibleSources<T extends { url: string }>(results: T[]): { kept: T[]; filtered: T[] } {
  const kept: T[] = [];
  const filtered: T[] = [];

  for (const result of results) {
    if (isLowCredibilitySource(result.url)) {
      filtered.push(result);
    } else {
      kept.push(result);
    }
  }

  return { kept, filtered };
}