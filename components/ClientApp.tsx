"use client";

import { useReducer, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Hero } from "./Hero";
import { DebateView } from "./DebateView";
import type { PersonaConfig, Finding } from "@/src/types";

export type TranscriptItem = {
  id: string;
  round: number;
  persona: PersonaConfig;
  statement: string;
  grounding: Finding[];
};

export type ModeratorItem = {
  id: string;
  type: "evaluating" | "decision";
  shouldContinue?: boolean;
  reason?: string;
};

export type ActiveState = {
  personaId: string;
  status: string;
} | null;

export type AppState = {
  view: "hero" | "debate";
  topic: string;
  personas: PersonaConfig[];
  transcript: TranscriptItem[];
  moderatorItems: ModeratorItem[];
  verdict: string | null;
  active: ActiveState;
  status: string;
  done: boolean;
  totalRounds: number;
};

type Action =
  | { type: "START"; topic: string }
  | { type: "COUNCIL_ASSEMBLED"; personas: PersonaConfig[] }
  | { type: "ROUND_START"; round: number }
  | { type: "PERSONA_SEARCHING"; persona: PersonaConfig; query: string }
  | { type: "PERSONA_FACTS"; persona: PersonaConfig }
  | { type: "PERSONA_STATEMENT"; persona: PersonaConfig; statement: string; grounding: Finding[] }
  | { type: "MODERATOR_EVALUATING" }
  | { type: "MODERATOR_DECISION"; shouldContinue: boolean; reason: string }
  | { type: "VERDICT"; text: string }
  | { type: "DONE"; rounds: number }
  | { type: "ERROR"; message: string }
  | { type: "RESET" };

const COLORS = ["var(--c0)", "var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)"];

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "START":
      return { ...initial, view: "debate", topic: action.topic, status: "Assembling council…" };
    case "COUNCIL_ASSEMBLED":
      return { ...state, personas: action.personas, status: "Council assembled" };
    case "ROUND_START":
      return { ...state, status: `Round ${action.round}` };
    case "PERSONA_SEARCHING":
      return { ...state, active: { personaId: action.persona.id, status: `Searching: "${action.query}"` } };
    case "PERSONA_FACTS":
      return { ...state, active: state.active ? { ...state.active, status: "Composing statement…" } : null };
    case "PERSONA_STATEMENT":
      return {
        ...state,
        active: null,
        transcript: [...state.transcript, {
          id: `${action.persona.id}-${state.transcript.length}`,
          round: parseInt(state.status.replace("Round ", "")) || 1,
          persona: action.persona,
          statement: action.statement,
          grounding: action.grounding,
        }],
      };
    case "MODERATOR_EVALUATING":
      return {
        ...state,
        active: null,
        status: "Moderator evaluating…",
        moderatorItems: [...state.moderatorItems, { id: `eval-${state.moderatorItems.length}`, type: "evaluating" }],
      };
    case "MODERATOR_DECISION":
      return {
        ...state,
        status: action.shouldContinue ? "Debating…" : "Concluding…",
        moderatorItems: [
          ...state.moderatorItems.filter(m => m.type !== "evaluating"),
          { id: `decision-${state.moderatorItems.length}`, type: "decision", shouldContinue: action.shouldContinue, reason: action.reason },
        ],
      };
    case "VERDICT":
      return { ...state, verdict: action.text, status: "Verdict ready" };
    case "DONE":
      return { ...state, done: true, totalRounds: action.rounds };
    case "ERROR":
      return { ...state, status: `Error: ${action.message}` };
    case "RESET":
      return { ...initial };
    default:
      return state;
  }
}

const initial: AppState = {
  view: "hero",
  topic: "",
  personas: [],
  transcript: [],
  moderatorItems: [],
  verdict: null,
  active: null,
  status: "",
  done: false,
  totalRounds: 0,
};

export function colorFor(index: number) {
  return COLORS[index % COLORS.length];
}

export function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export function domainOf(url: string) {
  try { return new URL(url).hostname.replace("www.", ""); }
  catch { return url; }
}

export function ClientApp() {
  const [state, dispatch] = useReducer(reducer, initial);

  const startDebate = useCallback((topic: string) => {
    dispatch({ type: "START", topic });

    const es = new EventSource(`/api/debate?topic=${encodeURIComponent(topic)}`);

    es.onmessage = (e) => {
      const event = JSON.parse(e.data);
      switch (event.type) {
        case "council_assembled":   dispatch({ type: "COUNCIL_ASSEMBLED", personas: event.personas }); break;
        case "round_start":         dispatch({ type: "ROUND_START", round: event.round }); break;
        case "persona_searching":   dispatch({ type: "PERSONA_SEARCHING", persona: event.persona, query: event.query }); break;
        case "persona_facts":       dispatch({ type: "PERSONA_FACTS", persona: event.persona }); break;
        case "persona_statement":   dispatch({ type: "PERSONA_STATEMENT", persona: event.persona, statement: event.statement, grounding: event.grounding }); break;
        case "moderator_evaluating":dispatch({ type: "MODERATOR_EVALUATING" }); break;
        case "moderator_decision":  dispatch({ type: "MODERATOR_DECISION", shouldContinue: event.continue, reason: event.reason }); break;
        case "verdict":             dispatch({ type: "VERDICT", text: event.text }); break;
        case "done":                dispatch({ type: "DONE", rounds: event.rounds }); es.close(); break;
        case "error":               dispatch({ type: "ERROR", message: event.message }); es.close(); break;
      }
    };

    es.onerror = () => {
      dispatch({ type: "ERROR", message: "Connection lost." });
      es.close();
    };
  }, []);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return (
    <AnimatePresence mode="wait">
      {state.view === "hero" ? (
        <motion.div key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
          <Hero onStart={startDebate} />
        </motion.div>
      ) : (
        <motion.div key="debate" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <DebateView state={state} onReset={reset} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
