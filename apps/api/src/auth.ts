import { getDb } from "@slotly/db";
import * as schema from "@slotly/db/schema";
import { serverEnv } from "@slotly/shared/env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";

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
  
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const isPasswordAction =
        ctx.path === "/sign-up/email" ||
        ctx.path === "/change-password" ||
        ctx.path === "/reset-password";

      if (isPasswordAction && ctx.body) {
        const password =
          (ctx.body as { password?: string; newPassword?: string }).password ||
          (ctx.body as { password?: string; newPassword?: string }).newPassword;

        if (typeof password === "string") {
          const hasUpperCase = /[A-Z]/.test(password);
          const hasDigit = /\d/.test(password);

          if (!hasUpperCase || !hasDigit) {
            throw new APIError("BAD_REQUEST", {
              message:
                "Пароль должен содержать хотя бы одну заглавную букву и одну цифру.",
            });
          }
        }
      }
    }),
  },
  databaseHooks: {
  user: {
    create: {
      after: async (user) => {
        try {
          await ensureMasterProfile(db, user);
        } catch (error) {
          console.error(`Не удалось создать MasterProfile для ${user.id}:`, error);
        }
      },
    },
  },
}
});

export type Auth = typeof auth;