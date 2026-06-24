"use client";

import { motion } from "framer-motion";
import { initials, domainOf } from "./ClientApp";
import type { TranscriptItem } from "./ClientApp";

export function TranscriptEntry({ item, color }: { item: TranscriptItem; color: string }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      style={{ display: "flex", gap: 0 }}
    >
      {/* Left color bar */}
      <div style={{
        width: 3,
        flexShrink: 0,
        borderRadius: 2,
        marginRight: 20,
        background: color,
        alignSelf: "stretch",
        minHeight: 20,
      }} />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Expert identity */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            flexShrink: 0,
            background: `color-mix(in srgb, ${color} 12%, transparent)`,
            color,
            border: `1px solid ${color}35`,
          }}>
            {initials(item.persona.name)}
          </div>
          <span style={{ fontWeight: 600, fontSize: 13, color: "#ede9e2" }}>
            {item.persona.name}
          </span>
          <span style={{ fontSize: 12, color: "#4a4540" }}>·</span>
          <span style={{ fontSize: 12, color: "#8a8275" }}>
            {item.persona.role}
          </span>
        </div>

        {/* Statement */}
        <p style={{
          fontSize: 14.5,
          lineHeight: 1.85,
          color: "#ded9d2",
          margin: 0,
        }}>
          {item.statement}
        </p>

        {/* Sources */}
        {item.grounding.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
            {item.grounding.map((f, i) => (
              <motion.a
                key={i}
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.08 + i * 0.04 }}
                style={{
                  fontSize: 10,
                  fontFamily: "var(--font-mono), monospace",
                  padding: "3px 8px",
                  borderRadius: 4,
                  color: "#4a4540",
                  background: "#0e0b14",
                  border: "1px solid rgba(255,255,255,0.06)",
                  textDecoration: "none",
                  maxWidth: 160,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "inline-block",
                  transition: "color 0.15s, border-color 0.15s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = "#8a8275";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = "#4a4540";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                }}
              >
                {domainOf(f.url)}
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </motion.article>
  );
}
