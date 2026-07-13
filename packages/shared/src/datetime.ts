import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

export { dayjs };

export const toUTC = (local: string, tz: string) =>
  dayjs.tz(local, tz).utc().toISOString();

export const formatSlot = (utcIso: string, tz: string) =>
  dayjs.utc(utcIso).tz(tz).format("HH:mm");

export const holdExpiresIn = (expiresAt: string) =>
  Math.max(0, dayjs.utc(expiresAt).diff(dayjs.utc(), "second"));
