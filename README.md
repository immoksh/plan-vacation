# plan-vacation

A small GraphQL service that takes a town or city and ranks how good the next 7 days
look for **skiing, surfing, outdoor sightseeing and indoor sightseeing**. Weather comes
from [Open-Meteo](https://open-meteo.com/) and is stored locally, so we're not calling the
API on every request.

## What it does

You ask for a place, you get back the four activities, and for each one the 7 days ordered
best-first with a 0–100 score and a short reason:

```graphql
{
  vacationForecast(place: "London") {
    place { name country timezone }
    activities {
      activity
      bestDay { date score reason }
      days { date score rank reason }
    }
  }
}
```

```json
{
  "activity": "OUTDOOR_SIGHTSEEING",
  "bestDay": { "date": "2026-07-14", "score": 100, "reason": "24°C, sunny" }
}
```

Unknown place -> a clean GraphQL error with code `PLACE_NOT_FOUND` rather than a crash.

## Running it

Needs **Node 22+** (uses the built-in `fetch` and a couple of newer bits). No Docker, no
database to set up — SQLite is a local file that's created on first run.

```bash
npm install
npm run dev
```

Then open **http://localhost:4000/graphql** for the GraphiQL playground and run the query
above. There's also a `GET /health` endpoint.

Scripts: `npm run dev` (watch mode), `npm run build` + `npm start` (compiled), `npm test`,
`npm run typecheck`.

## Approach

A few deliberate choices about how this is put together:

- **GraphQL Yoga + SQLite for a lightweight stack.** Yoga is a batteries-included GraphQL
  server (built-in playground, no heavy framework), and SQLite is a single local file with
  zero setup. Together they keep the whole thing runnable with just `npm install && npm run
  dev`.
- **In-memory cache for the current use case.** Computed rankings live in an in-process TTL
  cache — the right fit for a single instance and today's traffic, with no extra
  infrastructure to run.
- **Built to scale later without a rewrite.** The cache and the database both sit behind
  small interfaces, so if the user footfall grows, moving to Redis and Postgres is a
  contained swap rather than a redesign.
- **Weather stored per day and refreshed incrementally.** The first request stores the full
  7-day forecast. On a later refresh the week is upserted by `(location, date)`: dates that
  already exist are updated in place, and as the forecast window rolls forward the new day is
  simply inserted — no duplicate rows, and unchanged data isn't rewritten needlessly.
- **Geocoding cached in the DB.** A place name is resolved to coordinates once and saved in
  the `locations` table, so we never spend an Open-Meteo geocode call on the same place
  twice.

## How it works

A request flows through a few layers, each doing as little work as it can get away with:

1. **Cache** — computed rankings are kept in an in-process TTL cache keyed by the place.
   A repeat request inside the window skips everything below.
2. **Geocode once** — the place name is resolved to coordinates via Open-Meteo and saved in
   the `locations` table. We never geocode the same name twice.
3. **Lazy refresh** — if the stored forecast for that location is missing or older than the
   freshness window, we fetch a fresh 7-day forecast and upsert it; otherwise we read
   straight from SQLite. This is the "persist it, don't call the API every time" part.
4. **Score & rank** — the stored week is run through four small, pure scoring functions and
   ordered best day first.

SQLite is the source of truth for weather; the cache is just a fast lane for repeated reads.

### Data model

Two tables:

- `locations` — a geocoded place, keyed by a normalized `slug` of what was typed.
- `daily_weather` — one row per location per day, unique on `(location_id, date)`, so a
  refresh upserts in place. Freshness is judged by the newest `fetched_at`.

### Scoring

Each activity is a pure function of a day's weather returning a 0–100 score plus a reason.
They're built from two little primitives: `comfortBand` (1 inside an ideal range, tapering
outside) and `ramp` (a linear "more of this = stronger effect" factor).

- **Skiing** — cold gates everything (snow has to hold); fresh snowfall is a big plus; gusts
  and rain knock it down. A mild day with no snow is 0.
- **Surfing** — a moderate wind band is best (some wind builds surf, too much blows it out),
  with a mild warmth bonus and a small rain penalty.
- **Outdoor sightseeing** — rewards mild, dry, calm, sunny days.
- **Indoor sightseeing** — the flip side: high when being outside is unpleasant (rain first,
  then temperature extremes and strong wind).

## Configuration

Everything has a working default; override via `.env`:

| Variable            | Default        | Meaning                                        |
| ------------------- | -------------- | ---------------------------------------------- |
| `PORT`              | `4000`         | HTTP port                                      |
| `DB_FILE`           | `vacation.db`  | SQLite file (use `:memory:` for a throwaway db) |
| `WEATHER_TTL_HOURS` | `3`            | How long stored weather stays fresh            |

## Assumptions & what I cut

Where I'd normally check with a PM, here's the call I made:

- **Surfing is approximated from wind and temperature.** Real surf quality is about swell
  height, period and direction, which live in Open-Meteo's separate (coastal-only) Marine
  API. I left that out to keep the scope focused — which also means an inland town still
  gets a surf score. Treat surfing as the roughest of the four.
- **Lazy refresh over a scheduler.** Weather is refreshed on read when stale, not by a cron
  job. It's simpler and self-healing; the refresh is a single function a scheduler could
  call later for warm-cache behaviour.
- **"Next 7 days"** is Open-Meteo's default 7-day daily forecast in the place's local
  timezone, in metric units.
- **Scores are comparable within an activity, not across them.** A 70 for skiing and a 70
  for surfing don't mean the same thing.
- **SQLite + in-memory cache** were chosen for zero-setup. Both sit behind small interfaces,
  so swapping in Postgres and Redis for real scale is a contained change.
- **No auth, rate limiting or request batching** — out of scope for the exercise.
