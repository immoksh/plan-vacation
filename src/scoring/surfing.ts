import type { WeatherDay } from "../types.js";
import { comfortBand, ramp, num, typicalTemp, toScore, round, type Score } from "./helpers.js";

export function howGoodForSurfing(day: WeatherDay): Score {
  const waveHeight = day.swellHeightMax ?? day.waveHeightMax;
  const period = day.swellPeriodMax ?? day.wavePeriodMax;

  if (waveHeight == null) {
    return { score: 0, reason: "not possible here" };
  }

  const wind = num(day.windMax, 0);
  const temp = num(typicalTemp(day), 15);
  const rain = num(day.precipMm, 0);

  // Size gates everything: flat below ~1m, ideal 1.0–2.2m, oversized above.
  const size = comfortBand(waveHeight, 1.0, 2.2, 1.2);
  // Long periods are clean groundswell; short periods are messy wind chop.
  const cleanliness = period == null ? 0.5 : ramp(period, 6, 12);
  // We only have wind speed (no bearing), so treat strong wind as blown out.
  const blownOut = ramp(wind, 25, 55);
  const warmth = comfortBand(temp, 16, 28, 16);
  const rainHit = ramp(rain, 2, 15);

  let score = size * (0.65 + 0.35 * cleanliness);
  score *= 0.85 + 0.15 * warmth;
  score *= 1 - 0.4 * blownOut;
  score *= 1 - 0.3 * rainHit;

  return { score: toScore(score), reason: reasonFor(waveHeight, period, wind) };
}

function reasonFor(waveHeight: number, period: number | null, wind: number): string {
  const size =
    waveHeight < 0.5
      ? "flat"
      : waveHeight < 1.0
        ? "small"
        : waveHeight <= 2.2
          ? "surf-able"
          : waveHeight <= 3.5
            ? "big"
            : "oversized";

  const bits = [`${size} ${waveHeight.toFixed(1)}m swell`];
  if (period != null) {
    bits.push(period >= 10 ? `clean ${round(period)}s groundswell` : `${round(period)}s period`);
  }
  if (wind > 45) bits.push("likely blown out");
  else if (wind > 25) bits.push("some wind");

  return bits.join(", ");
}
