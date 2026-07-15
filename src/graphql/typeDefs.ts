export const typeDefs = /* GraphQL */ `
  type Query {
    "Rank the next 7 days in a town or city for each activity."
    vacationForecast(place: String!): PlaceForecast
  }

  type PlaceForecast {
    place: ResolvedPlace!
    activities: [ActivityRanking!]!
  }

  type ResolvedPlace {
    name: String!
    country: String
    latitude: Float!
    longitude: Float!
    timezone: String
  }

  type ActivityRanking {
    activity: Activity!
    bestDay: DayScore
    days: [DayScore!]!
  }

  type DayScore {
    date: String!
    score: Int!
    rank: Int!
    reason: String
  }

  enum Activity {
    SKIING
    SURFING
    OUTDOOR_SIGHTSEEING
    INDOOR_SIGHTSEEING
  }
`;
