import fastify from "fastify";

const server = fastify({
  logger: true,
});

const PORT = process.env.PORT || 3000;

server.get("/", async (request, reply) => {
  return { hello: "world" };
});

server.listen({ port: PORT }, (err, address) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
  server.log.info(`Server listening at ${address}`);
});
