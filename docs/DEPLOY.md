# Deploying (Vercel)

No Docker needed. The frontend is a static Vite build; the API is a small Express server.

## Frontend → Vercel
- Import the repo in Vercel, set **Root Directory** to `client/`.
- `client/vercel.json` already sets the build command, output (`dist`) and the SPA rewrite so
  deep links like `/calculator` work on refresh.
- Set the env var **`VITE_API_BASE_URL`** to your deployed API, e.g.
  `https://<your-api-host>/api/v1`.

## API → a Node host
The Express API needs a long-running Node process and a Postgres connection, so host it where
that's free and simple:
- **Render / Railway / Fly** (free tier): root `server/`, build `npm install && npm run build`,
  start `npm start`. Set `DATABASE_URL`, `DIRECT_URL`, `RATE_24K_PAISE_PER_GRAM`,
  `GEMINI_API_KEY`, `GROQ_API_KEY`.
- On the host, run the migration + seed once: `npx prisma migrate deploy` then `npm run db:seed`.

(The API can also run on Vercel as a serverless function with a small wrapper, but a standard
Node host keeps the advisory-lock transaction and the agent's streaming-friendly loop simplest.)

## CORS
The API already enables permissive CORS for the demo. For production, restrict it to your
frontend origin in `server/src/app.ts`.
