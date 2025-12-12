import {useAuth} from "@/features/auth/AuthContext";
import {useMutation, useQuery} from "@tanstack/react-query";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

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

type ApiError = {
  message?: string;
  _embedded?: {
    errors: [
      {
        message: string[]
      }
    ]
  }
};

export async function fetchDeskAvailability(
  accessToken: string | null,
  deskId: number,
  startAt: string,
  endAt: string,
): Promise<AvailabilitySlot[]> {
  if (!accessToken) {
    throw new Error("Not authenticated");
  }

  const params = new URLSearchParams({
    startAt,
    endAt,
  });

  const response = await fetch(
    `${API_BASE_URL}/desks/${deskId}/availability?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    let errorBody: ApiError | undefined;
    try {
      errorBody = (await response.json()) as ApiError;
    } catch {
      // ignore parse error
    }

    const message =
      errorBody?.message ||
      (response.status === 401
        ? "You are not authorized to view desk availability."
        : "Failed to load desk availability.");

    throw new Error(message);
  }

  return (await response.json()) as AvailabilitySlot[];
}

export function useDeskAvailabilityQuery(
  deskId: number | null | undefined,
  startAt: string | null,
  endAt: string | null,
) {
  const {accessToken} = useAuth();

  return useQuery<AvailabilitySlot[], Error>({
    queryKey: ["deskAvailability", deskId, startAt, endAt],
    queryFn: () =>
      fetchDeskAvailability(
        accessToken,
        deskId as number,
        startAt as string,
        endAt as string,
      ),
    enabled: !!accessToken && !!deskId && !!startAt && !!endAt,
  });
}

async function createBooking(
  accessToken: string | null,
  input: CreateBookingInput,
) {
  if (!accessToken) {
    throw new Error("Not authenticated");
  }

  const {deskId, startAt, endAt} = input;
  const response = await fetch(`${API_BASE_URL}/desks/${deskId}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({startAt, endAt}),
  });

  if (!response.ok) {
    let errorBody: ApiError | undefined;
    try {
      errorBody = (await response.json()) as ApiError;
    } catch {
      // ignore parse error
    }
    const message =
    (errorBody?._embedded?.errors && Array.isArray(errorBody._embedded.errors) && errorBody._embedded.errors.length > 0
      ? errorBody._embedded.errors[0].message
      : // If no specific errors, use the message or default fallback
        errorBody?.message ||
        // Handle specific cases like unauthorized access
        (response.status === 401
          ? "You are not authorized to create bookings."
          : "Failed to create booking."));
    
    throw new Error(message);
  }

  return await response.json();
}

export function useCreateBookingMutation() {
  const {accessToken} = useAuth();

  return useMutation({
    mutationFn: (input: CreateBookingInput) => createBooking(accessToken, input),
  });
}

// Create a recurring booking series (weekly)
async function createRecurringBooking(
  accessToken: string | null,
  deskId: number,
  startAt: string,
  endAt: string,
  recurrence: string,
  duration: number,
) {
  if (!accessToken) {
    throw new Error("Not authenticated");
  }
  const response = await fetch(`${API_BASE_URL}/desks/${deskId}/recurrence-bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      startAt: startAt,
      endAt: endAt,
      recurrence_type: recurrence,
      duration: duration
    }),
  });

  if (!response.ok) {
    let errorBody: ApiError | undefined;
    try {
      errorBody = (await response.json()) as ApiError;
    } catch {
      // ignore parse error
    }
    const message =
    // Check if `_embedded.errors` exists and has any errors
    (errorBody?._embedded?.errors && Array.isArray(errorBody._embedded.errors) && errorBody._embedded.errors.length > 0
      ? errorBody._embedded.errors[0].message
      : // If no specific errors, use the message or default fallback
        errorBody?.message ||
        // Handle specific cases like unauthorized access
        (response.status === 401
          ? "You are not authorized to create bookings."
          : "Failed to create booking."));

    throw new Error(message);
  }

  return { message: "Recurring bookings created successfully" };
}

// Create a mutation hook for creating recurring bookings
export function useCreateRecurringBookingMutation() {
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: (
      input: { deskId: number; startAt: string; endAt: string; recurrence: string; duration: number;}
    ) =>
      createRecurringBooking(
        accessToken,
        input.deskId,
        input.startAt,
        input.endAt,
        input.recurrence,
        input.duration,
      ),
  });
}
