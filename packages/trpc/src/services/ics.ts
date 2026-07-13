import { createEvents, type EventAttributes } from "ics";

export interface BookingIcsInput {
  bookingId: string;
  title: string;
  description?: string;
  startsAt: Date;
  durationMin: number;
  organizerName: string;
  organizerEmail: string;
  attendeeName: string;
  attendeeEmail?: string;
}

function toIcsDateParts(date: Date): [number, number, number, number, number] {
  return [
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
  ];
}

export function buildBookingIcs(input: BookingIcsInput): string {
  const event: EventAttributes = {
    uid: `${input.bookingId}@slotly`,
    title: input.title,
    description: input.description,
    start: toIcsDateParts(input.startsAt),
    startInputType: "utc",
    duration: { minutes: input.durationMin },
    organizer: {
      name: input.organizerName,
      email: input.organizerEmail,
    },
    attendees: input.attendeeEmail
      ? [{ name: input.attendeeName, email: input.attendeeEmail, rsvp: true }]
      : undefined,
    status: "CONFIRMED",
    productId: "slotly/booking",
  };

  const { error, value } = createEvents([event]);

  if (error || !value) {
    throw error ?? new Error("ICS_GENERATION_FAILED");
  }

  return value;
}
