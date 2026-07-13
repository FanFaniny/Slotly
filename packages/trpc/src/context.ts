import type { Database } from "@slotly/db";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionContext {
  session: AuthSession;
  user: AuthUser;
}

export interface CreateContextOptions {
  db: Database;
  session: SessionContext | null;
  clientIp: string | null;
}

export function createContext({ db, session, clientIp }: CreateContextOptions) {
  return { db, session, clientIp };
}

export type Context = ReturnType<typeof createContext>;
