"use client";

import { useState, useRef, useEffect } from "react";
import { motion, type Variants } from "framer-motion";

const EXAMPLES = [
  { short: "Nuclear energy", full: "Should nuclear energy be central to the global clean energy transition?" },
  { short: "Longevity research", full: "Is dramatically extending human lifespan a net good for humanity?" },
  { short: "Encryption ban", full: "Should governments ban end-to-end encryption to combat serious crime?" },
  { short: "Degrowth", full: "Is degrowth the only viable response to climate change?" },
  { short: "Gene editing", full: "Should gene editing of human embryos be permitted for disease prevention?" },
];

const stagger: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } },
};

export function Hero({ onStart }: { onStart: (topic: string) => void }) {
  const [topic, setTopic] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  const submit = () => { if (topic.trim()) onStart(topic.trim()); };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "5rem 1.5rem",
      background: "#07050b",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(200,164,90,0.08) 0%, transparent 70%)",
      }} />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative" }}
      >

        {/* Eyebrow */}
        <motion.div variants={fadeUp} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div style={{ height: 1, width: 32, background: "#c8a45a" }} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#c8a45a" }}>
            An Evidence-Grounded Debate
          </span>
          <div style={{ height: 1, width: 32, background: "#c8a45a" }} />
        </motion.div>

        {/* Title */}
        <motion.h1 variants={fadeUp} style={{
          fontSize: "clamp(2.4rem, 6vw, 3.6rem)",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1,
          color: "#ede9e2",
          marginBottom: 20,
        }}>
          The Council
        </motion.h1>

        {/* Tagline */}
        <motion.p variants={fadeUp} style={{
          fontSize: 15,
          color: "#8a8275",
          lineHeight: 1.75,
          maxWidth: 420,
          marginBottom: 40,
        }}>
          A panel of domain experts assembles per question —
          with real evidence, verified sources, and a moderator
          that decides when enough has been said.
        </motion.p>

        {/* Input card */}
        <motion.div variants={fadeUp} style={{ width: "100%", marginBottom: 20 }}>
          <div style={{
            background: "#0e0b14",
            border: "1px solid rgba(200,164,90,0.25)",
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 0 0 1px rgba(200,164,90,0.06), 0 20px 60px rgba(0,0,0,0.5)",
          }}>
            <textarea
              ref={ref}
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
              placeholder="Enter a question or topic for the council to debate…"
              rows={3}
              style={{
                width: "100%",
                padding: "18px 20px 12px",
                background: "transparent",
                border: "none",
                outline: "none",
                resize: "none",
                fontSize: 14,
                lineHeight: 1.7,
                color: "#ede9e2",
                fontFamily: "var(--font-inter), system-ui, sans-serif",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px 14px" }}>
              <span style={{ fontSize: 11, color: "#4a4540", fontFamily: "var(--font-mono), monospace" }}>
                ↵ to submit
              </span>
              <motion.button
                onClick={submit}
                disabled={!topic.trim()}
                whileHover={topic.trim() ? { scale: 1.03 } : {}}
                whileTap={topic.trim() ? { scale: 0.97 } : {}}
                style={{
                  padding: "8px 18px",
                  background: topic.trim() ? "#c8a45a" : "#2a2520",
                  color: topic.trim() ? "#07050b" : "#4a4540",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "var(--font-inter), system-ui, sans-serif",
                  cursor: topic.trim() ? "pointer" : "not-allowed",
                  transition: "background 0.2s, color 0.2s",
                  letterSpacing: "0.02em",
                }}
              >
                Convene Council →
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Examples */}
        <motion.div variants={fadeUp} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#4a4540" }}>
            Try
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 16px" }}>
            {EXAMPLES.map(ex => (
              <button
                key={ex.short}
                onClick={() => setTopic(ex.full)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  color: "#4a4540",
                  fontFamily: "var(--font-inter), system-ui, sans-serif",
                  transition: "color 0.15s",
                  padding: "2px 0",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "#c8a45a")}
                onMouseLeave={e => (e.currentTarget.style.color = "#4a4540")}
              >
                {ex.short}
              </button>
            ))}
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
