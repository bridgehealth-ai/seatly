import type {
  Desk,
  CreateDeskInput,
  AvailabilitySlot,
  CreateBookingInput,
  CreateRecurringBookingInput,
  Booking,
  LoginRequest,
  LoginResponse,
  CreateUserRequest,
  UserResponse,
} from "@/types";

export class SeatlyApiClient {
  private baseUrl: string;
  private getToken: () => string | null;

  constructor(baseUrl: string, getToken: () => string | null) {
    this.baseUrl = baseUrl;
    this.getToken = getToken;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage: string;
      try {
        const errorBody = await response.json();
        errorMessage = errorBody.message || `HTTP ${response.status}`;
      } catch {
        errorMessage = `HTTP ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async signup(data: CreateUserRequest): Promise<UserResponse> {
    return this.request("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    return this.request("/users/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listDesks(): Promise<Desk[]> {
    return this.request("/desks", {
      method: "GET",
    });
  }

  async createDesk(data: CreateDeskInput): Promise<Desk> {
    return this.request("/desks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getDeskAvailability(
    deskId: number,
    startAt: string,
    endAt: string
  ): Promise<AvailabilitySlot[]> {
    const params = new URLSearchParams({ startAt, endAt });
    return this.request(`/desks/${deskId}/availability?${params.toString()}`);
  }

  async createBooking(
    deskId: number,
    data: Omit<CreateBookingInput, "deskId">
  ): Promise<Booking> {
    return this.request(`/desks/${deskId}/bookings`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async createRecurringBooking(
    deskId: number,
    data: Omit<CreateRecurringBookingInput, "deskId">
  ): Promise<Booking[]> {
    return this.request(`/desks/${deskId}/bookings/recurring`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

