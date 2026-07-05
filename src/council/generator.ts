import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { withRetry } from "../utils/retry.js";
import type { PersonaConfig } from "../types.js";

const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.9,
});

export async function generateCouncil(topic: string): Promise<PersonaConfig[]> {
  const prompt = `You are assembling an expert council to debate the following topic:
"${topic}"

Generate exactly 3 council members who would provide genuinely distinct, non-overlapping perspectives.
Each should be a real domain expert whose professional background naturally leads them to a specific
angle on this question. Their perspectives should create productive tension with each other.

RULES:
- Use REAL domains (economics, law, ethics, neuroscience, engineering, sociology, etc.) not generic stances
- Do NOT use "optimist", "skeptic", "pragmatist" — those are attitudes, not expertise
- Names should be realistic and diverse
- The perspective field should describe exactly how their domain lens applies to THIS specific topic

Respond with JSON only, no other text:
[
  {
    "id": "short-kebab-id",
    "name": "Full Name",
    "role": "Job Title / Domain",
    "perspective": "One sentence: how their specific expertise shapes their view on this exact topic"
  }
]`;

  const response = await withRetry(() => llm.invoke(prompt), { label: "Council generation" });
  const text = String(response.content).trim();

  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed) || parsed.length < 3) throw new Error("Expected 3 personas");
    return parsed.slice(0, 3) as PersonaConfig[];
  } catch {
    return [
      { id: "critic", name: "The Critic", role: "Critical Analyst", perspective: "Questions assumptions and highlights risks." },
      { id: "advocate", name: "The Advocate", role: "Innovation Advocate", perspective: "Focuses on opportunities and potential benefits." },
      { id: "realist", name: "The Realist", role: "Implementation Specialist", perspective: "Evaluates real-world feasibility and tradeoffs." },
    ];
  }
}
