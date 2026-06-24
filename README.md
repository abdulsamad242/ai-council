# The Council

An AI debate system that assembles a panel of domain experts for any question, conducts a multi-round evidence-grounded debate, and delivers a reasoned verdict — with a streaming web UI built in Next.js.

---

## What it does

You give it a question. It assembles three domain experts appropriate to that specific topic — not generic archetypes, but real roles like *Labor Economist*, *Environmental Lawyer*, *Risk Assessment Engineer*. They debate across multiple rounds, each expert searching for and citing real sources, directly challenging each other's specific claims. A moderator watches the transcript and decides when the debate has been genuinely exhausted — not after a fixed number of rounds, but when it determines another round would produce no new ground.

The whole thing streams live to the browser as it happens.

---

## How it works

### Dynamic council generation
Before each debate, an LLM reads the topic and assembles a council of three domain experts whose fields are most relevant to that specific question. A debate about nuclear energy gets an energy economist, an environmental lawyer, and a nuclear engineer. A debate about AI termination gets a labor economist, an employment law specialist, and an HCI researcher. The council is different every time.

### Evidence pipeline
Each expert's turn has three stages:
1. **Plan** — the expert identifies the strongest specific claim made by another expert last round and generates a targeted search query to find counter-evidence for that claim (not just to support their own position)
2. **Verify** — raw search results are passed through a separate LLM call that extracts only literally-stated facts, tags each with `[RELIABLE]` or `[LOW-CONFIDENCE]` based on source credibility, and strips all reasoning
3. **Argue** — a final LLM call receives only the verified facts and is required to open by directly naming and challenging a specific claim from the previous round before adding any new substance

This separation prevents the model from confusing "what does evidence say" with "how should I argue."

### Self-terminating moderator
After each round (minimum 2), the moderator reads the full transcript and is asked one question: *can you name a specific unresolved point that a next round would address?* If it can name one, the debate continues. If it genuinely cannot — because every significant claim has been challenged and responded to — the debate concludes. The moderator does not ask "should we stop?" (which gets a conservative yes) but instead must produce a concrete unresolved thread or conclude.

### Streaming UI
The backend runs the debate and emits Server-Sent Events for every step: council assembled, expert searching, expert composing, statement ready, moderator evaluating, verdict. The frontend consumes these in real time — council cards appear and activate as each expert speaks, statements flow in as they're generated, moderator decisions appear inline, and the verdict renders as formatted markdown.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Web framework | Next.js 16 (App Router) |
| UI animations | Framer Motion |
| LLM | Llama 3.3 70B via Groq |
| Web search | Tavily |
| Streaming | Server-Sent Events (SSE) |
| Language | TypeScript throughout |

---

## Setup

**Prerequisites:** Node.js 18+, a [Groq API key](https://console.groq.com), a [Tavily API key](https://tavily.com)

```bash
git clone https://github.com/your-username/ai-council
cd ai-council
npm install
```

Create a `.env` file:

```env
GROQ_API_KEY=your_groq_key_here
TAVILY_API_KEY=your_tavily_key_here
```

**Run the web UI:**
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

**Run a debate in the terminal:**
```bash
npm run debate -- "Is universal basic income a viable solution to automation-driven unemployment?"
```

---

## Project structure

```
src/
  council/
    generator.ts      # LLM assembles topic-appropriate expert panel
    persona-turn.ts   # Generic turn: plan query → verify evidence → argue
  personas/
    moderator.ts      # Self-terminating moderator + final verdict
  utils/
    search.ts         # Tavily search + credibility filtering + tagging
    retry.ts          # Exponential backoff for API calls
  debate-runner.ts    # Main loop — emits DebateEvents for UI or CLI
  types.ts            # PersonaConfig, DebateEntry, CouncilState, DebateEvent

app/
  api/debate/route.ts # SSE endpoint — streams DebateEvents to browser
  page.tsx            # Entry point

components/
  ClientApp.tsx       # State machine (useReducer) + SSE connection
  Hero.tsx            # Landing page
  DebateView.tsx      # Full-width debate layout
  PersonaCard.tsx     # Expert card with live status
  TranscriptEntry.tsx # Individual statement with left-color-bar design
  ModeratorEvent.tsx  # Continue / conclude dividers
  VerdictSection.tsx  # Final markdown verdict
```

---

## Design decisions

**Why Groq?** Speed. Debates involve many sequential LLM calls (search planning, evidence verification, statement generation, moderator evaluation). Groq's inference speed makes the experience feel live rather than like waiting for a batch job.

**Why SSE over WebSockets?** The debate is entirely one-directional — server to client. SSE is simpler, works over standard HTTP, and requires no additional infrastructure.

**Why separate the evidence verification step?** Early versions had a single prompt that searched, reasoned about evidence, and wrote a statement. The model consistently leaked its reasoning into the output — hedging claims in weird ways, citing source quality mid-argument. Separating "what does evidence literally say" from "how do I argue" eliminated that.

**Why does the moderator ask for a specific unresolved point instead of asking "should we continue"?** A binary stop/continue question gets a conservative answer from a low-temperature model — it says "done" whenever arguments have been stated. Forcing the moderator to name a concrete unresolved thread means it can only conclude when it genuinely cannot find one.
