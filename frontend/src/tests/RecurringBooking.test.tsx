import {beforeEach, describe, expect, it} from "vitest";
import {screen, waitFor, within} from "@testing-library/react";
import userEvent, {type UserEvent} from "@testing-library/user-event";
import {renderWithProviders} from "@/tests/test-utils/renderWithProviders";
import DeskDashboardPage from "../pages/deskdashboard/DeskDashboardPage";

describe("Recurring Booking Feature", () => {
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

  it("shows recurring booking panel when 'Book Recurring' button is clicked", async () => {
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

    // Find and click "Book Recurring" button
    const bookRecurringButtons = await modalUtils.findAllByRole("button", {
      name: /book recurring/i,
    });
    await user.click(bookRecurringButtons[0]);

    // Verify recurring panel appears
    await waitFor(() => {
      expect(modalUtils.getByText(/configure booking for/i)).toBeInTheDocument();
    });

    // Verify radio buttons exist
    expect(modalUtils.getByLabelText(/single booking/i)).toBeInTheDocument();
    expect(modalUtils.getByLabelText(/recurring booking/i)).toBeInTheDocument();

    // Verify date inputs exist
    expect(modalUtils.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(modalUtils.getByLabelText(/end date/i)).toBeInTheDocument();

    // Verify confirm button appears
    expect(modalUtils.getByRole("button", {name: /confirm and close/i})).toBeInTheDocument();
  });

  it("enables date inputs when recurring booking is selected", async () => {
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

    const bookRecurringButtons = await modalUtils.findAllByRole("button", {
      name: /book recurring/i,
    });
    await user.click(bookRecurringButtons[0]);

    // Date inputs should be disabled initially (single booking is default)
    const startDateInput = modalUtils.getByLabelText(/start date/i) as HTMLInputElement;
    const endDateInput = modalUtils.getByLabelText(/end date/i) as HTMLInputElement;
    
    expect(startDateInput).toBeDisabled();
    expect(endDateInput).toBeDisabled();

    // Select recurring booking
    const recurringRadio = modalUtils.getByLabelText(/recurring booking/i);
    await user.click(recurringRadio);

    // Date inputs should now be enabled
    await waitFor(() => {
      expect(startDateInput).toBeEnabled();
      expect(endDateInput).toBeEnabled();
    });
  });

  it("shows helpful text when recurring booking is selected", async () => {
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

    const bookRecurringButtons = await modalUtils.findAllByRole("button", {
      name: /book recurring/i,
    });
    await user.click(bookRecurringButtons[0]);

    // Select recurring booking
    const recurringRadio = modalUtils.getByLabelText(/recurring booking/i);
    await user.click(recurringRadio);

    // Should show helpful text about day of week
    await waitFor(() => {
      expect(modalUtils.getByText(/this will book.*on every/i)).toBeInTheDocument();
    });
  });

  it("has cancel and confirm and close buttons in recurring panel", async () => {
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

    const bookRecurringButtons = await modalUtils.findAllByRole("button", {
      name: /book recurring/i,
    });
    await user.click(bookRecurringButtons[0]);

    // Verify both buttons exist
    expect(modalUtils.getByRole("button", {name: /^cancel$/i})).toBeInTheDocument();
    expect(modalUtils.getByRole("button", {name: /confirm and close/i})).toBeInTheDocument();
  });
});
