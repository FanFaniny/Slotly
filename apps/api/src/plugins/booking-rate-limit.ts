import type { FastifyInstance } from "fastify";

import {
  bookingRateLimitKey,
  consumeBookingRateLimit,
  isBookingMutationPath,
} from "../lib/booking-rate-limit.js";

export async function registerBookingRateLimit(server: FastifyInstance) {
  server.addHook("preHandler", async (request, reply) => {
    const url = request.url;

    if (!isBookingMutationPath(url)) {
      return;
    }

    const key = bookingRateLimitKey(request.ip, url);

    if (!consumeBookingRateLimit(key)) {
      return reply.status(429).send({
        error: "Too Many Requests",
        code: "BOOKING_RATE_LIMIT",
      });
    }
  });
}
