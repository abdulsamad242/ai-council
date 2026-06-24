"use client";

import { motion, AnimatePresence } from "framer-motion";
import { initials } from "./ClientApp";

type Props = {
  name: string;
  role: string;
  perspective: string;
  color: string;
  isActive: boolean;
  statusText: string;
  index: number;
};

export function PersonaCard({ name, role, perspective, color, isActive, statusText, index }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 24, delay: index * 0.1 }}
      style={{
        position: "relative",
        borderRadius: 12,
        padding: "18px 16px 16px",
        background: isActive ? `color-mix(in srgb, ${color} 7%, #0e0b14)` : "#0e0b14",
        border: `1px solid ${isActive ? color + "50" : "rgba(255,255,255,0.08)"}`,
        transition: "background 0.4s, border-color 0.4s",
        overflow: "hidden",
      }}
    >
      {/* Top accent */}
      <motion.div
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color, transformOrigin: "left" }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: index * 0.1 + 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Avatar + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <motion.div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            flexShrink: 0,
            background: `color-mix(in srgb, ${color} 14%, transparent)`,
            color,
            border: `1.5px solid ${isActive ? color : color + "45"}`,
            transition: "border-color 0.3s",
          }}
          animate={isActive ? { scale: [1, 1.06, 1] } : { scale: 1 }}
          transition={{ repeat: isActive ? Infinity : 0, duration: 2, ease: "easeInOut" }}
        >
          {initials(name)}
        </motion.div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.2, color: "#ede9e2", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {name}
          </div>
          <div style={{ fontSize: 11, fontWeight: 500, marginTop: 2, color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {role}
          </div>
        </div>
      </div>

      {/* Perspective */}
      <p style={{ fontSize: 11.5, lineHeight: 1.65, color: "#8a8275", margin: 0 }}>
        {perspective.length > 110 ? perspective.slice(0, 110) + "…" : perspective}
      </p>

      {/* Live status */}
      <AnimatePresence>
        {isActive && statusText && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 10 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              fontFamily: "var(--font-mono), monospace",
              color,
              paddingTop: 10,
              borderTop: `1px solid ${color}25`,
            }}>
              <motion.span
                style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{statusText}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
