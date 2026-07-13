import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

export function CalendarPage() {
  const utils = trpc.useUtils();

  const [queryParams, setQueryParams] = useState({
    rangeStart: new Date().toISOString(),
    rangeEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
  });

  const { data, isLoading } = trpc.admin.calendar.getEvents.useQuery(
    queryParams,
  );

  const updateStatus = trpc.admin.calendar.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Booking updated");
      utils.admin.calendar.getEvents.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const events = useMemo(() => {
    if (!data) return [];
    const bookingEvents = data.bookings.map((b) => ({
      id: b.id,
      title: b.title,
      start: b.startsAt,
      end: b.endsAt,
      backgroundColor: "#3b82f6",
      extendedProps: { type: "booking", status: b.status },
    }));
    const blockedEvents = data.blocked.map((b) => ({
      id: b.id,
      title: b.title,
      start: b.startsAt,
      end: b.endsAt,
      backgroundColor: "#9ca3af",
      extendedProps: { type: "blocked" },
    }));
    return [...bookingEvents, ...blockedEvents];
  }, [data]);

  if (isLoading) return <Skeleton className="h-[600px] w-full" />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Calendar</h1>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        height="auto"
        datesSet={(info) => {
          setQueryParams({
            rangeStart: info.start.toISOString(),
            rangeEnd: info.end.toISOString(),
          });
        }}
        eventClick={(info) => {
          const status = info.event.extendedProps.status;
          if (status === "confirmed") {
            updateStatus.mutate({
              bookingId: info.event.id,
              status: "cancelled",
            });
          }
        }}
      />
    </div>
  );
}
