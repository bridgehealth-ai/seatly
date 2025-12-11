import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { SeatlyApiClient } from "@/api/SeatlyApi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export function useSeatlyApi() {
  const { accessToken } = useAuth();
  
  return useMemo(
    () => new SeatlyApiClient(API_BASE_URL, () => accessToken),
    [accessToken]
  );
}

