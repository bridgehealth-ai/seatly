import {beforeEach, describe, expect, it} from "vitest";
import {screen, waitFor, within} from "@testing-library/react";
import userEvent, {type UserEvent} from "@testing-library/user-event";
import {renderWithProviders} from "@/tests/test-utils/renderWithProviders";
import DeskDashboardPage from "../pages/deskdashboard/DeskDashboardPage";

describe("DeskDashboardPage", () => {

  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    renderWithProviders(<DeskDashboardPage/>, {
      initialEntries: ["/desks"],
      initialAuth: {
        user: {
          id: 1,
          email: "test@example.com",
          fullName: "Test User",
        },
        accessToken: "abc123",
      },
    });
  });

  it("renders desks returned from the API in the table", async () => {
    await screen.findByRole("heading", {name: /dashboard/i});

    expect(await screen.findByText("Desk A")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("1st Floor")).toBeInTheDocument();

    expect(await screen.findByText("Desk B")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("-")).toBeInTheDocument();

    expect(
      screen.getAllByRole("button", {name: /book/i}).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("opens the create desk modal and allows submitting a new desk", async () => {
    await screen.findByRole("heading", {name: /dashboard/i});

    const openCreateButton = screen.getByRole("button", {
      name: /create desk/i,
    });
    await user.click(openCreateButton);
    const modalHeading = await screen.findByRole("heading", {
      name: /create desk/i,
    });
    const modal = modalHeading.closest("div");
    if (!modal) {
      throw new Error("Create desk modal container not found");
    }

    const modalUtils = within(modal);
    await user.type(modalUtils.getByLabelText(/name/i), "Desk C");
    await user.type(modalUtils.getByLabelText(/location/i), "3rd Floor");

    const submitButton = modalUtils.getByRole("button", {name: /create desk/i});
    await user.click(submitButton);
    await waitFor(() => {
      expect(
        screen.queryByRole("heading", {name: /create desk/i}),
      ).not.toBeInTheDocument();
    });

    expect(await screen.findByText("Desk C")).toBeInTheDocument();
    expect(screen.getByText("3rd Floor")).toBeInTheDocument();
  });

  it("allows booking a desk from the booking modal", async () => {
    await screen.findByRole("heading", {name: /dashboard/i});
    await screen.findByText("Desk A");

    const bookButtons = screen.getAllByRole("button", {name: /^book$/i});
    await user.click(bookButtons[0]);

    const modalHeading = await screen.findByRole("heading", {
      name: /book desk: desk a/i,
    });
    const modal = modalHeading.closest("div");
    if (!modal) {
      throw new Error("Booking modal container not found");
    }
    const modalUtils = within(modal);

    await modalUtils.findByText(/showing availability 09:00 – 17:00/i);

    const slotBookButtons = await modalUtils.findAllByRole("button", {
      name: /^book$/i,
    });

    await user.click(slotBookButtons[0]);

    // With recurring booking feature, modal stays open after booking
    // Just verify the modal is still present
    await waitFor(() => {
      expect(
        screen.getByRole("heading", {name: /book desk: desk a/i}),
      ).toBeInTheDocument();
    });
    
    // Close the modal by clicking Cancel button
    const cancelButton = modalUtils.getByRole("button", {name: /cancel/i});
    await user.click(cancelButton);
    
    await waitFor(() => {
      expect(
        screen.queryByRole("heading", {name: /book desk: desk a/i}),
      ).not.toBeInTheDocument();
    });
  });
});