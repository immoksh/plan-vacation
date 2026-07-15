export type Place = {
  name: string;
  country: string | null;
  latitude: number;
  longitude: number;
  timezone: string | null;
  elevation: number | null;
};

export type WeatherDay = {
  date: string; // YYYY-MM-DD format for the place's local timezone
  tempMax: number | null;
  tempMin: number | null;
  precipMm: number | null;
  snowfallCm: number | null;
  windMax: number | null;
  gustsMax: number | null;
  uvMax: number | null;
  sunshineSeconds: number | null;
  weatherCode: number | null;
  // Marine forecast, from Open-Meteo's marine API. Null when the location is
  // inland (no ocean data) or the marine fetch was unavailable.
  waveHeightMax: number | null; // metres
  wavePeriodMax: number | null; // seconds
  swellHeightMax: number | null; // metres
  swellPeriodMax: number | null; // seconds
};

export type Activity = "SKIING" | "SURFING" | "OUTDOOR_SIGHTSEEING" | "INDOOR_SIGHTSEEING";

export type DayScore = {
  date: string;
  score: number;
  rank: number;
  reason: string;
};

export type ActivityRanking = {
  activity: Activity;
  bestDay: DayScore | null;
  days: DayScore[];
};

export type PlaceForecast = {
  place: Place;
  activities: ActivityRanking[];
};

export type RawPlace = {
  name: string;
  country?: string;
  country_code?: string; // two-letter code, e.g. "CH"
  admin1?: string; // state / region, e.g. "Valais"
  latitude: number;
  longitude: number;
  timezone?: string;
  elevation?: number;
};

export type RawDaily = {
  time: string[];
  temperature_2m_max?: (number | null)[];
  temperature_2m_min?: (number | null)[];
  precipitation_sum?: (number | null)[];
  snowfall_sum?: (number | null)[];
  wind_speed_10m_max?: (number | null)[];
  wind_gusts_10m_max?: (number | null)[];
  uv_index_max?: (number | null)[];
  sunshine_duration?: (number | null)[];
  weather_code?: (number | null)[];
};

export type RawMarineDaily = {
  time: string[];
  wave_height_max?: (number | null)[];
  wave_period_max?: (number | null)[];
  swell_wave_height_max?: (number | null)[];
  swell_wave_period_max?: (number | null)[];
};

// The subset of marine fields we merge into a WeatherDay, keyed by date.
export type MarineDay = {
  date: string;
  waveHeightMax: number | null;
  wavePeriodMax: number | null;
  swellHeightMax: number | null;
  swellPeriodMax: number | null;
};
