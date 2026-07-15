import { findPlace, getWeek, getMarineWeek } from "./weather/openMeteo.js";
import { findLocation, saveLocation, toSlug, type StoredLocation } from "./db/locations.js";
import { getStoredWeek, saveWeek, isDataStale } from "./db/weather.js";
import type { WeatherDay, MarineDay } from "./types.js";

export type Forecast = {
  location: StoredLocation;
  days: WeatherDay[];
};

export async function loadForecast(place: string): Promise<Forecast | null> {
  const slug = toSlug(place);

  let location = findLocation(slug);
  if (!location) {
    const found = await findPlace(place);
    if (!found) return null;
    location = saveLocation(slug, found);
  }

  if (isDataStale(location.id)) {
    console.log(`[forecast] ${location.name}: stored weather is stale, fetching from Open-Meteo`);
    const [week, marine] = await Promise.all([
      getWeek(location.latitude, location.longitude),
      getMarineWeek(location.latitude, location.longitude),
    ]);
    saveWeek(location.id, mergeMarine(week, marine));
  } else {
    console.log(`[forecast] ${location.name}: stored weather is still fresh, no fetch needed`);
  }

  return { location, days: getStoredWeek(location.id) };
}

// Fold the marine forecast into each matching WeatherDay by date. Days without a
// marine reading (inland spots, or a failed marine fetch) keep their null wave
// fields.
function mergeMarine(week: WeatherDay[], marine: MarineDay[]): WeatherDay[] {
  const byDate = new Map(marine.map((m) => [m.date, m]));
  return week.map((day) => {
    const sea = byDate.get(day.date);
    if (!sea) return day;
    return {
      ...day,
      waveHeightMax: sea.waveHeightMax,
      wavePeriodMax: sea.wavePeriodMax,
      swellHeightMax: sea.swellHeightMax,
      swellPeriodMax: sea.swellPeriodMax,
    };
  });
}
