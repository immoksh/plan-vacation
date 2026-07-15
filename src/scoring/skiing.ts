import type { WeatherDay } from "../types.js";
import { comfortBand, ramp, num, toScore, round, type Score } from "./helpers.js";

export function howGoodForSkiing(day: WeatherDay): Score {
  const tempMax = num(day.tempMax, 10);
  const snow = num(day.snowfallCm, 0);
  const gusts = num(day.gustsMax, num(day.windMax, 0));
  const rain = tempMax > 1 ? num(day.precipMm, 0) : 0;

  const cold = comfortBand(tempMax, -10, -1, 9); // best when the high stays below freezing
  const powder = ramp(snow, 0, 8); // fresh snow is a big yes
  const windHit = ramp(gusts, 45, 85);
  const rainHit = ramp(rain, 1, 8);

  let score = cold * (0.5 + 0.5 * powder);
  score *= 1 - 0.5 * windHit;
  score *= 1 - 0.6 * rainHit;

  return { score: toScore(score), reason: reasonFor(tempMax, snow, cold, windHit, rainHit) };
}

function reasonFor(
  tempMax: number,
  snow: number,
  cold: number,
  windHit: number,
  rainHit: number,
): string {
  if (cold === 0) return `too mild at ${round(tempMax)}°C for snow to hold`;

  const bits: string[] = [];
  if (snow >= 2) bits.push(`${round(snow)}cm fresh snow`);
  bits.push(`${round(tempMax)}°C high`);
  if (rainHit > 0.3) bits.push("some rain");
  if (windHit > 0.4) bits.push("gusty");
  return bits.join(", ");
}
