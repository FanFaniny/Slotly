import { useEffect, useState } from "react";
import { Mail, Phone, User, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatDuration, formatPrice } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

interface BookingInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string | null;
  bookingTitle?: string;
}

const statusOptions: { label: string; value: BookingStatus }[] = [
  { label: "Confirmed", value: "confirmed" },
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "No Show", value: "no_show" },
];

export function BookingInfoModal({
  isOpen,
  onClose,
  bookingId,
  bookingTitle,
}: BookingInfoModalProps) {
  const utils = trpc.useUtils();

  const { data: booking, isLoading } = trpc.admin.calendar.getBooking.useQuery(
    { id: bookingId ?? "" },
    { enabled: isOpen && !!bookingId },
  );

  const [status, setStatus] = useState<BookingStatus>("confirmed");
  const [comment, setComment] = useState("");
  const [notifyClient, setNotifyClient] = useState(false);

  useEffect(() => {
    if (booking) {
      setStatus(booking.status as BookingStatus);
      setComment(booking.comment ?? "");
      setNotifyClient(Boolean(booking.client.email));
    }
  }, [booking]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const updateMutation = trpc.admin.calendar.updateBooking.useMutation({
    onSuccess: () => {
      utils.admin.calendar.getEvents.invalidate();
      utils.admin.calendar.listBookings.invalidate();
      if (bookingId) {
        utils.admin.calendar.getBooking.invalidate({ id: bookingId });
      }
      onClose();
    },
  });

  if (!isOpen || !bookingId) return null;

  const handleSave = () => {
    updateMutation.mutate({
      bookingId,
      status,
      comment: comment || null,
      notifyClient,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h2 className="text-lg font-semibold">
              {bookingTitle || "Booking Details"}
            </h2>
            {booking && (
              <p className="text-xs text-muted-foreground">
                {new Date(booking.startsAt).toLocaleString()}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading || !booking ? (
          <div className="space-y-4 py-6">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="space-y-5 py-4">
            {/* Client Info */}
            <div className="space-y-1.5 rounded-md border bg-muted/30 p-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Client Information
              </p>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{booking.client.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{booking.client.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{booking.client.email || "No email provided"}</span>
              </div>
            </div>

            {/* Service Info */}
            <div className="flex items-center justify-between rounded-md border p-3 text-sm">
              <div>
                <p className="font-medium">{booking.service.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDuration(booking.service.durationMin)}
                </p>
              </div>
              <Badge variant="outline">
                {formatPrice(booking.service.priceCents)}
              </Badge>
            </div>

            {/* Status Selection */}
            <div className="space-y-1.5">
              <label htmlFor="booking-status" className="text-sm font-medium">
                Status
              </label>
              <select
                id="booking-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as BookingStatus)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes / Comment */}
            <div className="space-y-1.5">
              <label htmlFor="booking-comment" className="text-sm font-medium">
                Notes / Comment
              </label>
              <Textarea
                id="booking-comment"
                placeholder="Add notes about this booking..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>

            {/* Email Notification Option */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="notifyClient"
                checked={notifyClient}
                disabled={!booking.client.email}
                onChange={(e) => setNotifyClient(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label
                htmlFor="notifyClient"
                className={`text-sm ${
                  !booking.client.email
                    ? "cursor-not-allowed text-muted-foreground"
                    : "cursor-pointer"
                }`}
              >
                Send notification email to client
                {!booking.client.email && " (no email available)"}
              </label>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t pt-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || updateMutation.isPending}
          >
            {updateMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
