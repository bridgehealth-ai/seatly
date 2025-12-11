import type {ReactElement, ReactNode} from "react";
import {render} from "@testing-library/react";
import {MemoryRouter, type MemoryRouterProps} from "react-router-dom";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {AuthProvider} from "@/context/AuthContext";

type User = {
  id: number;
  email: string;
  fullName: string;
};

type AuthData = {
  user: User | null;
  accessToken: string | null;
};

export type RenderWithProvidersOptions = {
  initialEntries?: MemoryRouterProps["initialEntries"];
  wrapper?: React.ComponentType<{ children: ReactNode }>;
  initialAuth?: AuthData;
};

const AUTH_STORAGE_KEY = "auth";

export function renderWithProviders(
  ui: ReactElement,
  {
    initialEntries = ["/"],
    wrapper: CustomWrapper,
    initialAuth,
  }: RenderWithProvidersOptions = {},
) {
  if (typeof window !== "undefined" && window.localStorage) {
    if (initialAuth && initialAuth.accessToken) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(initialAuth));
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const AllProviders = ({children}: { children: ReactNode }) => {
    let tree = (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    if (CustomWrapper) {
      tree = <CustomWrapper>{tree}</CustomWrapper>;
    }

    return tree;
  };

  return {
    ...render(ui, {wrapper: AllProviders}),
    queryClient,
  };
}