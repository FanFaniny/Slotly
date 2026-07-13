import type { FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { getDb } from "@slotly/db";
import { serverEnv } from "@slotly/shared/env";
import { appRouter, createContext } from "@slotly/trpc";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { fromNodeHeaders } from "better-auth/node";
import Fastify from "fastify";

import { auth } from "./auth.js";
import { registerBookingRateLimit } from "./plugins/booking-rate-limit.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { initSentry } from "./services/sentry.js";

await initSentry();

const server = Fastify({
  logger: true,
  routerOptions: {
    maxParamLength: 5000,
  },
});

await server.register(cors, {
  origin: serverEnv.CORS_ORIGIN,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
});

await server.register(rateLimit, {
  global: true,
  max: 100,
  timeWindow: "1 minute",
});

const db = getDb(serverEnv.DATABASE_URL);

await registerAuthRoutes(server);
await registerBookingRateLimit(server);

await server.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: {
    router: appRouter,
    createContext: async ({ req }: { req: FastifyRequest }) => {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      return createContext({
        db,
        session,
        clientIp: req.ip ?? null,
      });
    },
  },
});

server.get("/health", async () => ({
  status: "ok",
  service: "slotly-api",
}));

const port = serverEnv.API_PORT;
const host = serverEnv.API_HOST;

try {
  await server.listen({ port, host });
  server.log.info(`API listening on http://${host}:${port}`);
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
