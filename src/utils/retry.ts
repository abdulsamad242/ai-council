/**
 * Wraps an async function with retry logic and exponential backoff.
 * Used for all external API calls (OpenAI, Tavily) so a single rate-limit
 * or network blip doesn't crash the whole research run.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; label?: string } = {}
): Promise<T> {
  const retries = options.retries ?? 3;
  const label = options.label ?? "operation";

  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isLastAttempt = attempt === retries;
      const delayMs = attempt * 1000; // 1s, 2s, 3s backoff

      console.warn(
        `  ⚠️  ${label} failed (attempt ${attempt}/${retries}): ${
          err instanceof Error ? err.message : err
        }`
      );

      if (!isLastAttempt) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error(`${label} failed after ${retries} attempts: ${lastError instanceof Error ? lastError.message : lastError}`);
}