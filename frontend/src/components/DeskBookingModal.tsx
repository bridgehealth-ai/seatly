import React from "react";
import {
  useCreateBookingMutation,
  useCreateRecurringBookingMutation,
  useDeskAvailabilityQuery,
} from "@/hooks/useBookings";
import type {AvailabilitySlot, Desk} from "@/types";
import {useQueryClient} from "@tanstack/react-query";
import Button from "@/pageElements/Button";

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
  const [showRecurringPanel, setShowRecurringPanel] = React.useState(false);
  const [selectedSlot, setSelectedSlot] = React.useState<AvailabilitySlot | null>(null);
  const [bookingMode, setBookingMode] = React.useState<'single' | 'recurring'>('single');
  const [recurrenceStartDate, setRecurrenceStartDate] = React.useState<string>('');
  const [recurrenceEndDate, setRecurrenceEndDate] = React.useState<string>('');
  const [startDateError, setStartDateError] = React.useState<string | null>(null);
  const [endDateError, setEndDateError] = React.useState<string | null>(null);

  const start = React.useMemo(
    () =>
      new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        9,
        0,
        0,
        0,
      ),
    [selectedDate],
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
        0,
      ),
    [selectedDate],
  );

  const startAt = toLocalDateTimeString(start);
  const endAt = toLocalDateTimeString(end);

  const {
    data: availability,
    isLoading,
    isError,
    error,
  } = useDeskAvailabilityQuery(desk.id, startAt, endAt);
  
  const bookingMutation = useCreateBookingMutation();
  const recurringBookingMutation = useCreateRecurringBookingMutation();
  const [bookingError, setBookingError] = React.useState<string | null>(null);

  const handleBackgroundClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (bookingMutation.isPending || recurringBookingMutation.isPending) return;
    e.stopPropagation();
    handleCancel();
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

      await queryClient.invalidateQueries({
        queryKey: ["deskAvailability", desk.id, startAt, endAt],
      });

      // Don't close modal - just show success
      setBookingError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setBookingError(message);
    }
  };

  const handleBookRecurring = (slot: AvailabilitySlot) => {
    setSelectedSlot(slot);
    setShowRecurringPanel(true);
    setBookingMode('single');
    setRecurrenceStartDate(toDateInputValue(selectedDate));
    setRecurrenceEndDate(toDateInputValue(selectedDate));
    setBookingError(null);
    setStartDateError(null);
    setEndDateError(null);
  };

  const handleBookingModeChange = (mode: 'single' | 'recurring') => {
    setBookingMode(mode);
    setStartDateError(null);
    setEndDateError(null);
    if (mode === 'single') {
      setRecurrenceStartDate(toDateInputValue(selectedDate));
      setRecurrenceEndDate(toDateInputValue(selectedDate));
    }
  };

  const handleRecurrenceStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRecurrenceStartDate(value);
    setStartDateError(null);
    
    if (value) {
      const selectedDateObj = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDateObj < today) {
        setStartDateError("Start date cannot be before today's date");
      }
    }
  };

  const handleRecurrenceEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRecurrenceEndDate(value);
    setEndDateError(null);
    
    if (value) {
      const selectedDateObj = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDateObj < today) {
        setEndDateError("End date cannot be before today's date");
      }
    }
  };

  const handleConfirmAndClose = async () => {
    if (!selectedSlot) {
      onClose();
      return;
    }

    setBookingError(null);
    setStartDateError(null);
    setEndDateError(null);

    try {
      if (bookingMode === 'single') {
        await bookingMutation.mutateAsync({
          deskId: desk.id,
          startAt: selectedSlot.startAt,
          endAt: selectedSlot.endAt,
        });
      } else {
        // Validate dates
        if (!recurrenceStartDate || !recurrenceEndDate) {
          setBookingError("Please select both start and end dates");
          return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startDateObj = new Date(recurrenceStartDate);
        const endDateObj = new Date(recurrenceEndDate);

        // Check if dates are before today
        if (startDateObj < today) {
          setStartDateError("Start date cannot be before today's date");
          return;
        }

        if (endDateObj < today) {
          setEndDateError("End date cannot be before today's date");
          return;
        }

        if (endDateObj < startDateObj) {
          setBookingError("End date must be after start date");
          return;
        }

        // Create recurring booking
        await recurringBookingMutation.mutateAsync({
          deskId: desk.id,
          startAt: selectedSlot.startAt,
          endAt: selectedSlot.endAt,
          recurrenceEndDate: recurrenceEndDate,
        });
      }

      await queryClient.invalidateQueries({
        queryKey: ["deskAvailability", desk.id, startAt, endAt],
      });

      // Reset and close
      handleCancel();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setBookingError(message);
    }
  };

  const handleCancel = () => {
    setShowRecurringPanel(false);
    setSelectedSlot(null);
    setBookingMode('single');
    setRecurrenceStartDate('');
    setRecurrenceEndDate('');
    setBookingError(null);
    setStartDateError(null);
    setEndDateError(null);
    onClose();
  };

  const handleDateChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e.target.value; // "yyyy-MM-dd"
    if (!value) return;
    const [year, month, day] = value.split("-").map(Number);
    const newDate = new Date(year, (month ?? 1) - 1, day ?? 1);
    if (!Number.isNaN(newDate.getTime())) {
      setSelectedDate(newDate);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      setSelectedDate(new Date());
      setShowRecurringPanel(false);
      setSelectedSlot(null);
      setBookingMode('single');
      setRecurrenceStartDate('');
      setRecurrenceEndDate('');
      setBookingError(null);
      setStartDateError(null);
      setEndDateError(null);
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
        <h2 style={{marginTop: 0, marginBottom: "0.75rem"}}>
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
          <label htmlFor="booking-date" style={{whiteSpace: "nowrap"}}>
            Date:
          </label>
          <input
            id="booking-date"
            type="date"
            value={toDateInputValue(selectedDate)}
            onChange={handleDateChange}
            style={{padding: "0.25rem 0.4rem"}}
          />
          <span style={{marginLeft: "auto"}}>
            Showing availability 09:00 – 17:00
          </span>
        </div>

        {isLoading && <p>Loading availability...</p>}

        {isError && (
          <p style={{color: "red"}}>
            Failed to load availability: {error?.message}
          </p>
        )}

        {!isLoading && !isError && (!availability || availability.length === 0) && (
          <p>No availability data for this period.</p>
        )}

        {!isLoading && !isError && availability && availability.length > 0 && (
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
                  Recurring
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
              {availability.map((slot, index) => {
                const isAvailable =
                  String(slot.status).toUpperCase() === "AVAILABLE";

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
                      <Button
                        size="small"
                        onClick={() => handleBookRecurring(slot)}
                        disabled={!isAvailable || bookingMutation.isPending || recurringBookingMutation.isPending}
                      >
                        Book Recurring
                      </Button>
                    </td>
                    <td
                      style={{
                        padding: "0.5rem",
                        borderBottom: "1px solid #eee",
                        textAlign: "right",
                      }}
                    >
                      <Button
                        size="small"
                        onClick={() => handleBookSlot(slot)}
                        disabled={!isAvailable || bookingMutation.isPending || recurringBookingMutation.isPending}
                      >
                        {isAvailable ? "Book" : "Unavailable"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        )}

        {bookingError && (
          <p style={{color: "red", marginTop: "0.75rem"}}>{bookingError}</p>
        )}

        {showRecurringPanel && selectedSlot && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              backgroundColor: "#f5f5f5",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "0.75rem", fontSize: "1rem" }}>
              Configure Booking for {formatTimeRange(selectedSlot)}
            </h3>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
                <input
                  type="radio"
                  name="bookingMode"
                  value="single"
                  checked={bookingMode === 'single'}
                  onChange={() => handleBookingModeChange('single')}
                  style={{ marginRight: "0.5rem" }}
                />
                Single booking
              </label>
              <label style={{ display: "flex", alignItems: "center" }}>
                <input
                  type="radio"
                  name="bookingMode"
                  value="recurring"
                  checked={bookingMode === 'recurring'}
                  onChange={() => handleBookingModeChange('recurring')}
                  style={{ marginRight: "0.5rem" }}
                />
                Recurring Booking
              </label>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginBottom: "0.5rem" }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="recurrence-start-date" style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>
                  Start Date
                </label>
                <input
                  id="recurrence-start-date"
                  type="date"
                  value={recurrenceStartDate}
                  onChange={handleRecurrenceStartDateChange}
                  disabled={bookingMode === 'single'}
                  style={{
                    padding: "0.25rem 0.4rem",
                    width: "100%",
                    opacity: bookingMode === 'single' ? 0.5 : 1,
                    borderColor: startDateError ? 'red' : undefined,
                  }}
                />
                {startDateError && (
                  <p style={{ color: "red", fontSize: "0.8rem", marginTop: "0.25rem", marginBottom: 0 }}>
                    {startDateError}
                  </p>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="recurrence-end-date" style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>
                  End Date
                </label>
                <input
                  id="recurrence-end-date"
                  type="date"
                  value={recurrenceEndDate}
                  onChange={handleRecurrenceEndDateChange}
                  disabled={bookingMode === 'single'}
                  style={{
                    padding: "0.25rem 0.4rem",
                    width: "100%",
                    opacity: bookingMode === 'single' ? 0.5 : 1,
                    borderColor: endDateError ? 'red' : undefined,
                  }}
                />
                {endDateError && (
                  <p style={{ color: "red", fontSize: "0.8rem", marginTop: "0.25rem", marginBottom: 0 }}>
                    {endDateError}
                  </p>
                )}
              </div>
            </div>

            {bookingMode === 'recurring' && (
              <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.5rem", marginBottom: 0 }}>
                This will book {formatTimeRange(selectedSlot)} on every {new Date(selectedSlot.startAt).toLocaleDateString('en-US', { weekday: 'long' })} between the selected dates.
              </p>
            )}
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
          <Button
            onClick={handleCancel}
            disabled={bookingMutation.isPending || recurringBookingMutation.isPending}
          >
            Cancel
          </Button>
          {showRecurringPanel && (
            <Button
              onClick={handleConfirmAndClose}
              disabled={bookingMutation.isPending || recurringBookingMutation.isPending || !!startDateError || !!endDateError}
            >
              Confirm and Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};