import type { WeatherDay, Activity, ActivityRanking, DayScore } from "../types.js";
import type { Score } from "./helpers.js";
import { howGoodForSkiing } from "./skiing.js";
import { howGoodForSurfing } from "./surfing.js";
import { howGoodForOutdoorSightseeing, howGoodForIndoorSightseeing } from "./sightseeing.js";

type Scorer = (day: WeatherDay) => Score;

const scorers: { activity: Activity; scoreDay: Scorer }[] = [
  { activity: "SKIING", scoreDay: howGoodForSkiing },
  { activity: "SURFING", scoreDay: howGoodForSurfing },
  { activity: "OUTDOOR_SIGHTSEEING", scoreDay: howGoodForOutdoorSightseeing },
  { activity: "INDOOR_SIGHTSEEING", scoreDay: howGoodForIndoorSightseeing },
];

export function rankTheWeek(days: WeatherDay[]): ActivityRanking[] {
  return scorers.map(({ activity, scoreDay }) => {
    const scored: DayScore[] = days
      .map((day) => {
        const { score, reason } = scoreDay(day);
        return { date: day.date, score, reason, rank: 0 };
      })
      .sort((a, b) => b.score - a.score || a.date.localeCompare(b.date));

    scored.forEach((day, i) => {
      day.rank = i + 1;
    });

    return {
      activity,
      bestDay: scored[0] ?? null,
      days: scored,
    };
  });
}
