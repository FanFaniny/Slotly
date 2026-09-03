import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useEffect, useMemo, useRef, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { BookingInfoModal } from "@/pages/admin/services/BookingInfo";

export function CalendarPage() {
  const calendarRef = useRef<FullCalendar>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<{
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    setIsMobile(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api) {
      const targetView = isMobile ? "timeGridDay" : "timeGridWeek";
      if (api.view.type !== targetView) {
        api.changeView(targetView);
      }
    }
  }, [isMobile]);

  const [queryParams, setQueryParams] = useState<{
    rangeStart: string;
    rangeEnd: string;
  } | null>(null);

  const { data, isLoading } = trpc.admin.calendar.getEvents.useQuery(
    queryParams!,
    { enabled: !!queryParams }
  );

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

  if (isLoading && !queryParams) return <Skeleton className="h-[600px] w-full" />;

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
            const rangeStart = info.start.toISOString();
            const rangeEnd = info.end.toISOString();

            setQueryParams((prev) => {
              if (prev?.rangeStart === rangeStart && prev?.rangeEnd === rangeEnd) {
                return prev;
              }
              return { rangeStart, rangeEnd };
            });
          }}
          eventClick={(info) => {
            const { type } = info.event.extendedProps;
            if (type === "booking") {
              setSelectedBooking({
                id: info.event.id,
                title: info.event.title,
              });
            }
          }}
        />
      </div>

      <BookingInfoModal
        isOpen={!!selectedBooking}
        bookingId={selectedBooking?.id ?? null}
        bookingTitle={selectedBooking?.title}
        onClose={() => setSelectedBooking(null)}
      />
    </div>
  );
}