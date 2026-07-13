import { z } from "zod";

export type FormFieldType =
  | "text"
  | "email"
  | "phone"
  | "textarea"
  | "select"
  | "checkbox";

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface BookingFormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: FormFieldOption[];
}

export function buildBookingZodSchema(fields: BookingFormField[]) {
  const shape: Record<string, z.ZodTypeAny> = {
    name: z.string().min(1, "Name is required").max(120),
    phone: z.string().min(3, "Phone is required").max(32),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    comment: z.string().max(1000).optional(),
  };

  for (const field of fields) {
    let fieldSchema: z.ZodTypeAny;

    switch (field.type) {
      case "email":
        fieldSchema = z.string().email("Invalid email");
        break;
      case "checkbox":
        fieldSchema = z.boolean();
        break;
      case "select":
        fieldSchema = z.string();
        if (field.options?.length) {
          fieldSchema = z.enum(
            field.options.map((o: FormFieldOption) => o.value) as [
              string,
              ...string[],
            ],
          );
        }
        break;
      default:
        fieldSchema = z.string();
        break;
    }

    if (!field.required) {
      fieldSchema = fieldSchema.optional();
    }

    shape[field.id] = fieldSchema;
  }

  return z.object(shape);
}
