"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

export function VerdictSection({ text }: { text: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 180, damping: 24 }}
      className="mt-12 mb-4"
    >
      {/* Header */}
      <div className="flex items-center gap-5 mb-6">
        <div className="flex-1 h-px" style={{ background: "var(--border-gold)" }} />
        <div className="flex items-center gap-2.5">
          <span style={{ color: "var(--gold)", fontSize: "1rem" }}>⚖</span>
          <span
            className="text-[10px] font-bold tracking-[0.2em] uppercase"
            style={{ color: "var(--gold)" }}
          >
            Moderator&apos;s Verdict
          </span>
        </div>
        <div className="flex-1 h-px" style={{ background: "var(--border-gold)" }} />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 24 }}
        className="rounded-xl p-7"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-gold)",
          boxShadow: "0 0 80px var(--gold-glow)",
        }}
      >
        <div className="verdict-md">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      </motion.div>
    </motion.section>
  );
}
