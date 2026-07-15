import { createServer } from "node:http";
import { createYoga, createSchema } from "graphql-yoga";
import { config } from "./config.js";
import { typeDefs } from "./graphql/typeDefs.js";
import { resolvers } from "./graphql/resolvers.js";

const schema = createSchema({ typeDefs, resolvers });
const yoga = createYoga({ schema });

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
