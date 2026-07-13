import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { fromNodeHeaders } from "better-auth/node";

import { auth } from "../auth.js";

async function authHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const url = new URL(request.url, serverEnvUrl(request));
    const headers = fromNodeHeaders(request.headers);
    const hasBody = request.method !== "GET" && request.method !== "HEAD";
    const body = hasBody ? JSON.stringify(request.body ?? {}) : undefined;

    const req = new Request(url.toString(), {
      method: request.method,
      headers,
      body,
    });

    const response = await auth.handler(req);

    reply.status(response.status);
    response.headers.forEach((value, key) => {
      reply.header(key, value);
    });

    const text = await response.text();
    return reply.send(text.length > 0 ? text : null);
  } catch (error) {
    request.log.error({ err: error }, "Authentication handler failed");
    return reply.status(500).send({
      error: "Internal authentication error",
      code: "AUTH_FAILURE",
    });
  }
}

function serverEnvUrl(request: FastifyRequest) {
  const host = request.headers.host ?? "localhost:3001";
  const protocol = request.headers["x-forwarded-proto"] ?? "http";
  return `${protocol}://${host}`;
}

export async function registerAuthRoutes(server: FastifyInstance) {
  server.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    handler: authHandler,
  });

  server.get("/api/me", async (request, reply) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    return reply.send(session);
  });
}
