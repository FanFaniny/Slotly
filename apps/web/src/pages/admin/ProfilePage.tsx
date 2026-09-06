import { useEffect, useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Edit2,
  Loader2,
  Search,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { formatDuration, formatPrice } from "@/lib/utils";
import { BookingInfoModal } from "@/pages/admin/services/BookingInfo";

type StatusFilter = "all" | "confirmed" | "pending" | "completed" | "cancelled" | "no_show";

export function ProfilePage() {
  const utils = trpc.useUtils();
  const { data: master, isLoading: isMasterLoading } =
    trpc.auth.getMaster.useQuery();

  const [displayName, setDisplayName] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const dateRange = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 60);
    const end = new Date();
    end.setDate(end.getDate() + 90);
    return {
      rangeStart: start.toISOString(),
      rangeEnd: end.toISOString(),
    };
  }, []);

  const { data: bookings = [], isLoading: isBookingsLoading } =
    trpc.admin.calendar.listBookings.useQuery(dateRange, {
      enabled: !!master,
    });

  useEffect(() => {
    if (master) {
      setDisplayName(master.displayName);
    }
  }, [master]);

  const updateProfile = trpc.admin.settings.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile name updated successfully");
      utils.auth.getMaster.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    updateProfile.mutate({
      displayName: displayName.trim(),
    });
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((item) => {
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;
      const query = search.toLowerCase();
      const matchesSearch =
        !search ||
        item.client.name.toLowerCase().includes(query) ||
        (item.client.phone && item.client.phone.includes(query)) ||
        (item.client.email && item.client.email.toLowerCase().includes(query)) ||
        item.service.name.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [bookings, statusFilter, search]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default";
      case "completed":
        return "secondary";
      case "cancelled":
      case "no_show":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (isMasterLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your personal information and view your booking records
        </p>
      </div>

      {/* User Information & Name Edit */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Details</CardTitle>
          <CardDescription>
            Update your public profile display name
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveName} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <Label>Username (Handle)</Label>
                <Input value={`@${master?.username ?? ""}`} disabled readOnly />
              </div>
            </div>

            <Button
              type="submit"
              disabled={
                updateProfile.isPending || displayName === master?.displayName
              }
            >
              {updateProfile.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Bookings List & Editing */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Bookings</CardTitle>
              <CardDescription>
                View and manage client appointments
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8 text-sm"
                  placeholder="Search bookings..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              >
                <option value="all">All statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isBookingsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No bookings found matching your filters.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {item.client.name}
                      </span>
                      <Badge variant={getStatusBadgeVariant(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {new Date(item.startsAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(item.startsAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        ({formatDuration(item.service.durationMin)})
                      </span>
                      <span className="font-medium text-foreground">
                        {item.service.name} • {formatPrice(item.service.priceCents)}
                      </span>
                    </div>
                    {item.comment && (
                      <p className="pt-1 text-xs italic text-muted-foreground">
                        “{item.comment}”
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedBookingId(item.id)}
                    >
                      <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Details & Edit Modal */}
      <BookingInfoModal
        isOpen={Boolean(selectedBookingId)}
        onClose={() => setSelectedBookingId(null)}
        bookingId={selectedBookingId}
      />
    </div>
  );
}
