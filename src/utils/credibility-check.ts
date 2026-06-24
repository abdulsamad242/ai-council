import "dotenv/config";
import { ChatGroq } from "@langchain/groq";
import { withRetry } from "./retry.js";
import type { Finding } from "../types.js";

const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0,
});

export interface ClassifiedFinding extends Finding {
  credibility: "reliable" | "low-confidence";
  reason: string;
}

/**
 * Judges source TYPE from content/URL structure rather than a fixed domain list.
 * This catches forum/community sites, content farms, and opinion blogs that look
 * legitimate but aren't vetted reporting or research - the exact gap a blocklist
 * can never fully close.
 */
export async function classifySourceCredibility(findings: Finding[]): Promise<ClassifiedFinding[]> {
  if (findings.length === 0) return [];

  const classified: ClassifiedFinding[] = [];

  for (const finding of findings) {
    const prompt = `Assess this source's credibility for citing factual claims:

URL: ${finding.url}
Content excerpt: ${finding.content}

Classify as "reliable" or "low-confidence" based on these signals:
- RELIABLE: established news outlets, peer-reviewed journals, government/institutional reports,
  official company/organization publications, recognized research institutions
- LOW-CONFIDENCE: forums, community discussion boards, personal blogs, opinion pieces,
  unverified social posts, content-farm style SEO articles, or any source where the claim
  reads as personal opinion/anecdote rather than reported fact or data

IMPORTANT: Do not guess publication dates or other metadata from URL string patterns
(e.g. numbers in a URL slug are NOT reliable indicators of a publication year or DOI).
Judge based on the actual content and known domain type only.

Reply in exactly this format:
CLASSIFICATION: reliable or low-confidence
REASON: one short sentence`;

    try {
      const response = await withRetry(() => llm.invoke(prompt), { label: "Source credibility check" });
      const text = String(response.content).trim();

      const classMatch = text.match(/CLASSIFICATION:\s*(reliable|low-confidence)/i);
      const reasonMatch = text.match(/REASON:\s*(.+)/i);

      classified.push({
        ...finding,
        credibility: classMatch?.[1]?.toLowerCase() === "reliable" ? "reliable" : "low-confidence",
        reason: reasonMatch?.[1]?.trim() ?? "no reason given",
      });
    } catch (err) {
      // If classification fails, default to low-confidence rather than reliable -
      // safer to under-trust a good source than over-trust a bad one
      classified.push({ ...finding, credibility: "low-confidence", reason: "classification failed, defaulted to cautious" });
    }
  }

  return classified;
}