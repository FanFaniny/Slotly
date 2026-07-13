import { getDb } from "@slotly/db";
import { serverEnv } from "@slotly/shared/env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@slotly/db/schema";

import { ensureMasterProfile } from "./services/onboarding.js";

const db = getDb(serverEnv.DATABASE_URL);

export const auth = betterAuth({
  secret: serverEnv.BETTER_AUTH_SECRET,
  baseURL: serverEnv.BETTER_AUTH_URL,
  trustedOrigins: [serverEnv.CORS_ORIGIN],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  advanced: {
    cookiePrefix: "slotly",
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: serverEnv.NODE_ENV === "production",
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await ensureMasterProfile(db, user);
        },
      },
    },
  },
});

export type Auth = typeof auth;
