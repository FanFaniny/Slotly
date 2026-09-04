import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';

export interface ServiceItem {
  id: string;
  name: string;
  description?: string | null;
  durationMin: number;
  priceCents: number;
  isActive?: boolean;
}

interface ServiceInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: ServiceItem | null;
}

export function ServiceInfoModal({
  isOpen,
  onClose,
  service,
}: ServiceInfoModalProps) {
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    name: '',
    description: '',
    durationMin: 30,
    priceCents: 0,
    isActive: true,
  });

  useEffect(() => {
    if (service) {
      setForm({
        name: service.name,
        description: service.description ?? '',
        durationMin: service.durationMin,
        priceCents: service.priceCents,
        isActive: service.isActive ?? true,
      });
    }
  }, [service]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const updateMutation = trpc.admin.services.update.useMutation({
    onSuccess: () => {
      toast.success('Service updated');
      utils.admin.services.list.invalidate();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  if (!isOpen || !service) return null;

  const handleSave = () => {
    updateMutation.mutate({
      id: service.id,
      name: form.name,
      description: form.description || undefined,
      durationMin: form.durationMin,
      priceCents: form.priceCents,
      isActive: form.isActive,
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
            <h2 className="text-lg font-semibold">{service.name}</h2>
            <p className="text-xs text-muted-foreground">Service details</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="service-name">Name</Label>
            <Input
              id="service-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="service-duration">Duration (min)</Label>
              <Input
                id="service-duration"
                type="number"
                min={1}
                value={form.durationMin}
                onChange={(e) =>
                  setForm({ ...form, durationMin: Number(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-price">Price ($)</Label>
              <Input
                id="service-price"
                type="number"
                step="0.01"
                min={0}
                value={form.priceCents / 100}
                onChange={(e) =>
                  setForm({
                    ...form,
                    priceCents: Math.round(Number(e.target.value) * 100),
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service-description">Description</Label>
            <Textarea
              id="service-description"
              placeholder="Add description..."
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="service-is-active"
              checked={form.isActive}
              onChange={(e) =>
                setForm({ ...form, isActive: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label
              htmlFor="service-is-active"
              className="cursor-pointer text-sm font-medium"
            >
              Active (available for booking)
            </label>
          </div>
        </div>

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
            disabled={!form.name || updateMutation.isPending}
          >
            {updateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
