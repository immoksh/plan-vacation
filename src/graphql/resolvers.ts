import { GraphQLError } from "graphql";
import { loadForecast } from "../forecast.js";
import { rankTheWeek } from "../scoring/rankTheWeek.js";
import { toSlug } from "../db/locations.js";
import { readCached, writeCached } from "../cache/memoryCache.js";
import { config } from "../config.js";
import type { PlaceForecast } from "../types.js";

// Cache the finished ranking for about as long as the weather stays fresh.
const cacheTtlSeconds = config.weatherTtlHours * 60 * 60;

export const resolvers = {
  Query: {
    vacationForecast: async (_parent: unknown, args: { place: string }): Promise<PlaceForecast> => {
      const place = args.place.trim();
      if (!place) {
        throw new GraphQLError("Please give me a town or city name.");
      }

      // Serve a recent answer straight from the cache when we have one.
      const cacheKey = `forecast:${toSlug(place)}`;
      const cached = readCached<PlaceForecast>(cacheKey);
      if (cached) return cached;

      const forecast = await loadForecast(place);
      if (!forecast) {
        throw new GraphQLError(`Couldn't find anywhere called "${place}".`, {
          extensions: { code: "PLACE_NOT_FOUND" },
        });
      }

      const result: PlaceForecast = {
        place: forecast.location,
        activities: rankTheWeek(forecast.days),
      };

      writeCached(cacheKey, result, cacheTtlSeconds);
      return result;
    },
  },
};
