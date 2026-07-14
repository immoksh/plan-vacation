import "dotenv/config";

// Read all env variables from one place.
export const config = {
  port: Number(process.env.PORT ?? 4000),
  dbFile: process.env.DB_FILE ?? "vacation.db",
  weatherTtlHours: Number(process.env.WEATHER_TTL_HOURS ?? 3),
};
