import React from "react";
import {useCreateDeskMutation, useDesksQuery} from "@/hooks/useDesks";
import type {Desk} from "@/types";
import {DeskBookingModal} from "@/components/DeskBookingModal";
import Button from "@/pageElements/Button";

export const DeskDashboardPage: React.FC = () => {
  const {data: desks, isLoading, isError, error, refetch} = useDesksQuery();
  const createDeskMutation = useCreateDeskMutation();

  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);

  const [selectedDeskForBooking, setSelectedDeskForBooking] =
    React.useState<(Desk & { id: number }) | null>(null);

  const resetForm = () => {
    setName("");
    setLocation("");
    setFormError(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    if (!createDeskMutation.isPending) {
      setIsCreateModalOpen(false);
    }
  };

  const handleSubmitCreateDesk: React.FormEventHandler<HTMLFormElement> = async (
    e,
  ) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }

    const locationValue = location.trim().length > 0 ? location.trim() : null;

    try {
      await createDeskMutation.mutateAsync({
        name: name.trim(),
        location: locationValue,
      });
      await refetch();
      setIsCreateModalOpen(false);
      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setFormError(`Could not create desk: ${message}`);
    }
  };

  const handleOpenBookingModal = (desk: Desk) => {
    if (desk.id == null) return;
    setSelectedDeskForBooking(desk as Desk & { id: number });
  };

  const handleCloseBookingModal = () => {
    setSelectedDeskForBooking(null);
  };

  if (isLoading) {
    return <p style={{padding: "1rem"}}>Loading desks...</p>;
  }

  if (isError) {
    return (
      <div style={{padding: "1rem", color: "red"}}>
        <p>Failed to load desks.</p>
        <p>{error.message}</p>
      </div>
    );
  }

  const renderCreateDeskModal = () => {
    if (!isCreateModalOpen) return null;

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
        onClick={handleCloseCreateModal}
      >
        <div
          style={{
            backgroundColor: "#fff",
            padding: "1.5rem",
            borderRadius: "4px",
            width: "100%",
            maxWidth: "400px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 style={{marginTop: 0, marginBottom: "1rem"}}>Create desk</h2>
          <form onSubmit={handleSubmitCreateDesk}>
            <div style={{marginBottom: "0.75rem"}}>
              <label
                htmlFor="desk-name"
                style={{display: "block", marginBottom: "0.25rem"}}
              >
                Name
              </label>
              <input
                id="desk-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.4rem 0.5rem",
                  boxSizing: "border-box",
                }}
                autoFocus
              />
            </div>
            <div style={{marginBottom: "0.75rem"}}>
              <label
                htmlFor="desk-location"
                style={{display: "block", marginBottom: "0.25rem"}}
              >
                Location (optional)
              </label>
              <input
                id="desk-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.4rem 0.5rem",
                  boxSizing: "border-box",
                }}
              />
            </div>
            {formError && (
              <p style={{color: "red", marginBottom: "0.75rem"}}>{formError}</p>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.5rem",
                marginTop: "0.5rem",
              }}
            >
              <Button
                variant="secondary"
                onClick={handleCloseCreateModal}
                disabled={createDeskMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createDeskMutation.isPending}
              >
                {createDeskMutation.isPending ? "Creating..." : "Create desk"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (!desks || desks.length === 0) {
    return (
      <div style={{padding: "1rem"}}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1 style={{marginBottom: "1rem"}}>Dashboard</h1>
          <Button
            onClick={handleOpenCreateModal}
            disabled={createDeskMutation.isPending}
          >
            Create desk
          </Button>
        </div>
        <p>No desks found.</p>
        {renderCreateDeskModal()}
      </div>
    );
  }

  return (
    <div style={{padding: "1rem"}}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{marginBottom: "1rem"}}>Dashboard</h1>
        <Button
          onClick={handleOpenCreateModal}
          disabled={createDeskMutation.isPending}
        >
          Create desk
        </Button>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          maxWidth: "800px",
        }}
      >
        <thead>
        <tr>
          <th
            style={{
              borderBottom: "1px solid #ccc",
              textAlign: "left",
              padding: "0.5rem",
            }}
          >
            ID
          </th>
          <th
            style={{
              borderBottom: "1px solid #ccc",
              textAlign: "left",
              padding: "0.5rem",
            }}
          >
            Name
          </th>
          <th
            style={{
              borderBottom: "1px solid #ccc",
              textAlign: "left",
              padding: "0.5rem",
            }}
          >
            Location
          </th>
          <th
            style={{
              borderBottom: "1px solid #ccc",
              textAlign: "right",
              padding: "0.5rem",
            }}
          >
            Actions
          </th>
        </tr>
        </thead>
        <tbody>
        {desks.map((desk) => (
          <tr key={desk.id}>
            <td
              style={{
                borderBottom: "1px solid #eee",
                padding: "0.5rem",
              }}
            >
              {desk.id}
            </td>
            <td
              style={{
                borderBottom: "1px solid #eee",
                padding: "0.5rem",
              }}
            >
              {desk.name}
            </td>
            <td
              style={{
                borderBottom: "1px solid #eee",
                padding: "0.5rem",
              }}
            >
              {desk.location ?? "-"}
            </td>
            <td
              style={{
                borderBottom: "1px solid #eee",
                padding: "0.5rem",
                textAlign: "right",
              }}
            >
              <Button
                size="small"
                onClick={() => handleOpenBookingModal(desk)}
                disabled={desk.id == null}
              >
                Book
              </Button>
            </td>
          </tr>
        ))}
        </tbody>
      </table>

      {renderCreateDeskModal()}

      {selectedDeskForBooking && (
        <DeskBookingModal
          desk={selectedDeskForBooking}
          isOpen={!!selectedDeskForBooking}
          onClose={handleCloseBookingModal}
        />
      )}
    </div>
  );
};

export default DeskDashboardPage;