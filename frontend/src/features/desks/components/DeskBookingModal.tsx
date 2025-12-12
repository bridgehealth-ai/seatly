import React, { useState, useEffect } from "react";
import {
  type AvailabilitySlot,
  useCreateBookingMutation,
  useCreateRecurringBookingMutation,
  fetchDeskAvailability,
  useDeskAvailabilityQuery,
} from "@/features/desks/api/deskBookings";
import type { Desk } from "@/features/desks/api/desks";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthContext";

type DeskBookingModalProps = {
  desk: Desk & { id: number };
  isOpen: boolean;
  onClose: () => void;
};

function toLocalDateTimeString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1); // 1-based
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimeRange(slot: AvailabilitySlot): string {
  const start = new Date(slot.startAt);
  const end = new Date(slot.endAt);

  const pad = (n: number) => n.toString().padStart(2, "0");

  const startHours = pad(start.getHours());
  const startMinutes = pad(start.getMinutes());
  const endHours = pad(end.getHours());
  const endMinutes = pad(end.getMinutes());

  return `${startHours}:${startMinutes} – ${endHours}:${endMinutes}`;
}

export const DeskBookingModal: React.FC<DeskBookingModalProps> = ({
  desk,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = React.useState<Date>(() => new Date());
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceDuration, setRecurrenceDuration] = useState(1);
  const [recurrenceStartDate, setRecurrenceStartDate] = useState<Date>(() => new Date());
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[][]>([]);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);

  const start = React.useMemo(
    () =>
      new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        9,
        0,
        0,
        0
      ),
    [selectedDate]
  );

  const end = React.useMemo(
    () =>
      new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        17,
        0,
        0,
        0
      ),
    [selectedDate]
  );

  const startAt = toLocalDateTimeString(start);
  const endAt = toLocalDateTimeString(end);

  const { accessToken } = useAuth();

  const { data: availability } =
    useDeskAvailabilityQuery(desk.id, startAt, endAt);

  useEffect(() => {
    const allSlots: AvailabilitySlot[][] = [];
    if (availability) allSlots.push(availability);
    setAvailabilitySlots(allSlots);
  }, [availability]);

  const bookingMutation = useCreateBookingMutation();
  const recurringBookingMutation = useCreateRecurringBookingMutation();

  const handleBackgroundClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (bookingMutation.isPending || recurringBookingMutation.isPending) return;
    e.stopPropagation();
    onClose();
  };

  const handleInnerClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
  };

  const handleBookSlot = async (slot: AvailabilitySlot) => {
    setBookingError(null);
    try {
      
      await bookingMutation.mutateAsync({
        deskId: desk.id,
        startAt: slot.startAt,
        endAt: slot.endAt,
      });
      // Refresh availability after successful booking
      await queryClient.invalidateQueries({
        queryKey: ["deskAvailability", desk.id, startAt, endAt],
      });

      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setBookingError(`Could not create booking: ${message}`);
    }
  };

  const handleDateChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e.target.value; // "yyyy-MM-dd"
    if (!value) return;
    const [year, month, day] = value.split("-").map(Number);
    const newDate = new Date(year, (month ?? 1) - 1, day ?? 1);
    if (!Number.isNaN(newDate.getTime())) {
      setSelectedDate(newDate);
      setRecurrenceStartDate(newDate);
    }
  };

  const handleRecurrenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsRecurring(e.target.checked);
  };

  const handleRecurrenceStartDateChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRecurrenceStartDate(e.target.value);
  };

  const handleRecurrenceDurationChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRecurrenceDuration(Number(e.target.value));
  };

  const handleSlotSelection = (slot: AvailabilitySlot) => {
    setSelectedSlot(slot);
  };

  const handleRecurringBooking = async () => {
    if (!selectedSlot) {
      setBookingError("Please select a time slot.");
      return;
    }

    setBookingError(null);
    const recurrenceDates = [];
    const startDate = new Date(recurrenceStartDate);

    // Create recurrence dates for the next weeks
    for (let i = 0; i < recurrenceDuration; i++) {
      const nextWeekDate = new Date(startDate);
      nextWeekDate.setDate(startDate.getDate() + 7 * i);
      recurrenceDates.push(nextWeekDate.toISOString());
    }

    const recurrenceCount = recurrenceDuration;
    try {
      
        const recurrenceData = {
          deskId: desk.id,
          recurrence: 'WEEKLY', 
          duration: recurrenceCount,
          startAt: selectedSlot.startAt,
          endAt: selectedSlot.endAt,
        };
        await recurringBookingMutation.mutateAsync(recurrenceData);
      

      // Refresh availability after successful recurring booking
      await queryClient.invalidateQueries({
        queryKey: ["deskAvailability", desk.id, startAt, endAt],
      });

      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setBookingError(`Could not create recurring booking: ${message}`);
    }
  };
  // Use useEffect to trigger fetching the availability for each recurrence start date
  useEffect(() => {
    if (!isRecurring || !recurrenceStartDate) return;

    const recurrenceDates = [];
    const startDate = new Date(recurrenceStartDate);

    // Create recurrence dates for the next weeks
    for (let i = 0; i < recurrenceDuration; i++) {
      const nextWeekDate = new Date(startDate);
      nextWeekDate.setDate(startDate.getDate() + 7 * i); 

      recurrenceDates.push(nextWeekDate.toISOString());
    }

    // Fetch availability for each recurrence date using fetchDeskAvailability
    const fetchAvailability = async () => {
      const allSlots: AvailabilitySlot[][] = [];
      for (const date of recurrenceDates) {
        const startAt = new Date(date);
        startAt.setHours(9, 0, 0, 0); 

        const endAt = new Date(date);
        endAt.setHours(17, 0, 0, 0); 

        if (accessToken) {
          try {
            const availability = await fetchDeskAvailability(
              accessToken,
              desk.id,
              toLocalDateTimeString(startAt),
              toLocalDateTimeString(endAt)
            );
            allSlots.push(availability);
          } catch (error) {
            console.error("Error fetching availability:", error);
          }
        }
      }
      if (allSlots.length > 0) {
        setSelectedSlot(allSlots[0][0])
      }
      setAvailabilitySlots(allSlots);
    };

    fetchAvailability();
  }, [recurrenceStartDate, recurrenceDuration, isRecurring, desk.id, accessToken]);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedDate(new Date());
      setBookingError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={handleBackgroundClick}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: "1.5rem",
          borderRadius: "4px",
          width: "100%",
          maxWidth: "500px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
        }}
        onClick={handleInnerClick}
      >
        <h2 style={{ marginTop: 0, marginBottom: "0.75rem" }}>
          Book desk: {desk.name}
        </h2>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "0.75rem",
            fontSize: "0.9rem",
          }}
        >
          <label htmlFor="booking-date" style={{ whiteSpace: "nowrap" }}>
            Date:
          </label>
          <input
            id="booking-date"
            type="date"
            value={toDateInputValue(selectedDate)}
            onChange={handleDateChange}
            style={{ padding: "0.25rem 0.4rem" }}
          />
          <span style={{ marginLeft: "auto" }}>Showing availability 09:00 – 17:00</span>
        </div>

        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          Recurring Booking
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={handleRecurrenceChange}
          />
        </label>

        {isRecurring && (
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              Start Date
              <input
                type="date"
                value={recurrenceStartDate}
                onChange={handleRecurrenceStartDateChange}
              />
            </label>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              Duration (Weeks)
              <input
                type="number"
                value={recurrenceDuration}
                onChange={handleRecurrenceDurationChange}
                min="1"
              />
            </label>

            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              Select Time Slot
              <select
                onChange={(e) => {
                  const selectedSlot = availabilitySlots.length > 0 && availabilitySlots[0].find(
                    (slot) => slot.startAt === e.target.value
                  );
                  handleSlotSelection(selectedSlot);
                }}
              >
                {availabilitySlots.length > 0 &&
                  availabilitySlots[0].map((slot, index) => (
                    <option key={index} value={slot.startAt}>
                      {formatTimeRange(slot)}
                    </option>
                  ))}
              </select>
            </label>

            <button
              onClick={handleRecurringBooking}
              disabled={!selectedSlot || recurringBookingMutation.isPending}
              style={{
                padding: "0.4rem 0.8rem",
                cursor: selectedSlot && !recurringBookingMutation.isPending
                  ? "pointer"
                  : "not-allowed",
              }}
            >
              Book Recurring Slot
            </button>

          </div>
        )}

        {bookingError && (
          <p style={{ color: "red", marginTop: "0.75rem" }}>{bookingError}</p>
        )}

        {availabilitySlots.length === 0 && <p>No availability data for this period.</p>}

        {availabilitySlots.length > 0 && (
          <div
            style={{
              maxHeight: "300px",
              overflowY: "auto",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.9rem",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "0.5rem",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Time
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "0.5rem",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "0.5rem",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {availabilitySlots.map((slots, weekIndex) => (
                  <React.Fragment key={weekIndex}>
                    {
                      isRecurring && (
                        <tr>
                        <td colSpan={3} style={{ padding: "1rem", textAlign: "center" }}>
                          Week {weekIndex + 1}
                        </td>
                      </tr>
                      )
                    }
                    
                    {slots.map((slot, index) => {
                      const isAvailable = String(slot.status).toUpperCase() === "AVAILABLE";
                      return (
                        <tr key={`${slot.startAt}-${slot.endAt}-${index}`}>
                          <td
                            style={{
                              padding: "0.5rem",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            {formatTimeRange(slot)}
                          </td>
                          <td
                            style={{
                              padding: "0.5rem",
                              borderBottom: "1px solid #eee",
                              textTransform: "capitalize",
                            }}
                          >
                            {slot.status.toLowerCase()}
                          </td>
                          <td
                            style={{
                              padding: "0.5rem",
                              borderBottom: "1px solid #eee",
                              textAlign: "right",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleBookSlot(slot)}
                              disabled={!isAvailable || bookingMutation.isPending || recurringBookingMutation.isPending}
                              style={{
                                padding: "0.3rem 0.7rem",
                                cursor: isAvailable && !bookingMutation.isPending && !recurringBookingMutation.isPending
                                  ? "pointer"
                                  : "not-allowed",
                              }}
                            >
                              {isAvailable ? "Book" : "Unavailable"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
            marginTop: "1rem",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{ padding: "0.4rem 0.8rem", cursor: "pointer" }}
            disabled={bookingMutation.isPending || recurringBookingMutation.isPending}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
