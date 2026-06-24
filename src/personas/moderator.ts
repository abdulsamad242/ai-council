import "dotenv/config";
import { ChatGroq } from "@langchain/groq";
import type { CouncilState } from "../types.js";

const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0.2, // lower than personas - moderator should be measured, not opinionated
});

export async function moderatorShouldContinue(state: CouncilState): Promise<{ continue: boolean; reason: string }> {
  const fullTranscript = state.transcript.map(formatEntry).join("\n\n");

  const prompt = `You are the MODERATOR of a debate council discussing:
"${state.topic}"

Full transcript after round ${state.round} (maximum ${state.maxRounds} rounds):

${fullTranscript}

Your task: identify the single most important unresolved point, claim, or tension that a next round of debate could meaningfully advance.

Search the transcript carefully for:
- A specific factual claim that was asserted but never directly challenged or verified
- A rebuttal that landed but was never responded to
- An implication raised by one expert that the others haven't engaged with
- A sub-question opened up this round that nobody has addressed yet
- Two experts who talked past each other on a specific point rather than actually resolving it

If you can identify such a point, output CONTINUE and name it precisely.
If you genuinely cannot — every significant claim has been challenged, every rebuttal answered, and another round would require experts to repeat what they've already said — output CONCLUDE.

Do not conclude out of politeness or because "positions have been stated." Conclude only when you can demonstrate the debate has been exhausted.

Respond with JSON only, no other text:
{"continue": true, "reason": "the specific unresolved point a next round should address"} or {"continue": false, "reason": "specific evidence that the debate is genuinely exhausted"}`;

  const response = await llm.invoke(prompt);
  const text = String(response.content).trim();

  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return { continue: Boolean(parsed.continue), reason: String(parsed.reason ?? "") };
  } catch {
    return { continue: true, reason: "Could not parse moderator decision — continuing by default." };
  }
}

function formatEntry(e: import("../types.js").DebateEntry): string {
  const label = e.personaConfig
    ? `${e.personaConfig.name} (${e.personaConfig.role})`
    : e.persona.toUpperCase();
  return `[Round ${e.round}] ${label}: ${e.statement}`;
}

export async function moderatorVerdict(state: CouncilState): Promise<string> {
  const fullTranscript = state.transcript.map(formatEntry).join("\n\n");

  const prompt = `You are the MODERATOR of a debate council that just discussed this topic:
"${state.topic}"

Full debate transcript across ${state.maxRounds} rounds:

${fullTranscript}

Write a balanced final verdict as markdown with these sections:

## Summary of Positions
Briefly state each persona's core position (Skeptic, Optimist, Pragmatist) in 1 sentence each.

## Where They Agreed
Identify any genuine points of agreement that emerged during the debate, even if they started from different positions.

## Where They Genuinely Conflicted
Identify the real, unresolved disagreements - be specific about WHAT they disagreed on, not just that they disagreed.

## Verdict
Give your own balanced, reasoned conclusion considering all three perspectives. Do not just say "it depends" - take a measured position while acknowledging legitimate concerns from each side. This should be 3-5 sentences of actual substance.

Write the full verdict now.`;

  const response = await llm.invoke(prompt);
  return String(response.content).trim();
}