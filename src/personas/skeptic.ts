import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import type { CouncilState, Finding } from "../types.js";
import { searchForEvidence } from "../utils/search.js";
import { withRetry } from "../utils/retry.js";

const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.7,
});

const SKEPTIC_PERSONA = `You are THE SKEPTIC in a debate council. Your role is to question claims,
demand evidence, and point out risks, downsides, and unintended consequences that others overlook.
You are not contrarian for its own sake - you raise genuine, well-reasoned concerns backed by evidence.
Keep your statements to 3-4 sentences. Be direct and specific, not vague.`;

async function planSearchQuery(state: CouncilState): Promise<string> {
  const lastStatement = state.transcript[state.transcript.length - 1];

  const context = lastStatement
    ? `The most recent point made was by ${lastStatement.persona.toUpperCase()}: "${lastStatement.statement}"`
    : `This is the opening of the debate.`;

  const prompt = `Debate topic: "${state.topic}"
${context}

You are about to argue AS THE SKEPTIC on this topic. What specific, searchable fact or statistic
would strengthen your skeptical position right now? Write ONE short, specific web search query
(not a question, a search query) that would find real evidence for your point.

Reply with ONLY the search query, nothing else.`;

  const response = await withRetry(() => llm.invoke(prompt), { label: "Skeptic search planning" });
  return String(response.content).trim();
}

/**
 * Verification step: asks the LLM to state ONLY what's literally supported by the
 * evidence, with no embellishment. This is a separate call from the final statement
 * so the "what does the evidence actually say" reasoning isn't tangled up with the
 * "how do I argue persuasively" reasoning - same separation of concerns as the
 * research agent's extract step.
 */
async function verifyEvidence(topic: string, findings: Finding[]): Promise<string> {
  if (findings.length === 0) return "NO_EVIDENCE_FOUND";

  const evidenceBlock = findings
    .map((f, i) => {
      const credTag = f.credibility ? `[${f.credibility.toUpperCase()}${f.credibilityReason ? ": " + f.credibilityReason : ""}]` : "";
      return `[Source ${i + 1}] ${credTag} (${f.url}):\n${f.content}`;
    })
    .join("\n\n");

  const prompt = `Topic context: "${topic}"

Raw search results, each tagged with a credibility assessment:
${evidenceBlock}

List ONLY the specific facts, numbers, or statistics that are LITERALLY stated in these sources.

STRICT RULES:
- Do NOT infer, round, combine, or extrapolate numbers.
- Do NOT attribute a claim to a named person or study unless that exact name appears in the source text.
- Do NOT guess publication dates, DOIs, or any metadata from URL string patterns.
- MANDATORY: every single fact you list MUST end with its credibility tag in brackets, copied
  exactly from the source tag above - either [RELIABLE] or [LOW-CONFIDENCE]. Do not omit this
  tag on any line, even if you already mentioned the source's credibility elsewhere.
- If a number seems suspiciously round or extreme, note that it should be treated with caution
  regardless of its credibility tag.
- If a source contains no concrete fact relevant to the topic, say so.

Format EXACTLY like this for every fact, no exceptions:
"- [fact] (Source N) [RELIABLE]" or "- [fact] (Source N) [LOW-CONFIDENCE]"

Do not explain your reasoning. Output only the fact lines, nothing else.`;

  const response = await withRetry(() => llm.invoke(prompt), { label: "Evidence verification" });
  return String(response.content).trim();
}

export async function skepticTurn(
  state: CouncilState
): Promise<{ statement: string; grounding: Finding[] }> {
  const searchQuery = await planSearchQuery(state);
  console.log(`  [Skeptic searching: "${searchQuery}"]`);
  const findings = await searchForEvidence(searchQuery);

  const verifiedFacts = await verifyEvidence(state.topic, findings);
  console.log(`  [Skeptic verified facts]:\n${verifiedFacts}\n`);

  const transcriptSoFar = state.transcript.length === 0
    ? "No statements yet - you are speaking first."
    : state.transcript
        .map((e) => `[Round ${e.round}] ${e.persona.toUpperCase()}: ${e.statement}`)
        .join("\n\n");

  const lastStatement = state.transcript[state.transcript.length - 1];
  const instruction = lastStatement
    ? `The most recent statement was from the ${lastStatement.persona.toUpperCase()}. Directly engage with and respond to their specific point.`
    : `You are opening the debate. State your initial position.`;

  const prompt = `${SKEPTIC_PERSONA}

Debate topic: "${state.topic}"

Full debate transcript so far:
${transcriptSoFar}

${instruction}

VERIFIED facts you are allowed to cite (these are the ONLY facts/numbers you may state -
do not use any number, statistic, or named study that is not listed here):
${verifiedFacts}

STRICT RULE: If verifiedFacts says "NO_EVIDENCE_FOUND" or contains nothing useful, argue from
reasoning and general knowledge only. For EVERY fact tagged [LOW-CONFIDENCE] that you choose to
reference, you MUST wrap it in hedging language in your statement - for example "one unverified
source claims..." or "though this isn't well-established...". Never state a [LOW-CONFIDENCE]
fact as plain settled fact, even briefly. Facts tagged [RELIABLE] can be stated normally. It is
better to omit a low-confidence number entirely than to state it without hedging.

Respond with ONLY your statement, no preamble.`;

  const response = await withRetry(() => llm.invoke(prompt), { label: "Skeptic statement" });
  return {
    statement: String(response.content).trim(),
    grounding: findings,
  };
}