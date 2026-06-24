import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { runDebate } from "./debate-runner.js";
import type { DebateEvent } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.get("/api/debate", async (req, res) => {
  const topic = (req.query.topic as string)?.trim();
  if (!topic) {
    res.status(400).json({ error: "topic query parameter is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  const send = (event: DebateEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    await runDebate(topic, send);
  } catch (err) {
    send({ type: "error", message: err instanceof Error ? err.message : String(err) });
  } finally {
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`\n🏛  AI Council running at http://localhost:${PORT}\n`);
});
