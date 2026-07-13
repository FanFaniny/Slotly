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

export type BookingFormSchema = BookingFormField[];

export type CustomFieldValues = Record<string, string | boolean | number>;
