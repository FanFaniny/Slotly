import { formatSlot } from "@slotly/shared";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { DynamicBookingForm } from "@/components/booking/DynamicBookingForm";
import { HoldCountdown } from "@/components/booking/HoldCountdown";
import { SlotGrid } from "@/components/booking/SlotGrid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { formatDuration, formatPrice } from "@/lib/utils";
import { useBookingStore } from "@/stores/booking-store";

export function BookingPage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const store = useBookingStore();

  const { data: profile, isLoading, error } =
    trpc.public.profile.getMasterProfile.useQuery(
      { username: username! },
      { enabled: !!username },
    );

  const createHold = trpc.public.booking.createHold.useMutation({
    onSuccess: (data) => {
      store.setSlot(
        store.selectedDate!,
        data.startsAt,
        data.holdId,
        data.expiresAt,
      );
    },
    onError: (err) => toast.error(err.message),
  });

  const confirmBooking = trpc.public.booking.confirmBooking.useMutation({
    onSuccess: (data) => {
      navigate(`/${username}/success`, {
        state: { booking: data },
      });
      store.reset();
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-semibold">Page not found</h2>
        <p className="text-muted-foreground">This booking page does not exist.</p>
      </div>
    );
  }

  const selectedService = profile.services.find(
    (s) => s.id === store.serviceId,
  );

  const handleSlotSelect = (slot: string) => {
    if (!store.serviceId || !store.selectedDate) return;
    createHold.mutate({
      username: username!,
      serviceId: store.serviceId,
      startsAt: slot,
    });
  };

  const handleHoldExpired = () => {
    toast.error("Your hold has expired. Please select a new time slot.");
    store.setStep(2);
  };

  const steps = ["Service", "Date & Time", "Your Details"];

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{profile.displayName}</h1>
        <p className="text-muted-foreground">Book an appointment</p>
      </div>

      <div className="flex justify-center gap-2">
        {steps.map((label, i) => (
          <Badge
            key={label}
            variant={store.step === i + 1 ? "default" : "secondary"}
          >
            {i + 1}. {label}
          </Badge>
        ))}
      </div>

      {store.step === 1 && (
        <div className="space-y-3">
          {profile.services.map((service) => (
            <Card
              key={service.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => store.setService(service.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{service.name}</CardTitle>
                {service.description && (
                  <CardDescription>{service.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex gap-3 text-sm text-muted-foreground">
                <span>{formatDuration(service.durationMin)}</span>
                {service.priceCents > 0 && (
                  <span>{formatPrice(service.priceCents)}</span>
                )}
              </CardContent>
            </Card>
          ))}
          {profile.services.length === 0 && (
            <p className="text-center text-muted-foreground">
              No services available yet.
            </p>
          )}
        </div>
      )}

      {store.step === 2 && selectedService && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => store.setStep(1)}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {selectedService.name}
          </Button>

          <BookingCalendar
            username={username!}
            serviceId={store.serviceId!}
            selectedDate={store.selectedDate}
            onSelectDate={(date) =>
              useBookingStore.setState({ selectedDate: date, selectedSlot: null })
            }
          />

          {store.selectedDate && (
            <div>
              <h3 className="mb-2 text-sm font-medium">Available times</h3>
              <SlotGrid
                username={username!}
                serviceId={store.serviceId!}
                date={store.selectedDate}
                timezone={profile.timezone}
                selectedSlot={store.selectedSlot}
                onSelect={handleSlotSelect}
                isCreatingHold={createHold.isPending}
              />
            </div>
          )}
        </div>
      )}

      {store.step === 3 && store.holdId && store.expiresAt && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => store.setStep(2)}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <HoldCountdown
              expiresAt={store.expiresAt}
              onExpired={handleHoldExpired}
            />
          </div>

          {selectedService && store.selectedSlot && (
            <Card>
              <CardContent className="pt-4">
                <p className="font-medium">{selectedService.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatSlot(store.selectedSlot, profile.timezone)}
                </p>
              </CardContent>
            </Card>
          )}

          <DynamicBookingForm
            customFields={profile.bookingFormSchema}
            isSubmitting={confirmBooking.isPending}
            onSubmit={(data) =>
              confirmBooking.mutate({
                holdId: store.holdId!,
                ...data,
              })
            }
          />
        </div>
      )}
    </div>
  );
}
