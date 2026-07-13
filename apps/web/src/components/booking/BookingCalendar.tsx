import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

interface BookingCalendarProps {
  username: string;
  serviceId: string;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

export function BookingCalendar({
  username,
  serviceId,
  selectedDate,
  onSelectDate,
}: BookingCalendarProps) {
  const { data, isLoading } = trpc.public.availability.getDates.useQuery({
    username,
    serviceId,
  });

  if (isLoading) return <Skeleton className="h-[300px] w-full max-w-sm" />;

  const availableDates = new Set(data?.dates ?? []);
  const selected = selectedDate ? new Date(selectedDate + "T12:00:00") : undefined;

  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={(date) => {
        if (date) {
          const iso = date.toISOString().slice(0, 10);
          onSelectDate(iso);
        }
      }}
      disabled={(date) => {
        const iso = date.toISOString().slice(0, 10);
        return !availableDates.has(iso);
      }}
      className="rounded-md border p-3"
    />
  );
}
