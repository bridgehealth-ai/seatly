import {http, HttpResponse} from "msw";

type CreateUserRequest = {
  email: string;
  password: string;
  fullName?: string | null;
};

type LoginRequest = {
  email: string;
  password: string;
};

type DeskResponse = {
  id: number;
  name: string;
  location: string | null;
};

type AvailabilityStatus = "AVAILABLE" | "BOOKED";

type AvailabilityResponse = {
  startAt: string;
  endAt: string;
  status: AvailabilityStatus;
};

type BookingResponse = {
  id: number;
  deskId: number;
  userId: number;
  startAt: string;
  endAt: string;
};

const desks: DeskResponse[] = [
  {
    id: 1,
    name: "Desk A",
    location: "1st Floor",
  },
  {
    id: 2,
    name: "Desk B",
    location: null,
  },
];

let bookingIdCounter = 1;

export const handlers = [
  http.post("*/users", async ({request}) => {
    const body = (await request.json()) as CreateUserRequest;

    if (!body.email || !body.password) {
      return HttpResponse.json(
        {message: "Validation failed"},
        {status: 400},
      );
    }

    if (body.email === "taken@example.com") {
      return HttpResponse.json(
        {message: "Email already in use"},
        {status: 409},
      );
    }

    return HttpResponse.json(
      {
        id: 1,
        email: body.email,
        fullName: body.fullName ?? null,
      },
      {status: 201},
    );
  }),

  http.post("*/users/login", async ({request}) => {
    const body = (await request.json()) as LoginRequest;

    if (body.email === "test@example.com" && body.password === "Password123!") {
      return HttpResponse.json({
        token: "fake-jwt-token",
        id: 1,
        email: body.email,
        fullName: "Test User",
      });
    }

    return HttpResponse.json(
      {message: "Invalid credentials"},
      {status: 401},
    );
  }),

  http.get("*/desks", () => {
    return HttpResponse.json(desks);
  }),

  http.post("*/desks", async ({request}) => {
    const body = (await request.json()) as { name?: string; location?: string | null };

    const name = body.name?.trim();
    if (!name) {
      return HttpResponse.json(
        {message: "Name is required"},
        {status: 400},
      );
    }

    const nextId =
      desks.length > 0 ? Math.max(...desks.map((d) => d.id)) + 1 : 1;

    const newDesk: DeskResponse = {
      id: nextId,
      name,
      location: body.location ?? null,
    };

    desks.push(newDesk);

    return HttpResponse.json(newDesk, {status: 201});
  }),

  http.get("*/desks/:deskId/availability", ({request}) => {
    const url = new URL(request.url);
    const startAt = url.searchParams.get("startAt");
    const endAt = url.searchParams.get("endAt");

    if (!startAt || !endAt) {
      return HttpResponse.json(
        {message: "startAt and endAt are required"},
        {status: 400},
      );
    }

    const availability: AvailabilityResponse[] = [
      {
        startAt,
        endAt,
        status: "AVAILABLE",
      },
      {
        startAt,
        endAt,
        status: "BOOKED",
      },
    ];

    return HttpResponse.json(availability, {status: 200});
  }),

  http.post("*/desks/:deskId/bookings", async ({params, request}) => {
    const {deskId} = params as { deskId?: string };
    if (!deskId) {
      return HttpResponse.json(
        {message: "deskId is required"},
        {status: 400},
      );
    }

    const body = (await request.json()) as { startAt?: string; endAt?: string };

    if (!body.startAt || !body.endAt) {
      return HttpResponse.json(
        {message: "startAt and endAt are required"},
        {status: 400},
      );
    }

    const response: BookingResponse = {
      id: bookingIdCounter++,
      deskId: Number(deskId),
      userId: 1,
      startAt: body.startAt,
      endAt: body.endAt,
    };

    return HttpResponse.json(response, {status: 201});
  }),
];