import "dotenv/config";
import { ChatGroq } from "@langchain/groq";
import { searchForEvidence } from "../utils/search.js";
import { withRetry } from "../utils/retry.js";
import type { CouncilState, Finding, PersonaConfig, DebateEvent } from "../types.js";

const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0.7,
});

function prevRoundByOthers(state: CouncilState, persona: PersonaConfig): string[] {
  return state.transcript
    .filter(e => e.round === state.round - 1 && e.persona !== persona.id)
    .map(e => {
      const label = e.personaConfig
        ? `${e.personaConfig.name} (${e.personaConfig.role})`
        : e.persona;
      return `${label}: "${e.statement}"`;
    });
}

async function planSearchQuery(state: CouncilState, persona: PersonaConfig): Promise<string> {
  const othersLastRound = prevRoundByOthers(state, persona);

  if (othersLastRound.length === 0) {
    const prompt = `Debate topic: "${state.topic}"
You are: ${persona.name}, ${persona.role}
Your lens: ${persona.perspective}

Opening round. What specific, searchable fact or statistic would establish your core position?
Write ONE short web search query (not a question). Reply with ONLY the query, nothing else.`;
    const response = await withRetry(() => llm.invoke(prompt), { label: `${persona.role} search planning` });
    return String(response.content).trim();
  }

  const claimsBlock = othersLastRound.join("\n\n");
  const prompt = `Debate topic: "${state.topic}"
You are: ${persona.name}, ${persona.role}
Your lens: ${persona.perspective}

Other experts said last round:
${claimsBlock}

Pick the single most important specific claim above that you can challenge or complicate with evidence.
Write ONE short web search query to find counter-evidence or context that undermines that specific claim.
Reply with ONLY the search query, nothing else.`;

  const response = await withRetry(() => llm.invoke(prompt), { label: `${persona.role} search planning` });
  return String(response.content).trim();
}

/**
 * Separate extraction call so "what does evidence say" reasoning doesn't
 * contaminate "how do I argue persuasively" reasoning.
 */
async function verifyEvidence(topic: string, findings: Finding[]): Promise<string> {
  if (findings.length === 0) return "NO_EVIDENCE_FOUND";

  const evidenceBlock = findings
    .map((f, i) => {
      const credTag = f.credibility
        ? `[${f.credibility.toUpperCase()}${f.credibilityReason ? ": " + f.credibilityReason : ""}]`
        : "";
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

export async function personaTurn(
  state: CouncilState,
  persona: PersonaConfig,
  onEvent?: (event: DebateEvent) => void
): Promise<{ statement: string; grounding: Finding[] }> {
  const searchQuery = await planSearchQuery(state, persona);
  onEvent?.({ type: "persona_searching", persona, query: searchQuery });

  const findings = await searchForEvidence(searchQuery);
  const verifiedFacts = await verifyEvidence(state.topic, findings);
  onEvent?.({ type: "persona_facts", persona, facts: verifiedFacts });

  const fullTranscript = state.transcript.length === 0
    ? "No statements yet — you are speaking first."
    : state.transcript
        .map(e => {
          const label = e.personaConfig
            ? `${e.personaConfig.name} (${e.personaConfig.role})`
            : e.persona.toUpperCase();
          return `[Round ${e.round}] ${label}: ${e.statement}`;
        })
        .join("\n\n");

  const othersLastRound = prevRoundByOthers(state, persona);

  const instruction = othersLastRound.length === 0
    ? `You are opening the debate. State your initial position clearly and specifically.`
    : `What the other experts said last round:
${othersLastRound.join("\n\n")}

REQUIRED STRUCTURE:
1. Open by directly naming and challenging the most important specific claim above — quote or paraphrase it, then use your verified evidence to refute or complicate it. Do not open with your general position.
2. After engaging their claim, you may add one genuinely new point of your own if you have something substantive. Do not repeat what you said in previous rounds.`;

  const prompt = `You are ${persona.name}, ${persona.role}.
Your analytical lens: ${persona.perspective}
Keep your statement to 3-4 sentences. Be direct and specific.
Speak in first person. Do not label yourself with a generic archetype like "As the skeptic...".

Debate topic: "${state.topic}"

Full transcript so far:
${fullTranscript}

${instruction}

VERIFIED facts you are allowed to cite (the ONLY facts/numbers you may use):
${verifiedFacts}

STRICT RULE: If verifiedFacts says "NO_EVIDENCE_FOUND" or contains nothing useful, argue from
reasoning and general knowledge only. For EVERY fact tagged [LOW-CONFIDENCE] that you choose to
reference, you MUST wrap it in hedging language (e.g. "one unverified source claims..." or
"though this isn't well-established..."). Never state a [LOW-CONFIDENCE] fact as settled fact.
Facts tagged [RELIABLE] can be stated normally. It is better to omit a low-confidence number
entirely than to state it without hedging.

Respond with ONLY your statement, no preamble.`;

  const response = await withRetry(() => llm.invoke(prompt), { label: `${persona.role} statement` });
  const statement = String(response.content).trim();

  onEvent?.({ type: "persona_statement", persona, statement, grounding: findings });
  return { statement, grounding: findings };
}
