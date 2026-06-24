import { runDebate } from "./debate-loop.js";
import { moderatorVerdict } from "./personas/moderator.js";
import { writeFileSync } from "fs";

async function main() {
  const topic = "Should companies require employees to return to the office full-time?";

  const finalState = await runDebate(topic);

  console.log("\n=== MODERATOR VERDICT ===\n");
  const verdict = await moderatorVerdict(finalState);
  console.log(verdict);

  finalState.verdict = verdict;

  // Save full transcript + verdict as markdown
  const transcriptMd = finalState.transcript
    .map((e) => `**${e.persona.toUpperCase()}** (Round ${e.round}):\n${e.statement}`)
    .join("\n\n---\n\n");

  const fullDoc = `# Debate: ${topic}\n\n## Transcript\n\n${transcriptMd}\n\n## Moderator Verdict\n\n${verdict}\n`;

  writeFileSync("sample-debate.md", fullDoc);
  console.log("\n\nSaved to sample-debate.md");
}

main();