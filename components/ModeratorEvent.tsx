"use client";

import { motion } from "framer-motion";
import type { ModeratorItem } from "./ClientApp";

export function ModeratorEventItem({ item }: { item: ModeratorItem }) {
  if (item.type === "evaluating") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-4 py-1"
      >
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest" style={{ color: "var(--faint)" }}>
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            style={{ display: "inline-block" }}
          >
            ⚖
          </motion.span>
          <span>Moderator Evaluating</span>
        </div>
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      </motion.div>
    );
  }

  const isContinue = item.shouldContinue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 28 }}
      className="flex flex-col items-center gap-2 py-2"
    >
      <div className="flex items-center gap-4 w-full">
        <div className="flex-1 h-px" style={{ background: isContinue ? "rgba(77,155,132,0.2)" : "rgba(200,164,90,0.2)" }} />
        <div
          className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold"
          style={{ color: isContinue ? "var(--c2)" : "var(--gold)" }}
        >
          <span>{isContinue ? "↩ Continuing" : "✓ Concluded"}</span>
        </div>
        <div className="flex-1 h-px" style={{ background: isContinue ? "rgba(77,155,132,0.2)" : "rgba(200,164,90,0.2)" }} />
      </div>

      <p
        className="text-[11px] text-center max-w-[540px] leading-relaxed"
        style={{ color: "var(--faint)" }}
      >
        {item.reason}
      </p>
    </motion.div>
  );
}
