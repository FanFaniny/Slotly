import { zodResolver } from "@hookform/resolvers/zod";
import { buildBookingZodSchema, type BookingFormField } from "@slotly/shared";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface DynamicBookingFormProps {
  customFields: BookingFormField[];
  onSubmit: (data: {
    name: string;
    phone: string;
    email?: string;
    comment?: string;
    customFieldValues: Record<string, string | boolean | number>;
  }) => void;
  isSubmitting: boolean;
}

export function DynamicBookingForm({
  customFields,
  onSubmit,
  isSubmitting,
}: DynamicBookingFormProps) {
  const schema = buildBookingZodSchema(customFields);
  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleFormSubmit = (data: FormData) => {
    const { name, phone, email, comment, ...rest } = data;
    onSubmit({
      name: name as string,
      phone: phone as string,
      email: email as string | undefined,
      comment: comment as string | undefined,
      customFieldValues: rest as Record<string, string | boolean | number>,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input id="name" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-destructive">{String(errors.name.message)}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone *</Label>
        <Input id="phone" type="tel" {...register("phone")} />
        {errors.phone && (
          <p className="text-sm text-destructive">{String(errors.phone.message)}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email && (
          <p className="text-sm text-destructive">{String(errors.email.message)}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">Comment</Label>
        <Textarea id="comment" {...register("comment")} />
      </div>

      {customFields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id}>
            {field.label}
            {field.required ? " *" : ""}
          </Label>
          {field.type === "textarea" ? (
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              {...register(field.id)}
            />
          ) : field.type === "checkbox" ? (
            <input
              id={field.id}
              type="checkbox"
              className="h-4 w-4"
              {...register(field.id)}
            />
          ) : field.type === "select" && field.options ? (
            <select
              id={field.id}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register(field.id)}
            >
              <option value="">Select…</option>
              {field.options.map((opt: { label: string; value: string }) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id={field.id}
              type={field.type === "email" ? "email" : "text"}
              placeholder={field.placeholder}
              {...register(field.id)}
            />
          )}
          {errors[field.id] && (
            <p className="text-sm text-destructive">
              {String(errors[field.id]?.message)}
            </p>
          )}
        </div>
      ))}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Confirming…
          </>
        ) : (
          "Confirm booking"
        )}
      </Button>
    </form>
  );
}
