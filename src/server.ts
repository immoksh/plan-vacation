import { createServer } from "node:http";
import { createYoga, createSchema } from "graphql-yoga";
import { config } from "./config.js";

// server to prove GraphQL Yoga boots.
const schema = createSchema({
  typeDefs: `
    type Query {
      hello: String!
    }
  `,
  resolvers: {
    Query: {
      hello: () => "the vacation ranker is up",
    },
  },
});

const yoga = createYoga({ schema });

// Added a health check route
const server = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  yoga(req, res);
});

server.listen(config.port, () => {
  console.log(`GraphQL ready at http://localhost:${config.port}${yoga.graphqlEndpoint}`);
});
