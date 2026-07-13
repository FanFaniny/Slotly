import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { formatDuration, formatPrice } from "@/lib/utils";

export function ServicesPage() {
  const utils = trpc.useUtils();
  const { data: services, isLoading } = trpc.admin.services.list.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    durationMin: 30,
    priceCents: 0,
  });

  const createService = trpc.admin.services.create.useMutation({
    onSuccess: () => {
      toast.success("Service created");
      utils.admin.services.list.invalidate();
      setShowForm(false);
      setForm({ name: "", description: "", durationMin: 30, priceCents: 0 });
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteService = trpc.admin.services.delete.useMutation({
    onSuccess: () => {
      toast.success("Service removed");
      utils.admin.services.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Services</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add service
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  value={form.durationMin}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      durationMin: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.priceCents / 100}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      priceCents: Math.round(Number(e.target.value) * 100),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
            </div>
            <Button
              onClick={() => createService.mutate(form)}
              disabled={!form.name || createService.isPending}
            >
              {createService.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {services?.map((service) => (
          <Card key={service.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium">{service.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDuration(service.durationMin)}
                  {service.priceCents > 0 &&
                    ` · ${formatPrice(service.priceCents)}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  deleteService.mutate({ id: service.id })
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {services?.length === 0 && (
          <p className="text-muted-foreground">No services yet.</p>
        )}
      </div>
    </div>
  );
}
