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

export async function findPlace(query: string): Promise<Place | null> {
  // "Alps, Switzerland" -> look up "Alps" but only accept a Swiss result.
  // "Alps" on its own -> just take Open-Meteo's top match.
  const { name, country } = splitQuery(query);

  const url = `${GEOCODE_URL}?${new URLSearchParams({
    name,
    count: country ? "10" : "1",
    language: "en",
    format: "json",
  })}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Geocoding failed for "${name}" (${res.status})`);
  }

  const body = (await res.json()) as { results?: RawPlace[] };
  const results = body.results ?? [];
  const hit = country ? results.find((r) => matchesCountry(r, country)) : results[0];
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

function splitQuery(query: string): { name: string; country?: string } {
  const comma = query.indexOf(",");
  if (comma === -1) return { name: query.trim() };

  const name = query.slice(0, comma).trim();
  const country = query.slice(comma + 1).trim();
  return country ? { name, country } : { name };
}

// Does a candidate sit in the country the user asked for? We accept the country
// name, its two-letter code, or the state/region, all case-insensitive.
function matchesCountry(place: RawPlace, want: string): boolean {
  const wanted = want.toLowerCase();
  return (
    place.country?.toLowerCase() === wanted ||
    place.country_code?.toLowerCase() === wanted ||
    place.admin1?.toLowerCase() === wanted
  );
}

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
    console.log(`fetch failed for ${latitude},${longitude}: ${String(err)}`);
    return [];
  }

  if (!res.ok) {
    console.log(`no marine forecast (${res.status}) for ${latitude},${longitude}`);
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
