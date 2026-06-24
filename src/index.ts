import "dotenv/config";
import { runDebate } from "./debate-runner.js";
import { writeFileSync } from "fs";
import type { DebateEvent, Finding } from "./types.js";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50);
}

async function main() {
  const topic = process.argv.slice(2).join(" ");

  if (!topic) {
    console.error('Usage: npm run debate -- "your topic here"');
    process.exit(1);
  }

  console.log(`Starting council debate on: "${topic}"\n`);

  const state = await runDebate(topic, (event: DebateEvent) => {
    switch (event.type) {
      case "council_assembled":
        console.log("Council assembled:");
        event.personas.forEach((p) => console.log(`  · ${p.name} — ${p.role}`));
        console.log();
        break;
      case "round_start":
        console.log(`\n=== ROUND ${event.round} ===\n`);
        break;
      case "persona_searching":
        console.log(`\n--- ${event.persona.name} (${event.persona.role}) ---`);
        console.log(`  [searching: "${event.query}"]`);
        break;
      case "persona_facts":
        console.log(`  [verified facts]:\n${event.facts}\n`);
        break;
      case "persona_statement":
        console.log(event.statement);
        break;
      case "moderator_evaluating":
        break;
      case "moderator_decision":
        console.log(`\n[Moderator — ${event.continue ? "Continuing" : "Concluding"} after round]: ${event.reason}\n`);
        break;
      case "verdict":
        console.log("\n--- Moderator Verdict ---");
        console.log(event.text);
        break;
    }
  });

  const transcriptMd = state.transcript
    .map((e) => {
      const label = e.personaConfig ? `${e.personaConfig.name}, ${e.personaConfig.role}` : e.persona;
      const sources = e.grounding.length > 0
        ? "\n\n*Sources: " + e.grounding.map((f: Finding) => f.url).join(", ") + "*"
        : "";
      return `**${label}** (Round ${e.round}):\n${e.statement}${sources}`;
    })
    .join("\n\n---\n\n");

  const fullDoc = `# Debate: ${topic}\n\n## Transcript\n\n${transcriptMd}\n\n## Moderator Verdict\n\n${state.verdict}\n`;
  const filename = `debate-${slugify(topic)}.md`;
  writeFileSync(filename, fullDoc);

  console.log(`\n✅ Done. ${state.transcript.length} total statements across ${state.maxRounds} rounds.`);
  console.log(`Saved to: ${filename}`);
}

main();
