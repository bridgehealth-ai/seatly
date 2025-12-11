import React, {createContext, type ReactNode, useContext, useEffect, useState,} from "react";

type User = {
  id: number;
  email: string;
  fullName: string;
};

type AuthData = {
  user: User | null;
  accessToken: string | null;
};

type LoginPayload = {
  user: User;
  accessToken: string;
};

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "auth";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({children}) => {
  const [auth, setAuth] = useState<AuthData>({
    user: null,
    accessToken: null,
  });

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as AuthData;
      setAuth(parsed);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!auth.accessToken) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  }, [auth]);

  const login = (payload: LoginPayload) => {
    setAuth({
      user: payload.user,
      accessToken: payload.accessToken,
    });
  };

  const logout = () => {
    setAuth({
      user: null,
      accessToken: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user: auth.user,
        accessToken: auth.accessToken,
        isAuthenticated: !!auth.accessToken,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};