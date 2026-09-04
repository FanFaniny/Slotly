import { useEffect } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface DeleteServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  serviceName?: string;
  isPending?: boolean;
}

export function DeleteServiceModal({
  isOpen,
  onClose,
  onConfirm,
  serviceName,
  isPending = false,
}: DeleteServiceModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isPending]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => !isPending && onClose()}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-destructive/10 p-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold">Delete Service</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="py-4 text-sm text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-foreground">
            {serviceName ? `"${serviceName}"` : "this service"}
          </span>
          ? This action cannot be undone.
        </div>

        <div className="flex justify-end gap-2 border-t pt-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
