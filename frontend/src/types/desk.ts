export type Desk = {
  id: number;
  name: string;
  location: string | null;
};

export type CreateDeskInput = {
  name: string;
  location: string | null;
};

