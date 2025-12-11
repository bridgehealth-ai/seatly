import {useMutation} from "@tanstack/react-query";
import type {LoginRequest, LoginResponse, CreateUserRequest, UserResponse} from "@/types";
import {useSeatlyApi} from "./useApi";

export function useLoginMutation() {
  const api = useSeatlyApi();
  
  return useMutation<LoginResponse, Error, LoginRequest>({
    mutationKey: ["login"],
    mutationFn: (data) => api.login(data),
  });
}

export function useSignupMutation() {
  const api = useSeatlyApi();
  
  return useMutation<UserResponse, Error, CreateUserRequest>({
    mutationKey: ["signup"],
    mutationFn: (data) => api.signup(data),
  });
}

