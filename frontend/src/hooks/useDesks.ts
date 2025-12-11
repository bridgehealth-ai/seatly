import {useMutation, useQuery} from "@tanstack/react-query";
import {useAuth} from "@/context/AuthContext";
import type {Desk, CreateDeskInput} from "@/types";
import {useSeatlyApi} from "./useApi";

export function useDesksQuery() {
  const {accessToken} = useAuth();
  const api = useSeatlyApi();

  return useQuery<Desk[], Error>({
    queryKey: ["desks"],
    queryFn: () => api.listDesks(),
    enabled: !!accessToken,
  });
}

export function useCreateDeskMutation() {
  const api = useSeatlyApi();

  return useMutation<Desk, Error, CreateDeskInput>({
    mutationFn: (input) => api.createDesk(input),
  });
}

