import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    globals: true,
    // DB-backed tests share one Supabase pooled connection set — run files
    // sequentially so transactions/advisory locks don't exhaust the pool.
    fileParallelism: false,
    testTimeout: 20000,
  },
});
