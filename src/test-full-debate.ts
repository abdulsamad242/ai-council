import { runDebate } from "./debate-loop.js";

async function main() {
  const finalState = await runDebate(
    "Should companies require employees to return to the office full-time?"
  );

  console.log(`\n\nDebate complete: ${finalState.transcript.length} total statements across ${finalState.maxRounds} rounds.`);
}

main();