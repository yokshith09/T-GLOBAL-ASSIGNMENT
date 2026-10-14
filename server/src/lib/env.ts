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

export const env = {
  port: int("PORT", 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  rate24kPaisePerGram: int("RATE_24K_PAISE_PER_GRAM", 700000),
  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? "",
    model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY ?? "",
    model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
  },
};
