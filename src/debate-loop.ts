import { skepticTurn } from "./personas/skeptic.js";
import { optimistTurn } from "./personas/optimist.js";
import { pragmatistTurn } from "./personas/pragmatist.js";
import { moderatorShouldContinue } from "./personas/moderator.js";
import type { CouncilState } from "./types.js";

const MIN_ROUNDS = 2;
const MAX_ROUNDS = 6;

export async function runDebate(topic: string): Promise<CouncilState> {
  const state: CouncilState = {
    topic,
    round: 1,
    maxRounds: MAX_ROUNDS,
    transcript: [],
    verdict: "",
  };

  while (state.round <= MAX_ROUNDS) {
    console.log(`\n=== ROUND ${state.round} ===\n`);

    const skeptic = await skepticTurn(state);
    console.log("SKEPTIC:", skeptic.statement, "\n");
    state.transcript.push({ round: state.round, persona: "skeptic", statement: skeptic.statement, grounding: skeptic.grounding });

    const optimist = await optimistTurn(state);
    console.log("OPTIMIST:", optimist.statement, "\n");
    state.transcript.push({ round: state.round, persona: "optimist", statement: optimist.statement, grounding: optimist.grounding });

    const pragmatist = await pragmatistTurn(state);
    console.log("PRAGMATIST:", pragmatist.statement, "\n");
    state.transcript.push({ round: state.round, persona: "pragmatist", statement: pragmatist.statement, grounding: pragmatist.grounding });

    if (state.round >= MIN_ROUNDS) {
      const decision = await moderatorShouldContinue(state);
      const label = decision.continue ? "Continuing" : "Concluding";
      console.log(`\n[Moderator check — ${label}]: ${decision.reason}\n`);
      if (!decision.continue) {
        state.maxRounds = state.round;
        break;
      }
    }

    state.round++;
  }

  return state;
}
