"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PersonaCard } from "./PersonaCard";
import { TranscriptEntry } from "./TranscriptEntry";
import { ModeratorEventItem } from "./ModeratorEvent";
import { VerdictSection } from "./VerdictSection";
import { colorFor } from "./ClientApp";
import type { AppState } from "./ClientApp";

const MAX_W = 720;

export function DebateView({ state, onReset }: { state: AppState; onReset: () => void }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [state.transcript.length, state.moderatorItems.length, state.verdict]);

  const personaColorMap = new Map(state.personas.map((p, i) => [p.id, colorFor(i)]));

  type TLItem =
    | { kind: "round"; round: number; key: string }
    | { kind: "entry"; id: string; key: string }
    | { kind: "mod"; id: string; key: string };

  const timeline: TLItem[] = [];
  let lastRound = 0;
  for (const e of state.transcript) {
    if (e.round !== lastRound) {
      timeline.push({ kind: "round", round: e.round, key: `r${e.round}` });
      lastRound = e.round;
    }
    timeline.push({ kind: "entry", id: e.id, key: e.id });
  }
  for (const m of state.moderatorItems) {
    timeline.push({ kind: "mod", id: m.id, key: m.id });
  }

  return (
    <div style={{ minHeight: "100vh", background: "#07050b", display: "flex", flexDirection: "column" }}>

      {/* ── Header ── */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        height: 56,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 24px",
        background: "rgba(7,5,11,0.92)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <button
          onClick={onReset}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#4a4540",
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            flexShrink: 0,
            transition: "color 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "#c8a45a")}
          onMouseLeave={e => (e.currentTarget.style.color = "#4a4540")}
        >
          ← New Debate
        </button>

        <div style={{
          flex: 1,
          fontSize: 12,
          color: "#8a8275",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {state.topic}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={state.status}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18 }}
            style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
          >
            {!state.done && state.personas.length > 0 && (
              <motion.span
                style={{ width: 6, height: 6, borderRadius: "50%", background: "#c8a45a", display: "inline-block" }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
              />
            )}
            <span style={{
              fontSize: 11,
              fontWeight: 500,
              color: state.done ? "#4d9b84" : "#8a8275",
            }}>
              {state.status || "Assembling council…"}
            </span>
          </motion.div>
        </AnimatePresence>
      </header>

      {/* ── Content ── */}
      <main style={{
        flex: 1,
        width: "100%",
        maxWidth: MAX_W,
        marginLeft: "auto",
        marginRight: "auto",
        padding: "48px 32px 0",
      }}>

        {/* Council cards */}
        <AnimatePresence>
          {state.personas.length > 0 && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ marginBottom: 48 }}
            >
              <div style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "#4a4540",
                marginBottom: 16,
              }}>
                The Council
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: `repeat(${state.personas.length}, 1fr)`,
                gap: 12,
              }}>
                {state.personas.map((p, i) => (
                  <PersonaCard
                    key={p.id}
                    name={p.name}
                    role={p.role}
                    perspective={p.perspective}
                    color={colorFor(i)}
                    isActive={state.active?.personaId === p.id}
                    statusText={state.active?.personaId === p.id ? state.active.status : ""}
                    index={i}
                  />
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Transcript */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <AnimatePresence initial={false}>
            {timeline.map(t => {
              if (t.kind === "round") {
                return (
                  <motion.div
                    key={t.key}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ display: "flex", alignItems: "center", gap: 16 }}
                  >
                    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
                    <span style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.25em",
                      textTransform: "uppercase",
                      color: "#4a4540",
                    }}>
                      Round {t.round}
                    </span>
                    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
                  </motion.div>
                );
              }
              if (t.kind === "entry") {
                const entry = state.transcript.find(e => e.id === t.id)!;
                return (
                  <TranscriptEntry
                    key={t.key}
                    item={entry}
                    color={personaColorMap.get(entry.persona.id) ?? "#c8a45a"}
                  />
                );
              }
              const mod = state.moderatorItems.find(m => m.id === t.id)!;
              return <ModeratorEventItem key={t.key} item={mod} />;
            })}
          </AnimatePresence>
        </div>

        {/* Verdict */}
        <AnimatePresence>
          {state.verdict && <VerdictSection key="verdict" text={state.verdict} />}
        </AnimatePresence>

        {/* Done footer */}
        <AnimatePresence>
          {state.done && (
            <motion.footer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                marginTop: 40,
                marginBottom: 24,
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
              <span style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#4a4540" }}>
                {state.personas.length} experts · {state.totalRounds} round{state.totalRounds === 1 ? "" : "s"}
              </span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
            </motion.footer>
          )}
        </AnimatePresence>

        <div ref={bottomRef} style={{ height: 80 }} />
      </main>
    </div>
  );
}
