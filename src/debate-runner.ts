import { generateCouncil } from "./council/generator.js";
import { personaTurn } from "./council/persona-turn.js";
import { moderatorVerdict, moderatorShouldContinue } from "./personas/moderator.js";
import type { CouncilState, DebateEvent } from "./types.js";

const MIN_ROUNDS = 2;
const MAX_ROUNDS = 6;

export async function runDebate(
  topic: string,
  onEvent?: (event: DebateEvent) => void
): Promise<CouncilState> {
  const personas = await generateCouncil(topic);
  onEvent?.({ type: "council_assembled", personas });

  const state: CouncilState = {
    topic,
    round: 1,
    maxRounds: MAX_ROUNDS,
    personas,
    transcript: [],
    verdict: "",
  };

  while (state.round <= MAX_ROUNDS) {
    onEvent?.({ type: "round_start", round: state.round });

    for (const persona of personas) {
      const result = await personaTurn(state, persona, onEvent);
      state.transcript.push({
        round: state.round,
        persona: persona.id,
        personaConfig: persona,
        statement: result.statement,
        grounding: result.grounding,
      });
    }

    if (state.round >= MIN_ROUNDS) {
      onEvent?.({ type: "moderator_evaluating" });
      const decision = await moderatorShouldContinue(state);
      onEvent?.({ type: "moderator_decision", continue: decision.continue, reason: decision.reason });
      if (!decision.continue) {
        state.maxRounds = state.round;
        break;
      }
    }

    state.round++;
  }

  const verdictText = await moderatorVerdict(state);
  state.verdict = verdictText;
  onEvent?.({ type: "verdict", text: verdictText });
  onEvent?.({ type: "done", rounds: state.maxRounds });

  return state;
}
