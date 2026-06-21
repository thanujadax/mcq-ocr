import React, { useState, useEffect } from "react";
import axiosInstance from "../../../utils/axiosclient";
import { Modal } from "../../../components/UI/Modal";
import { Button } from "../../../components/UI/Button";
import { Faculty } from "./FacultyTable";

interface FacultyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  faculty: Faculty | null;
  mode: "create" | "edit";
}

export const FacultyFormModal: React.FC<FacultyFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  faculty,
  mode,
}) => {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (faculty && mode === "edit") {
      setName(faculty.name);
    } else {
      setName("");
    }
    setError("");
  }, [faculty, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const body = { name: name.trim() };
      if (mode === "create") {
        await axiosInstance.post("/api/faculties", body);
      } else {
        await axiosInstance.put(`/api/faculties/${faculty?.id}`, body);
      }
      onSubmit();
    } catch (error: unknown) {
      console.error("Error submitting faculty:", error);
      const detail =
        (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail;
      setError(detail || "Failed to save faculty");
    } finally {
      setIsLoading(false);
    }
  };

  const modalFooter = (
    <>
      <Button variant="outline" onClick={onClose} disabled={isLoading}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleSubmit}
        isLoading={isLoading}
        disabled={!name.trim()}
      >
        {mode === "create" ? "Create Faculty" : "Update Faculty"}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Create New Faculty" : "Edit Faculty"}
      size="sm"
      footer={modalFooter}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="faculty-name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Faculty Name
          </label>
          <input
            type="text"
            id="faculty-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter faculty name"
            required
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
};
