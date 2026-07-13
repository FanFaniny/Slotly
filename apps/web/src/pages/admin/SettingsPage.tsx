import type { BookingFormField } from "@slotly/shared";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

const FIELD_TYPES = [
  "text",
  "email",
  "phone",
  "textarea",
  "select",
  "checkbox",
] as const;

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function FormFieldBuilder({
  fields,
  onChange,
}: {
  fields: BookingFormField[];
  onChange: (fields: BookingFormField[]) => void;
}) {
  const addField = () => {
    onChange([
      ...fields,
      {
        id: `field_${Date.now()}`,
        type: "text",
        label: "New field",
        required: false,
      },
    ]);
  };

  const updateField = (index: number, updates: Partial<BookingFormField>) => {
    const next = [...fields];
    next[index] = { ...next[index]!, ...updates };
    onChange(next);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="flex items-start gap-2 rounded-md border p-3"
        >
          <div className="grid flex-1 gap-2 sm:grid-cols-3">
            <Input
              value={field.label}
              onChange={(e) =>
                updateField(index, { label: e.target.value })
              }
              placeholder="Label"
            />
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={field.type}
              onChange={(e) =>
                updateField(index, {
                  type: e.target.value as BookingFormField["type"],
                })
              }
            >
              {FIELD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={field.required ?? false}
                onChange={(e) =>
                  updateField(index, { required: e.target.checked })
                }
              />
              Required
            </label>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeField(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addField}>
        <Plus className="mr-2 h-4 w-4" />
        Add field
      </Button>
    </div>
  );
}

export function SettingsPage() {
  const utils = trpc.useUtils();
  const { data: master, isLoading } = trpc.auth.getMaster.useQuery();
  const { data: schedule } = trpc.admin.settings.getWorkSchedule.useQuery(
    undefined,
    { enabled: !!master },
  );

  const [profile, setProfile] = useState({
    displayName: "",
    timezone: "UTC",
    avatarUrl: "",
  });
  const [settings, setSettings] = useState({
    bufferMin: 0,
    minAdvanceHours: 1,
    horizonDays: 30,
  });
  const [formFields, setFormFields] = useState<BookingFormField[]>([]);
  const [workBlocks, setWorkBlocks] = useState<
    { dayOfWeek: number; startTime: string; endTime: string }[]
  >([]);

  useEffect(() => {
    if (master) {
      setProfile({
        displayName: master.displayName,
        timezone: master.timezone,
        avatarUrl: master.avatarUrl ?? "",
      });
      if (master.settings) {
        setSettings({
          bufferMin: master.settings.bufferMin,
          minAdvanceHours: master.settings.minAdvanceHours,
          horizonDays: master.settings.horizonDays,
        });
        setFormFields(master.settings.bookingFormSchema);
      }
    }
  }, [master]);

  useEffect(() => {
    if (schedule) {
      setWorkBlocks(
        schedule.map((b) => ({
          dayOfWeek: b.dayOfWeek,
          startTime: b.startTime.slice(0, 5),
          endTime: b.endTime.slice(0, 5),
        })),
      );
    }
  }, [schedule]);

  const updateProfile = trpc.admin.settings.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated");
      utils.auth.getMaster.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateSettings = trpc.admin.settings.updateSettings.useMutation({
    onSuccess: () => toast.success("Settings updated"),
    onError: (err) => toast.error(err.message),
  });

  const updateFormSchema = trpc.admin.settings.updateFormSchema.useMutation({
    onSuccess: () => toast.success("Form fields saved"),
    onError: (err) => toast.error(err.message),
  });

  const replaceSchedule = trpc.admin.settings.replaceWorkSchedule.useMutation({
    onSuccess: () => toast.success("Schedule saved"),
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  const toggleDay = (day: number) => {
    const existing = workBlocks.find((b) => b.dayOfWeek === day);
    if (existing) {
      setWorkBlocks(workBlocks.filter((b) => b.dayOfWeek !== day));
    } else {
      setWorkBlocks([
        ...workBlocks,
        { dayOfWeek: day, startTime: "09:00", endTime: "17:00" },
      ]);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Your public booking page info</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Display name</Label>
            <Input
              value={profile.displayName}
              onChange={(e) =>
                setProfile({ ...profile, displayName: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Input
              value={profile.timezone}
              onChange={(e) =>
                setProfile({ ...profile, timezone: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Avatar URL</Label>
            <Input
              value={profile.avatarUrl}
              onChange={(e) =>
                setProfile({ ...profile, avatarUrl: e.target.value })
              }
              placeholder="https://… (UploadThing URL)"
            />
          </div>
          <Button
            onClick={() =>
              updateProfile.mutate({
                displayName: profile.displayName,
                timezone: profile.timezone,
                avatarUrl: profile.avatarUrl || null,
              })
            }
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save profile
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Booking settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Buffer (min)</Label>
            <Input
              type="number"
              value={settings.bufferMin}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  bufferMin: Number(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Min advance (hours)</Label>
            <Input
              type="number"
              value={settings.minAdvanceHours}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  minAdvanceHours: Number(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Horizon (days)</Label>
            <Input
              type="number"
              value={settings.horizonDays}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  horizonDays: Number(e.target.value),
                })
              }
            />
          </div>
          <Button
            className="sm:col-span-3"
            onClick={() => updateSettings.mutate(settings)}
            disabled={updateSettings.isPending}
          >
            Save settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Work schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day, i) => {
              const active = workBlocks.some((b) => b.dayOfWeek === i);
              return (
                <Button
                  key={day}
                  variant={active ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleDay(i)}
                >
                  {day}
                </Button>
              );
            })}
          </div>
          {workBlocks.map((block) => (
            <div key={block.dayOfWeek} className="flex items-center gap-2">
              <span className="w-10 text-sm font-medium">
                {DAYS[block.dayOfWeek]}
              </span>
              <Input
                type="time"
                value={block.startTime}
                onChange={(e) =>
                  setWorkBlocks(
                    workBlocks.map((b) =>
                      b.dayOfWeek === block.dayOfWeek
                        ? { ...b, startTime: e.target.value }
                        : b,
                    ),
                  )
                }
              />
              <span>–</span>
              <Input
                type="time"
                value={block.endTime}
                onChange={(e) =>
                  setWorkBlocks(
                    workBlocks.map((b) =>
                      b.dayOfWeek === block.dayOfWeek
                        ? { ...b, endTime: e.target.value }
                        : b,
                    ),
                  )
                }
              />
            </div>
          ))}
          <Button
            onClick={() => replaceSchedule.mutate({ blocks: workBlocks })}
            disabled={replaceSchedule.isPending}
          >
            Save schedule
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Custom form fields</CardTitle>
          <CardDescription>
            Extra fields shown on the booking form
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormFieldBuilder fields={formFields} onChange={setFormFields} />
          <Button
            onClick={() => updateFormSchema.mutate({ schema: formFields })}
            disabled={updateFormSchema.isPending}
          >
            Save form fields
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
