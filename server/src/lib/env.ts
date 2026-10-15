import dotenv from "dotenv";

// Load root-level .env (one level up from server/) and any local override.
dotenv.config({ path: "../.env" });
dotenv.config(); // server/.env if present (does not override already-set vars)

function int(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n)) throw new Error(`Env ${name} must be an integer, got "${raw}"`);
  return n;
}

// Models that were valid earlier but are now retired by the provider. If an old
// .env still names one, fall back to the current default instead of 404ing.
const DEPRECATED_MODELS = new Set(["gemini-2.0-flash", "llama-3.3-70b-versatile"]);
function liveModel(configured: string | undefined, fallback: string): string {
  if (!configured || DEPRECATED_MODELS.has(configured)) return fallback;
  return configured;
}

export const env = {
  port: int("PORT", 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  rate24kPaisePerGram: int("RATE_24K_PAISE_PER_GRAM", 700000),
  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? "",
    model: liveModel(process.env.GEMINI_MODEL, "gemini-2.5-flash"),
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY ?? "",
    model: liveModel(process.env.GROQ_MODEL, "openai/gpt-oss-20b"),
  },
};
