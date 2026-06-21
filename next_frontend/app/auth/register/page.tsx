"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faLock,
  faUser,
  faBuilding,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";

import axiosInstance from "@/utils/axiosclient";

import { Input } from "../../../components/UI/Input";
import { Button } from "../../../components/UI/Button";
import { useAuth } from "../../../hooks/useAuth";
import { AuthLayout } from "../components/AuthLayout";

interface Faculty {
  id: number;
  name: string;
}

export default function Register() {
  const { register, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    facultyId: "",
  });
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    firstName?: string;
    lastName?: string;
    facultyId?: string;
  }>({});
  const [faculties, setFaculties] = useState<Faculty[]>([]);

  const router = useRouter();

  // Fetch faculties on component mount
  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const response = await axiosInstance.get("/api/faculties");
        setFaculties(response.data as Faculty[]);
      } catch (error) {
        console.error("Failed to fetch faculties:", error);
        setFaculties([]);
      }
    };

    fetchFaculties();
  }, []);

  const validateForm = () => {
    const errors: typeof validationErrors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password =
        "Password must contain uppercase, lowercase, and number";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!formData.facultyId) {
      errors.facultyId = "Please select a faculty";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    await register({
      email: formData.email,
      first_name: formData.firstName,
      last_name: formData.lastName,
      password: formData.password,
      faculty_id: parseInt(formData.facultyId),
    });
  };

  const registerIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-8 w-8 text-white"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
      />
    </svg>
  );

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Fill out the form below to register for an account"
      icon={registerIcon}
      error={error}
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            type="text"
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            value={formData.firstName}
            onChange={handleInputChange}
            error={validationErrors.firstName}
            leftIcon={
              <FontAwesomeIcon
                icon={faUser}
                className="h-5 w-5 text-gray-400"
              />
            }
            required
          />
          <Input
            label="Last Name"
            type="text"
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            value={formData.lastName}
            onChange={handleInputChange}
            error={validationErrors.lastName}
            leftIcon={
              <FontAwesomeIcon
                icon={faUser}
                className="h-5 w-5 text-gray-400"
              />
            }
            required
          />
        </div>

        <Input
          label="Email address"
          type="email"
          id="email"
          name="email"
          autoComplete="email"
          value={formData.email}
          onChange={handleInputChange}
          error={validationErrors.email}
          leftIcon={
            <FontAwesomeIcon
              icon={faEnvelope}
              className="h-5 w-5 text-gray-400"
            />
          }
          required
        />

        <div>
          <label
            htmlFor="facultyId"
            className="block text-sm font-medium text-gray-700"
          >
            Faculty
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon
                icon={faBuilding}
                className="h-5 w-5 text-gray-400"
              />
            </div>
            <select
              id="facultyId"
              name="facultyId"
              value={formData.facultyId}
              onChange={handleInputChange}
              className={`pl-10 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                validationErrors.facultyId
                  ? "border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300"
              }`}
              required
            >
              <option value="">Select a faculty</option>
              {faculties.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </option>
              ))}
            </select>
          </div>
          {validationErrors.facultyId && (
            <p className="mt-2 text-sm text-red-600">
              {validationErrors.facultyId}
            </p>
          )}
        </div>

        <Input
          label="Password"
          type="password"
          id="password"
          name="password"
          autoComplete="new-password"
          value={formData.password}
          onChange={handleInputChange}
          error={validationErrors.password}
          leftIcon={
            <FontAwesomeIcon icon={faLock} className="h-5 w-5 text-gray-400" />
          }
          required
        />

        <Input
          label="Confirm Password"
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          error={validationErrors.confirmPassword}
          leftIcon={
            <FontAwesomeIcon icon={faLock} className="h-5 w-5 text-gray-400" />
          }
          required
        />

        <div>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
          >
            Create Account
          </Button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Already have an account?
            </span>
          </div>
        </div>
        <div className="mt-6">
          <Button
            variant="outline"
            fullWidth
            type="button"
            onClick={() => router.push("/auth/signin")}
          >
            Sign in instead
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
