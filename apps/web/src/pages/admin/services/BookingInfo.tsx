import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface BookingInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string | null;
  bookingTitle?: string;
}

export function BookingInfoModal({
  isOpen,
  onClose,
  bookingId,
  bookingTitle,
}: BookingInfoModalProps) {
  if (!isOpen || !bookingId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-lg font-semibold">Booking Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Title</p>
            <p className="text-base font-semibold">
              {bookingTitle || `Booking #${bookingId}`}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Booking ID
            </p>
            <p className="font-mono text-sm">{bookingId}</p>
          </div>

          <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            Edit booking form & actions will be placed here.
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t pt-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button disabled>Save changes</Button>
        </div>
      </div>
    </div>
  );
}
