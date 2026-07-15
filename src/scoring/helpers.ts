import type { WeatherDay } from "../types.js";

export type Score = { score: number; reason: string };

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function comfortBand(value: number, low: number, high: number, falloff: number): number {
  if (value >= low && value <= high) return 1;
  const distance = value < low ? low - value : value - high;
  return clamp(1 - distance / falloff, 0, 1);
}

export function ramp(value: number, start: number, end: number): number {
  if (value <= start) return 0;
  if (value >= end) return 1;
  return (value - start) / (end - start);
}

export function typicalTemp(day: WeatherDay): number | null {
  const { tempMax, tempMin } = day;
  if (tempMax != null && tempMin != null) return (tempMax + tempMin) / 2;
  return tempMax ?? tempMin ?? null;
}

export function num(value: number | null | undefined, fallback: number): number {
  return value ?? fallback;
}

export function toScore(fraction: number): number {
  return Math.round(clamp(fraction, 0, 1) * 100);
}

export function round(n: number): number {
  return Math.round(n);
}
