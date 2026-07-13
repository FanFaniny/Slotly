import { eq } from "drizzle-orm";
import type { Database } from "@slotly/db";
import { masterSettings, masters } from "@slotly/db/schema";

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

function slugifyUsername(email: string) {
  const base = email
    .split("@")[0]
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base && base.length >= 3 ? base.slice(0, 32) : "master";
}

async function uniqueUsername(db: Database, base: string) {
  let candidate = base;
  let suffix = 1;

  while (true) {
    const existing = await db.query.masters.findFirst({
      where: eq(masters.username, candidate),
      columns: { id: true },
    });

    if (!existing) return candidate;

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function ensureMasterProfile(db: Database, user: AuthUser) {
  const existing = await db.query.masters.findFirst({
    where: eq(masters.userId, user.id),
    with: { settings: true },
  });

  if (existing) return existing;

  const username = await uniqueUsername(db, slugifyUsername(user.email));

  const [master] = await db
    .insert(masters)
    .values({
      userId: user.id,
      email: user.email,
      username,
      displayName: user.name,
    })
    .returning();

  if (!master) {
    throw new Error("Failed to create master profile");
  }

  await db.insert(masterSettings).values({
    masterId: master.id,
  });

  // Default Mon-Fri 9-17 schedule
  const { workScheduleBlocks } = await import("@slotly/db/schema");
  await db.insert(workScheduleBlocks).values(
    [1, 2, 3, 4, 5].map((dayOfWeek) => ({
      masterId: master.id,
      dayOfWeek,
      startTime: "09:00:00",
      endTime: "17:00:00",
      isActive: true,
    })),
  );

  // Default service
  const { services } = await import("@slotly/db/schema");
  await db.insert(services).values({
    masterId: master.id,
    name: "Consultation",
    durationMin: 30,
    priceCents: 0,
    sortOrder: 0,
  });

  return db.query.masters.findFirst({
    where: eq(masters.id, master.id),
    with: { settings: true },
  });
}
