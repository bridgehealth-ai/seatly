export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  id: number;
  token: string;
  email: string;
  fullName: string;
};

export type CreateUserRequest = {
  email: string;
  password: string;
  fullName?: string | null;
};

export type UserResponse = {
  id: number | null;
  email: string;
  fullName: string | null;
};

