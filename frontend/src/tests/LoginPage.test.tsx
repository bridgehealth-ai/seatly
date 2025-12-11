import {describe, expect, it, vi} from "vitest";
import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {renderWithProviders} from "@/tests/test-utils/renderWithProviders";
import LoginPage from "../pages/login/LoginPage";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("LoginPage", () => {
  it("allows filling in the form, submitting, and redirects to the dashboard", async () => {
    const user = userEvent.setup();

    renderWithProviders(<LoginPage/>, {
      initialEntries: ["/login"],
    });

    await user.type(
      screen.getByLabelText(/email/i),
      "test@example.com",
    );
    await user.type(
      screen.getByLabelText(/password/i),
      "Password123!",
    );

    await user.click(
      screen.getByRole("button", {name: /log in/i}),
    );

    await screen.findByText(/login successful/i);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
        replace: true,
      });
    });
  });
});