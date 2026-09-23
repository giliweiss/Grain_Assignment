# Grain Conference Intelligence

A four-screen tool for a Grain salesperson: discover and prioritize conferences, plan the year, capture a lead on the floor, recognize repeat contacts, and act with one AI relationship summary plus a HubSpot send.

Live app: [https://grain-assignment.vercel.app/](https://grain-assignment.vercel.app/)

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Run tests with:

```bash
npm test
```

Conference data lives in `data/conferences.json`. Edit that file to add or update events.

The included sample conferences, seeded meetings, and Year Plan are the 2026 conference calendar. The Year Plan stays on 2026.

## Screens

1. **Conferences** — filter and prioritize events by fit.
2. **Year Plan** — months, months with no strong events, and trip clusters.
3. **On the Floor** — fast lead capture at an event.
4. **People** — meeting history, match confirmation, relationship summary, and HubSpot send.

## Integration credentials

Set these yourself. There is no Settings screen. Keys must not be hardcoded or put in frontend code.

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Relationship summary (server-only) |
| `OPENAI_MODEL` | OpenAI model name (optional; defaults in the route) |
| `HUBSPOT_ACCESS_TOKEN` | Create-contact send (server-only) |

- **Local:** copy `.env.example` to `.env.local` and fill in the values.
- **Deployed:** set the same names in Vercel project environment variables.

The browser never receives these tokens. API routes return a clear not-configured or not-sent response when a key or email is missing.

## Deploy on Vercel

1. In Vercel, import the GitHub repository.
2. Vercel detects Next.js. Leave the framework and build settings as detected.
3. Add environment variables: `OPENAI_API_KEY`, `OPENAI_MODEL`, and, if you want contact creation, `HUBSPOT_ACCESS_TOKEN`.
4. Deploy. If you add or change those variables later, redeploy so the new values are used.

The current deployment is [https://grain-assignment.vercel.app/](https://grain-assignment.vercel.app/).
