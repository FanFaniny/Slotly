import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const serverEnv = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),
    API_PORT: z.coerce.number().default(3001),
    API_HOST: z.string().default("0.0.0.0"),
    CORS_ORIGIN: z.string().url(),
    RESEND_API_KEY: z.string().optional(),
    SENTRY_DSN: z.string().url().optional(),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
