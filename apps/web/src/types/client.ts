export type Client = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
};

export interface ClientSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export interface ClientsTableProps {
  search: string;
}
