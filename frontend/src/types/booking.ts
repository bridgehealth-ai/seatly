export type AvailabilityStatus = "AVAILABLE" | "BOOKED";

export type AvailabilitySlot = {
  startAt: string; // ISO-like string
  endAt: string;
  status: AvailabilityStatus;
};

export type CreateBookingInput = {
  deskId: number;
  startAt: string;
  endAt: string;
};

export type CreateRecurringBookingInput = {
  deskId: number;
  startAt: string;
  endAt: string;
  recurrenceEndDate: string; // YYYY-MM-DD format
};

export type Booking = {
  id: number;
  deskId: number;
  userId: number;
  startAt: string;
  endAt: string;
};

