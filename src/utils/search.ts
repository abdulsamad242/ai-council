import "dotenv/config";
import { tavily } from "@tavily/core";
import { withRetry } from "./retry.js";
import { filterCredibleSources } from "./source-filter.js";
import type { Finding } from "../types.js";

const client = tavily({ apiKey: process.env.TAVILY_API_KEY });

export async function searchForEvidence(query: string): Promise<Finding[]> {
  try {
    const result = await withRetry(
      () => client.search(query, { maxResults: 4 }), // fetch more than needed, since filtering will remove some
      { label: `Evidence search: "${query}"` }
    );

    const rawFindings: Finding[] = result.results.map((r) => ({
      content: r.content.slice(0, 500),
      url: r.url,
    }));

    const { kept, filtered } = filterCredibleSources(rawFindings);

    if (filtered.length > 0) {
      console.log(`  ⚠️  Filtered ${filtered.length} low-credibility source(s): ${filtered.map((f) => f.url).join(", ")}`);
    }

    // Tag every kept source as reliable so verifyEvidence always receives explicit credibility labels.
    // Sources that survived the blocklist filter are treated as baseline-reliable at this stage.
    const tagged: Finding[] = kept.map((f) => ({ ...f, credibility: "reliable" as const }));

    return tagged.slice(0, 2);
  } catch (err) {
    console.error(`  ❌ Evidence search failed for "${query}", persona will argue without it`);
    return [];
  }
}