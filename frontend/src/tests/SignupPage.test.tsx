import {waitFor} from "@testing-library/react";
import {screen} from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import {renderWithProviders} from "@/tests/test-utils/renderWithProviders";
import SignupPage from "../pages/signup/SignupPage";
import {describe, expect, it, vi} from "vitest";

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

describe("SignupPage", () => {
  it("submits signup form and redirects to /login on success", async () => {
    const user = userEvent.setup();

    renderWithProviders(<SignupPage/>, {
      initialEntries: ["/signup"],
    });

    const emailInput = screen.getByLabelText(/email/i);
    const nameInput = screen.getByLabelText(/full name/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", {
      name: /sign up/i,
    });

    await user.type(emailInput, "test@example.com");
    await user.type(nameInput, "Test User");
    await user.type(passwordInput, "Password123!");

    await user.click(submitButton);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });
});