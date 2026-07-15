import { db } from "./connection.js";
import { config } from "../config.js";
import type { WeatherDay } from "../types.js";

export function getStoredWeek(locationId: number): WeatherDay[] {
  const rows = db
    .prepare(
      `select date, temp_max, temp_min, precip_mm, snowfall_cm,
              wind_max, gusts_max, uv_max, sunshine_seconds, weather_code,
              wave_height_max, wave_period_max, swell_height_max, swell_period_max
         from daily_weather
        where location_id = ?
        order by date`,
    )
    .all(locationId) as DailyRow[];
  return rows.map(rowToDay);
}

export function saveWeek(locationId: number, week: WeatherDay[]): void {
  const upsert = db.prepare(
    `insert into daily_weather
       (location_id, date, temp_max, temp_min, precip_mm, snowfall_cm,
        wind_max, gusts_max, uv_max, sunshine_seconds, weather_code,
        wave_height_max, wave_period_max, swell_height_max, swell_period_max, fetched_at)
     values
       (@location_id, @date, @temp_max, @temp_min, @precip_mm, @snowfall_cm,
        @wind_max, @gusts_max, @uv_max, @sunshine_seconds, @weather_code,
        @wave_height_max, @wave_period_max, @swell_height_max, @swell_period_max, datetime('now'))
     on conflict(location_id, date) do update set
       temp_max = excluded.temp_max,
       temp_min = excluded.temp_min,
       precip_mm = excluded.precip_mm,
       snowfall_cm = excluded.snowfall_cm,
       wind_max = excluded.wind_max,
       gusts_max = excluded.gusts_max,
       uv_max = excluded.uv_max,
       sunshine_seconds = excluded.sunshine_seconds,
       weather_code = excluded.weather_code,
       wave_height_max = excluded.wave_height_max,
       wave_period_max = excluded.wave_period_max,
       swell_height_max = excluded.swell_height_max,
       swell_period_max = excluded.swell_period_max,
       fetched_at = datetime('now')`,
  );

  const saveAll = db.transaction((days: WeatherDay[]) => {
    for (const d of days) {
      upsert.run({
        location_id: locationId,
        date: d.date,
        temp_max: d.tempMax,
        temp_min: d.tempMin,
        precip_mm: d.precipMm,
        snowfall_cm: d.snowfallCm,
        wind_max: d.windMax,
        gusts_max: d.gustsMax,
        uv_max: d.uvMax,
        sunshine_seconds: d.sunshineSeconds,
        weather_code: d.weatherCode,
        wave_height_max: d.waveHeightMax,
        wave_period_max: d.wavePeriodMax,
        swell_height_max: d.swellHeightMax,
        swell_period_max: d.swellPeriodMax,
      });
    }
  });

  saveAll(week);
}

export function isDataStale(locationId: number): boolean {
  const row = db
    .prepare(`select max(fetched_at) as newest from daily_weather where location_id = ?`)
    .get(locationId) as { newest: string | null };

  if (!row.newest) return true;

  const fetchedAt = new Date(row.newest.replace(" ", "T") + "Z").getTime();
  const ageMs = Date.now() - fetchedAt;
  return ageMs > config.weatherTtlHours * 60 * 60 * 1000;
}

type DailyRow = {
  date: string;
  temp_max: number | null;
  temp_min: number | null;
  precip_mm: number | null;
  snowfall_cm: number | null;
  wind_max: number | null;
  gusts_max: number | null;
  uv_max: number | null;
  sunshine_seconds: number | null;
  weather_code: number | null;
  wave_height_max: number | null;
  wave_period_max: number | null;
  swell_height_max: number | null;
  swell_period_max: number | null;
};

function rowToDay(r: DailyRow): WeatherDay {
  return {
    date: r.date,
    tempMax: r.temp_max,
    tempMin: r.temp_min,
    precipMm: r.precip_mm,
    snowfallCm: r.snowfall_cm,
    windMax: r.wind_max,
    gustsMax: r.gusts_max,
    uvMax: r.uv_max,
    sunshineSeconds: r.sunshine_seconds,
    weatherCode: r.weather_code,
    waveHeightMax: r.wave_height_max,
    wavePeriodMax: r.wave_period_max,
    swellHeightMax: r.swell_height_max,
    swellPeriodMax: r.swell_period_max,
  };
}
