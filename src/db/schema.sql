-- Tables for the vacation ranking service.

-- Location which we already fetched, we get geocode from db.
CREATE TABLE IF NOT EXISTS locations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT UNIQUE NOT NULL,          
  name        TEXT NOT NULL,                
  country     TEXT,
  latitude    REAL NOT NULL,
  longitude   REAL NOT NULL,
  timezone    TEXT,
  elevation   REAL,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- It will use one row per day per location of the forecast.
CREATE TABLE IF NOT EXISTS daily_weather (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id       INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  date              TEXT NOT NULL,           -- forecast day, YYYY-MM-DD
  temp_max          REAL,
  temp_min          REAL,
  precip_mm         REAL,
  snowfall_cm       REAL,
  wind_max          REAL,
  gusts_max         REAL,
  uv_max            REAL,
  sunshine_seconds  REAL,
  weather_code      INTEGER,
  wave_height_max   REAL,
  wave_period_max   REAL,
  swell_height_max  REAL,
  swell_period_max  REAL,
  fetched_at        TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (location_id, date)
);

CREATE INDEX IF NOT EXISTS daily_weather_location_fetched
  ON daily_weather (location_id, fetched_at);
