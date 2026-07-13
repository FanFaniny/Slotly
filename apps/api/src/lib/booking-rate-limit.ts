import {
  BOOKING_RATE_LIMIT_MAX,
  BOOKING_RATE_LIMIT_WINDOW_MS,
} from "@slotly/shared/booking";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function consumeBookingRateLimit(key: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, {
      count: 1,
      resetAt: now + BOOKING_RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  if (bucket.count >= BOOKING_RATE_LIMIT_MAX) {
    return false;
  }

  bucket.count += 1;
  return true;
}

export function isBookingMutationPath(url: string) {
  return (
    url.includes("public.booking.createHold") ||
    url.includes("public.booking.confirmBooking")
  );
}

export function bookingRateLimitKey(ip: string, url: string) {
  return `${ip}:${url.split("?")[0]}`;
}
