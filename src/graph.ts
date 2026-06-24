import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { skepticTurn } from "./personas/skeptic.js";
import { optimistTurn } from "./personas/optimist.js";
import { pragmatistTurn } from "./personas/pragmatist.js";
import { moderatorVerdict, moderatorShouldContinue } from "./personas/moderator.js";
import type { DebateEntry } from "./types.js";

const MIN_ROUNDS = 2;
const MAX_ROUNDS = 6;

const CouncilGraphState = Annotation.Root({
  topic: Annotation<string>(),
  round: Annotation<number>({
    reducer: (_current, update) => update,
    default: () => 1,
  }),
  maxRounds: Annotation<number>({
    reducer: (_current, update) => update,
    default: () => MAX_ROUNDS,
  }),
  transcript: Annotation<DebateEntry[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
  verdict: Annotation<string>({
    reducer: (_current, update) => update,
    default: () => "",
  }),
});

type GraphState = typeof CouncilGraphState.State;

async function skepticNode(state: GraphState) {
  console.log(`\n--- Round ${state.round}: Skeptic ---`);
  const result = await skepticTurn({
    topic: state.topic,
    round: state.round,
    maxRounds: state.maxRounds,
    transcript: state.transcript,
    verdict: "",
  });
  console.log(result.statement);
  return {
    transcript: [{ round: state.round, persona: "skeptic" as const, statement: result.statement, grounding: result.grounding }],
  };
}

async function optimistNode(state: GraphState) {
  console.log(`\n--- Round ${state.round}: Optimist ---`);
  const result = await optimistTurn({
    topic: state.topic,
    round: state.round,
    maxRounds: state.maxRounds,
    transcript: state.transcript,
    verdict: "",
  });
  console.log(result.statement);
  return {
    transcript: [{ round: state.round, persona: "optimist" as const, statement: result.statement, grounding: result.grounding }],
  };
}

async function pragmatistNode(state: GraphState) {
  console.log(`\n--- Round ${state.round}: Pragmatist ---`);
  const result = await pragmatistTurn({
    topic: state.topic,
    round: state.round,
    maxRounds: state.maxRounds,
    transcript: state.transcript,
    verdict: "",
  });
  console.log(result.statement);
  return {
    transcript: [{ round: state.round, persona: "pragmatist" as const, statement: result.statement, grounding: result.grounding }],
    round: state.round + 1,
  };
}

async function moderatorNode(state: GraphState) {
  console.log(`\n--- Moderator Verdict ---`);
  const verdict = await moderatorVerdict({
    topic: state.topic,
    round: state.round,
    maxRounds: state.maxRounds,
    transcript: state.transcript,
    verdict: "",
  });
  console.log(verdict);
  // state.round is already incremented past the last completed round, so subtract 1
  return { verdict, maxRounds: state.round - 1 };
}

// After pragmatistNode, state.round has already been incremented to the NEXT round number.
// So "completed round" = state.round - 1.
async function shouldContinue(state: GraphState): Promise<"skeptic" | "moderator"> {
  const completedRound = state.round - 1;

  if (completedRound < MIN_ROUNDS) return "skeptic";
  if (completedRound >= MAX_ROUNDS) return "moderator";

  const decision = await moderatorShouldContinue({
    topic: state.topic,
    round: completedRound,
    maxRounds: state.maxRounds,
    transcript: state.transcript,
    verdict: "",
  });

  const label = decision.continue ? "Continuing" : "Concluding";
  console.log(`\n[Moderator — ${label} after round ${completedRound}]: ${decision.reason}\n`);

  return decision.continue ? "skeptic" : "moderator";
}

export function buildCouncilGraph() {
  const graph = new StateGraph(CouncilGraphState)
    .addNode("skeptic", skepticNode)
    .addNode("optimist", optimistNode)
    .addNode("pragmatist", pragmatistNode)
    .addNode("moderator", moderatorNode)
    .addEdge(START, "skeptic")
    .addEdge("skeptic", "optimist")
    .addEdge("optimist", "pragmatist")
    .addConditionalEdges("pragmatist", shouldContinue, {
      skeptic: "skeptic",
      moderator: "moderator",
    })
    .addEdge("moderator", END);

  return graph.compile();
}
