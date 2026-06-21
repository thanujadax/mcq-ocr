"use client";

import React, { useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosclient";
import { Modal } from "../../../components/UI/Modal";
import { Button } from "../../../components/UI/Button";
import { Input } from "../../../components/UI/Input";
import { Select } from "../../../components/UI/Select";

interface Faculty {
  id: number;
  name: string;
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  facultyId: string;
}

const EMPTY: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  facultyId: "",
};

export function CreateUserModal({
  isOpen,
  onClose,
  onCreated,
}: CreateUserModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {}
  );
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [faculties, setFaculties] = useState<Faculty[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setForm(EMPTY);
    setErrors({});
    setSubmitError("");
    (async () => {
      try {
        const res = await axiosInstance.get<Faculty[]>("/api/faculties");
        setFaculties(res.data);
      } catch {
        setFaculties([]);
      }
    })();
  }, [isOpen]);

  const update = (k: keyof FormState, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8)
      e.password = "Password must be at least 8 characters";
    if (form.confirmPassword !== form.password)
      e.confirmPassword = "Passwords do not match";
    if (!form.facultyId) e.facultyId = "Faculty is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await axiosInstance.post("/api/auth/register", {
        email: form.email.trim(),
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        password: form.password,
        faculty_id: Number(form.facultyId),
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail;
      setSubmitError(detail || "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <>
      <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleSubmit}
        isLoading={isSubmitting}
      >
        Create User
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New User"
      size="md"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First name"
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            error={errors.firstName}
          />
          <Input
            label="Last name"
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            error={errors.lastName}
          />
        </div>
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          error={errors.email}
        />
        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          error={errors.password}
          hint="At least 8 characters"
        />
        <Input
          label="Confirm password"
          type="password"
          value={form.confirmPassword}
          onChange={(e) => update("confirmPassword", e.target.value)}
          error={errors.confirmPassword}
        />
        <Select
          label="Faculty"
          value={form.facultyId}
          onChange={(e) => update("facultyId", e.target.value)}
          error={errors.facultyId}
          options={[
            { value: "", label: "Select a faculty…" },
            ...faculties.map((f) => ({ value: String(f.id), label: f.name })),
          ]}
        />
        {submitError && (
          <p className="text-sm text-red-600">{submitError}</p>
        )}
      </form>
    </Modal>
  );
}
