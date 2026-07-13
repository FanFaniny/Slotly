import { formatSlot } from "@slotly/shared";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

interface SlotGridProps {
  username: string;
  serviceId: string;
  date: string;
  timezone: string;
  selectedSlot: string | null;
  onSelect: (slot: string) => void;
  isCreatingHold: boolean;
}

export function SlotGrid({
  username,
  serviceId,
  date,
  timezone,
  selectedSlot,
  onSelect,
  isCreatingHold,
}: SlotGridProps) {
  const { data, isLoading, error } =
    trpc.public.availability.getSlots.useQuery({
      username,
      serviceId,
      date,
    });

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error.message}</p>;
  }

  if (!data?.slots.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No available slots for this date.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {data.slots.map((slot) => {
        const label = formatSlot(slot.startsAt, timezone);
        const isSelected = selectedSlot === slot.startsAt;
        return (
          <Button
            key={slot.startsAt}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            disabled={isCreatingHold}
            onClick={() => onSelect(slot.startsAt)}
          >
            {isCreatingHold && isSelected ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              label
            )}
          </Button>
        );
      })}
    </div>
  );
}
