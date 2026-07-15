import type { Place, WeatherDay, MarineDay, RawPlace, RawDaily, RawMarineDaily } from "../types.js";

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const MARINE_URL = "https://marine-api.open-meteo.com/v1/marine";

const DAILY_FIELDS = [
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_sum",
  "snowfall_sum",
  "wind_speed_10m_max",
  "wind_gusts_10m_max",
  "uv_index_max",
  "sunshine_duration",
  "weather_code",
];

const MARINE_DAILY_FIELDS = [
  "wave_height_max",
  "wave_period_max",
  "swell_wave_height_max",
  "swell_wave_period_max",
];

export async function findPlace(name: string): Promise<Place | null> {
  const url = `${GEOCODE_URL}?${new URLSearchParams({
    name,
    count: "1",
    language: "en",
    format: "json",
  })}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Geocoding failed for "${name}" (${res.status})`);
  }

  const body = (await res.json()) as { results?: RawPlace[] };
  const hit = body.results?.[0];
  if (!hit) return null;

  return {
    name: hit.name,
    country: hit.country ?? null,
    latitude: hit.latitude,
    longitude: hit.longitude,
    timezone: hit.timezone ?? null,
    elevation: hit.elevation ?? null,
  };
}

// Pull the next 7 days of daily weather for a set of coordinates.
export async function getWeek(latitude: number, longitude: number): Promise<WeatherDay[]> {
  const url = `${FORECAST_URL}?${new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: DAILY_FIELDS.join(","),
    forecast_days: "7",
    timezone: "auto",
  })}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Forecast failed (${res.status})`);
  }

  const body = (await res.json()) as { daily?: RawDaily };
  const daily = body.daily;
  if (!daily) return [];

  return daily.time.map((date, i) => ({
    date,
    tempMax: valueAt(daily.temperature_2m_max, i),
    tempMin: valueAt(daily.temperature_2m_min, i),
    precipMm: valueAt(daily.precipitation_sum, i),
    snowfallCm: valueAt(daily.snowfall_sum, i),
    windMax: valueAt(daily.wind_speed_10m_max, i),
    gustsMax: valueAt(daily.wind_gusts_10m_max, i),
    uvMax: valueAt(daily.uv_index_max, i),
    sunshineSeconds: valueAt(daily.sunshine_duration, i),
    weatherCode: valueAt(daily.weather_code, i),
    waveHeightMax: null,
    wavePeriodMax: null,
    swellHeightMax: null,
    swellPeriodMax: null,
  }));
}

export async function getMarineWeek(latitude: number, longitude: number): Promise<MarineDay[]> {
  const url = `${MARINE_URL}?${new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: MARINE_DAILY_FIELDS.join(","),
    forecast_days: "7",
    timezone: "auto",
  })}`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (err) {
    console.warn(`[marine] fetch failed for ${latitude},${longitude}: ${String(err)}`);
    return [];
  }

  if (!res.ok) {
    console.warn(`[marine] no marine forecast (${res.status}) for ${latitude},${longitude}`);
    return [];
  }

  const body = (await res.json()) as { daily?: RawMarineDaily };
  const daily = body.daily;
  if (!daily) return [];

  return daily.time.map((date, i) => ({
    date,
    waveHeightMax: valueAt(daily.wave_height_max, i),
    wavePeriodMax: valueAt(daily.wave_period_max, i),
    swellHeightMax: valueAt(daily.swell_wave_height_max, i),
    swellPeriodMax: valueAt(daily.swell_wave_period_max, i),
  }));
}

function valueAt(values: (number | null)[] | undefined, i: number): number | null {
  return values?.[i] ?? null;
}
