import type { WeatherDay } from "../types.js";
import { comfortBand, ramp, clamp, num, typicalTemp, toScore, round, type Score } from "./helpers.js";

// Outdoor sightseeing likes mild, dry, calm, sunny days, pleasant weather for walking around.
export function howGoodForOutdoorSightseeing(day: WeatherDay): Score {
  const temp = num(typicalTemp(day), 12);
  const rain = num(day.precipMm, 0);
  const wind = num(day.windMax, 0);
  const sunshine = num(day.sunshineSeconds, 0);

  const comfort = comfortBand(temp, 16, 25, 12);
  const dryness = 1 - ramp(rain, 1, 12);
  const calm = 1 - ramp(wind, 20, 55);
  const sunny = ramp(sunshine, 7200, 36000);

  const score = 0.4 * comfort + 0.3 * dryness + 0.15 * calm + 0.15 * sunny;

  return { score: toScore(score), reason: outdoorReason(temp, rain, sunny) };
}

export function howGoodForIndoorSightseeing(day: WeatherDay): Score {
  const temp = num(typicalTemp(day), 12);
  const rain = num(day.precipMm, 0);
  const wind = num(day.windMax, 0);

  const wet = ramp(rain, 1, 12);
  const harshTemp = 1 - comfortBand(temp, 5, 28, 15);
  const windy = ramp(wind, 30, 70);

  const score = clamp(0.5 * wet + 0.3 * harshTemp + 0.2 * windy, 0, 1);

  return { score: toScore(score), reason: indoorReason(rain, temp) };
}

function outdoorReason(temp: number, rain: number, sunny: number): string {
  const sky = rain >= 3 ? "wet" : sunny > 0.6 ? "sunny" : "dry";
  return `${round(temp)}°C, ${sky}`;
}

function indoorReason(rain: number, temp: number): string {
  if (rain >= 3) return "rainy";
  if (temp <= 3) return "cold out";
  if (temp >= 30) return "too hot out";
  return "weather's fine";
}
