import { skepticTurn } from "./personas/skeptic";
import { optimistTurn } from "./personas/optimist";
import { pragmatistTurn } from "./personas/pragmatist";
import type { CouncilState, DebateEntry } from "./types";

async function main() {
  const state: CouncilState = {
    topic: "Should companies require employees to return to the office full-time?",
    round: 1,
    maxRounds: 3,
    transcript: [],
    verdict: "",
  };

  console.log("=== ROUND 1 ===\n");

  const skeptic = await skepticTurn(state);
  console.log("SKEPTIC:", skeptic.statement, "\n");
  state.transcript.push({ round: 1, persona: "skeptic", statement: skeptic.statement, grounding: skeptic.grounding });

  const optimist = await optimistTurn(state);
  console.log("OPTIMIST:", optimist.statement, "\n");
  state.transcript.push({ round: 1, persona: "optimist", statement: optimist.statement, grounding: optimist.grounding });

  const pragmatist = await pragmatistTurn(state);
  console.log("PRAGMATIST:", pragmatist.statement, "\n");
  state.transcript.push({ round: 1, persona: "pragmatist", statement: pragmatist.statement, grounding: pragmatist.grounding });

  console.log("\nCHECK: Does the Optimist respond to the Skeptic's specific point? Does the Pragmatist respond to either/both?");
}

main();