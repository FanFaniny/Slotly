import type { BookingFormField } from "@slotly/shared";

export interface BookingFormData {
  name: string;
  phone: string;
  email?: string;
  comment?: string;
  customFieldValues: Record<string, string | boolean | number>;
}

export interface DynamicBookingFormProps {
  customFields: BookingFormField[];
  onSubmit: (data: BookingFormData) => void;
  isSubmitting: boolean;
}
