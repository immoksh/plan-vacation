import { db } from "./connection.js";
import type { Place } from "../types.js";

export type StoredLocation = Place & { id: number };

export function toSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s*,\s*/g, ", ") // tidy the spacing around a country hint
    .replace(/\s+/g, " "); // collapse any other runs of whitespace
}

export function findLocation(slug: string): StoredLocation | null {
  const row = db
    .prepare(
      `select id, name, country, latitude, longitude, timezone, elevation
         from locations where slug = ?`,
    )
    .get(slug) as StoredLocation | undefined;
  return row ?? null;
}

export function saveLocation(slug: string, place: Place): StoredLocation {
  return db
    .prepare(
      `insert into locations
         (slug, name, country, latitude, longitude, timezone, elevation, updated_at)
       values
         (@slug, @name, @country, @latitude, @longitude, @timezone, @elevation, datetime('now'))
       on conflict(slug) do update set
         name = excluded.name,
         country = excluded.country,
         latitude = excluded.latitude,
         longitude = excluded.longitude,
         timezone = excluded.timezone,
         elevation = excluded.elevation,
         updated_at = datetime('now')
       returning id, name, country, latitude, longitude, timezone, elevation`,
    )
    .get({ slug, ...place }) as StoredLocation;
}
