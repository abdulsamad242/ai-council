import { skepticTurn } from "./personas/skeptic";
import type { CouncilState } from "./types";

async function main() {
  const topic = "Should companies require employees to return to the office full-time?";

  console.log("=== TEST 1: Skeptic speaking first (empty transcript) ===");
  const state1: CouncilState = {
    topic,
    round: 1,
    maxRounds: 3,
    transcript: [],
    verdict: "",
  };
  const statement1 = await skepticTurn(state1);
  console.log(statement1);

  console.log("\n\n=== TEST 2: Skeptic responding to an injected prior statement ===");
  const state2: CouncilState = {
    topic,
    round: 1,
    maxRounds: 3,
    transcript: [
      {
        round: 1,
        persona: "optimist",
        statement: "Full-time office return will dramatically improve collaboration, mentorship for junior employees, and company culture, which have all suffered under remote work.",
        grounding: [],
      },
    ],
    verdict: "",
  };
  const statement2 = await skepticTurn(state2);
  console.log(statement2);

  console.log("\n\nCHECK: Does statement 2 actually reference or push back on the optimist's specific claims (collaboration, mentorship, culture)? Or is it a generic skeptic statement that could've been said regardless of what the optimist said?");
}

main();