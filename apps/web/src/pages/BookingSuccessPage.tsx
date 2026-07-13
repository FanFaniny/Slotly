import { formatSlot } from "@slotly/shared";
import { AddToCalendarButton } from "add-to-calendar-button-react";
import { CheckCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BookingSuccessState {
  booking: {
    bookingId: string;
    startsAt: string;
    endsAt: string;
    master: { displayName: string; username: string; timezone: string };
    service: { name: string; durationMin: number };
    client: { name: string };
    ics: string;
  };
}

export function BookingSuccessPage() {
  const location = useLocation();
  const state = location.state as BookingSuccessState | null;

  if (!state?.booking) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">No booking data found.</p>
        <Button asChild className="mt-4">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    );
  }

  const { booking } = state;
  const startDate = new Date(booking.startsAt);
  const endDate = new Date(booking.endsAt);

  return (
    <div className="mx-auto max-w-md space-y-6 text-center">
      <CheckCircle className="mx-auto h-16 w-16 text-green-500" />

      <div>
        <h1 className="text-2xl font-bold">Booking confirmed!</h1>
        <p className="text-muted-foreground">
          Thank you, {booking.client.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{booking.service.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>With:</strong> {booking.master.displayName}
          </p>
          <p>
            <strong>When:</strong>{" "}
            {formatSlot(booking.startsAt, booking.master.timezone)}
          </p>
          <p>
            <strong>Duration:</strong> {booking.service.durationMin} min
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <AddToCalendarButton
          name={`${booking.service.name} — ${booking.master.displayName}`}
          startDate={startDate.toISOString().slice(0, 10)}
          startTime={startDate.toISOString().slice(11, 16)}
          endDate={endDate.toISOString().slice(0, 10)}
          endTime={endDate.toISOString().slice(11, 16)}
          timeZone={booking.master.timezone}
          options={["Google", "Apple", "Outlook.com"]}
          buttonStyle="default"
          lightMode="bodyScheme"
        />
      </div>

      <Button variant="outline" asChild>
        <Link to={`/${booking.master.username}`}>Book another</Link>
      </Button>
    </div>
  );
}
