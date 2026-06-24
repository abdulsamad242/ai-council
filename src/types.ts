export interface PersonaConfig {
  id: string;
  name: string;
  role: string;
  perspective: string;
}

export interface Finding {
  content: string;
  url: string;
  credibility?: "reliable" | "low-confidence";
  credibilityReason?: string;
}

export interface DebateEntry {
  round: number;
  persona: string;
  personaConfig?: PersonaConfig;
  statement: string;
  grounding: Finding[];
}

export interface CouncilState {
  topic: string;
  round: number;
  maxRounds: number;
  personas?: PersonaConfig[];
  transcript: DebateEntry[];
  verdict: string;
}

export type DebateEvent =
  | { type: "council_assembled"; personas: PersonaConfig[] }
  | { type: "round_start"; round: number }
  | { type: "persona_searching"; persona: PersonaConfig; query: string }
  | { type: "persona_facts"; persona: PersonaConfig; facts: string }
  | { type: "persona_statement"; persona: PersonaConfig; statement: string; grounding: Finding[] }
  | { type: "moderator_evaluating" }
  | { type: "moderator_decision"; continue: boolean; reason: string }
  | { type: "verdict"; text: string }
  | { type: "done"; rounds: number }
  | { type: "error"; message: string };
