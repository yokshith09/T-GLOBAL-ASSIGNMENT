import { env } from "../lib/env.js";

// Bonus: a cached gold-rate endpoint. The rate is a mock constant here, but the
// cache demonstrates the pattern you'd use for a live market feed.
const TTL_MS = 60_000;
let cache: { value: RateView; at: number } | null = null;

export type RateView = {
  karat: 24;
  ratePerGramRupees: number;
  ratePerGramPaise: number;
  cachedAt: string;
  ttlSeconds: number;
};

export function getGoldRate(): RateView {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.value;
  const value: RateView = {
    karat: 24,
    ratePerGramPaise: env.rate24kPaisePerGram,
    ratePerGramRupees: Math.round(env.rate24kPaisePerGram / 100),
    cachedAt: new Date(now).toISOString(),
    ttlSeconds: TTL_MS / 1000,
  };
  cache = { value, at: now };
  return value;
}
