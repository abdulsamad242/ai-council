// Persona color palette (cycles if > 6 experts)
const COLORS = ["var(--c0)", "var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)"];

// Map personaId → { config, colorIndex }
let personaMap = {};

function colorFor(personaId) {
  return personaMap[personaId]?.color ?? "var(--accent)";
}

function initials(name) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function domainOf(url) {
  try { return new URL(url).hostname.replace("www.", ""); }
  catch { return url; }
}

// ── UI helpers ────────────────────────────────────

function setStatus(text, cls = "") {
  const chip = document.getElementById("status-chip");
  chip.textContent = text;
  chip.className = "status-chip" + (cls ? " " + cls : "");
}

function scrollToBottom() {
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

// ── Event handlers ────────────────────────────────

function onCouncilAssembled(personas) {
  personaMap = {};
  personas.forEach((p, i) => {
    personaMap[p.id] = { config: p, color: COLORS[i % COLORS.length] };
  });

  const section = document.getElementById("council-section");
  const cards = document.getElementById("persona-cards");
  cards.innerHTML = "";

  personas.forEach((p, i) => {
    const color = COLORS[i % COLORS.length];
    const card = document.createElement("div");
    card.className = "persona-card";
    card.id = `card-${p.id}`;
    card.style.setProperty("--persona-color", color);
    card.innerHTML = `
      <div class="persona-avatar">${initials(p.name)}</div>
      <div class="persona-name">${p.name}</div>
      <div class="persona-role">${p.role}</div>
      <div class="persona-perspective">${p.perspective}</div>
      <div class="persona-status"><span class="thinking-dot"></span><span class="status-text"></span></div>
    `;
    cards.appendChild(card);
  });

  section.classList.remove("hidden");
  setStatus("Debating…", "active");
  scrollToBottom();
}

function onRoundStart(round) {
  const transcript = document.getElementById("transcript");
  const div = document.createElement("div");
  div.className = "round-divider";
  div.innerHTML = `<span class="round-label">Round ${round}</span>`;
  transcript.appendChild(div);
  scrollToBottom();
}

function activateCard(personaId, statusText) {
  // Deactivate all first
  document.querySelectorAll(".persona-card").forEach(c => c.classList.remove("active"));
  const card = document.getElementById(`card-${personaId}`);
  if (!card) return;
  card.classList.add("active");
  const st = card.querySelector(".status-text");
  if (st) st.textContent = statusText;
}

function deactivateCard(personaId) {
  const card = document.getElementById(`card-${personaId}`);
  if (card) card.classList.remove("active");
}

function onPersonaSearching(persona, query) {
  activateCard(persona.id, `Searching: "${query}"`);
  scrollToBottom();
}

function onPersonaFacts(persona) {
  activateCard(persona.id, "Composing statement…");
}

function onPersonaStatement(persona, statement, grounding) {
  deactivateCard(persona.id);

  const color = colorFor(persona.id);
  const transcript = document.getElementById("transcript");

  const entry = document.createElement("div");
  entry.className = "entry";

  const sourcesHtml = grounding.length > 0
    ? `<div class="entry-sources">
        ${grounding.map(f => `<a class="source-chip" href="${f.url}" target="_blank" rel="noopener" title="${f.url}">${domainOf(f.url)}</a>`).join("")}
       </div>`
    : "";

  entry.style.setProperty("--persona-color", color);
  entry.innerHTML = `
    <div class="entry-avatar">${initials(persona.name)}</div>
    <div class="entry-body">
      <div class="entry-meta">
        <span class="entry-name">${persona.name}</span>
        <span class="entry-role">${persona.role}</span>
      </div>
      <div class="entry-statement">${escapeHtml(statement)}</div>
      ${sourcesHtml}
    </div>
  `;

  transcript.appendChild(entry);
  scrollToBottom();
}

function onModeratorEvaluating() {
  setStatus("Moderator evaluating…", "active");
  const transcript = document.getElementById("transcript");
  const el = document.createElement("div");
  el.className = "mod-event";
  el.id = "mod-evaluating";
  el.innerHTML = `<span class="mod-icon">⚖</span><span><strong>Moderator</strong> — evaluating whether further debate would add new insight…</span>`;
  transcript.appendChild(el);
  scrollToBottom();
}

function onModeratorDecision(shouldContinue, reason) {
  const prev = document.getElementById("mod-evaluating");
  if (prev) prev.remove();

  const transcript = document.getElementById("transcript");
  const el = document.createElement("div");
  el.className = `mod-event ${shouldContinue ? "continue-event" : "conclude"}`;
  const icon = shouldContinue ? "↩" : "✓";
  const label = shouldContinue ? "Continuing" : "Concluding";
  el.innerHTML = `<span class="mod-icon">${icon}</span><span><strong>Moderator — ${label}:</strong> ${escapeHtml(reason)}</span>`;
  transcript.appendChild(el);

  if (shouldContinue) setStatus("Debating…", "active");
  scrollToBottom();
}

function onVerdict(text) {
  setStatus("Verdict ready", "done");
  const section = document.getElementById("verdict-section");
  const body = document.getElementById("verdict-body");
  body.innerHTML = marked.parse(text);
  section.classList.remove("hidden");
  setTimeout(() => section.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
}

function onDone(rounds) {
  const banner = document.getElementById("done-banner");
  document.getElementById("done-stats").textContent =
    `${Object.keys(personaMap).length} experts · ${rounds} round${rounds === 1 ? "" : "s"}`;
  banner.classList.remove("hidden");
}

function onError(message) {
  setStatus("Error", "");
  const transcript = document.getElementById("transcript");
  const el = document.createElement("div");
  el.className = "mod-event";
  el.innerHTML = `<span class="mod-icon">⚠</span><span><strong>Error:</strong> ${escapeHtml(message)}</span>`;
  transcript.appendChild(el);
  scrollToBottom();
}

// ── SSE connection ────────────────────────────────

function startDebate(topic) {
  document.getElementById("hero").classList.add("hidden");
  const view = document.getElementById("debate-view");
  view.classList.remove("hidden");
  document.getElementById("debate-topic-display").textContent = `"${topic}"`;
  document.getElementById("transcript").innerHTML = "";
  document.getElementById("council-section").classList.add("hidden");
  document.getElementById("verdict-section").classList.add("hidden");
  document.getElementById("done-banner").classList.add("hidden");
  setStatus("Assembling council…", "active");

  const es = new EventSource(`/api/debate?topic=${encodeURIComponent(topic)}`);

  es.onmessage = (e) => {
    const event = JSON.parse(e.data);
    switch (event.type) {
      case "council_assembled":    onCouncilAssembled(event.personas); break;
      case "round_start":          onRoundStart(event.round); break;
      case "persona_searching":    onPersonaSearching(event.persona, event.query); break;
      case "persona_facts":        onPersonaFacts(event.persona); break;
      case "persona_statement":    onPersonaStatement(event.persona, event.statement, event.grounding); break;
      case "moderator_evaluating": onModeratorEvaluating(); break;
      case "moderator_decision":   onModeratorDecision(event.continue, event.reason); break;
      case "verdict":              onVerdict(event.text); break;
      case "done":                 onDone(event.rounds); es.close(); break;
      case "error":                onError(event.message); es.close(); break;
    }
  };

  es.onerror = () => {
    onError("Connection lost. The debate may have completed.");
    es.close();
  };
}

// ── Init ──────────────────────────────────────────

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

document.getElementById("topic-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const topic = document.getElementById("topic-input").value.trim();
  if (topic) startDebate(topic);
});

document.querySelectorAll(".ex-chip").forEach(btn => {
  btn.addEventListener("click", () => {
    document.getElementById("topic-input").value = btn.dataset.topic;
    document.getElementById("topic-input").focus();
  });
});

document.getElementById("new-debate-btn").addEventListener("click", () => {
  document.getElementById("debate-view").classList.add("hidden");
  document.getElementById("hero").classList.remove("hidden");
  document.getElementById("topic-input").value = "";
  document.getElementById("topic-input").focus();
});
