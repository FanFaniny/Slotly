import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

export function CalendarPage() {
  const utils = trpc.useUtils();
  const calendarRef = useRef<FullCalendar>(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      <div className="rounded-lg border bg-card p-2 shadow-sm sm:p-4 [&_.fc-header-toolbar]:flex-wrap [&_.fc-header-toolbar]:gap-2 [&_.fc-toolbar-title]:text-base sm:[&_.fc-toolbar-title]:text-xl [&_.fc-button]:px-2.5 [&_.fc-button]:py-1 [&_.fc-button]:text-xs sm:[&_.fc-button]:text-sm">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={isMobile ? "timeGridDay" : "timeGridWeek"}
          headerToolbar={
            isMobile
              ? {
                  left: "prev,next today",
                  center: "title",
                  right: "timeGridDay,dayGridMonth",
                }
              : {
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                }
          }
          events={events}
          height="auto"
          handleWindowResize={true}
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
    </div>
  );
}
