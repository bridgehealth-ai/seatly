import {useAuth} from "@/context/AuthContext";
import {useMutation, useQuery} from "@tanstack/react-query";
import type {AvailabilitySlot, CreateBookingInput, CreateRecurringBookingInput} from "@/types";
import {useSeatlyApi} from "./useApi";

export function useDeskAvailabilityQuery(
  deskId: number | null | undefined,
  startAt: string | null,
  endAt: string | null,
) {
  const {accessToken} = useAuth();
  const api = useSeatlyApi();

  return useQuery<AvailabilitySlot[], Error>({
    queryKey: ["deskAvailability", deskId, startAt, endAt],
    queryFn: () =>
      api.getDeskAvailability(
        deskId as number,
        startAt as string,
        endAt as string,
      ),
    enabled: !!accessToken && !!deskId && !!startAt && !!endAt,
  });
}

export function useCreateBookingMutation() {
  const api = useSeatlyApi();

  return useMutation({
    mutationFn: (input: CreateBookingInput) =>
      api.createBooking(input.deskId, {
        startAt: input.startAt,
        endAt: input.endAt,
      }),
  });
}

export function useCreateRecurringBookingMutation() {
  const api = useSeatlyApi();

  return useMutation({
    mutationFn: (input: CreateRecurringBookingInput) =>
      api.createRecurringBooking(input.deskId, {
        startAt: input.startAt,
        endAt: input.endAt,
        recurrenceEndDate: input.recurrenceEndDate,
      }),
  });
}

