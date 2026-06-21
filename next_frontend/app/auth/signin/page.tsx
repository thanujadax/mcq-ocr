"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLock } from "@fortawesome/free-solid-svg-icons";
import { AcademicCapIcon } from "@heroicons/react/24/outline";
import { Input } from "../../../components/UI/Input";
import { Button } from "../../../components/UI/Button";
import { useAuth } from "../../../hooks/useAuth";
import { AuthLayout } from "../components/AuthLayout";

export default function SignIn() {
  const { signIn, isLoading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const router = useRouter();

  const validateForm = () => {
    const errors: {
      email?: string;
      password?: string;
    } = {};

    if (!email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Email is invalid";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    await signIn(email, password);
  };

  const authIcon = <AcademicCapIcon className="h-8 w-8 text-white" />;

  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="Enter your credentials to access your account"
      icon={authIcon}
      error={error}
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <Input
          label="Email address"
          type="email"
          id="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={validationErrors.email}
          leftIcon={
            <FontAwesomeIcon
              icon={faEnvelope}
              className="h-5 w-5 text-gray-400"
            />
          }
          required
        />
        <Input
          label="Password"
          type="password"
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={validationErrors.password}
          leftIcon={
            <FontAwesomeIcon icon={faLock} className="h-5 w-5 text-gray-400" />
          }
          required
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember_me"
              name="remember_me"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="remember_me"
              className="ml-2 block text-sm text-gray-900"
            >
              Remember me
            </label>
          </div>
          <div className="text-sm">
            <a
              href="#"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Forgot your password?
            </a>
          </div>
        </div>
        <div>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
          >
            Sign in
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
              Don&apos;t have an account?
            </span>
          </div>
        </div>
        <div className="mt-6">
          <Button
            variant="outline"
            fullWidth
            type="button"
            onClick={() => router.push("/auth/register")}
          >
            Create new account
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
