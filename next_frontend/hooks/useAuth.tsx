"use client";

import axiosInstance from "@/utils/axiosclient";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, createContext, useContext } from "react";

// Exact copy of backend UserResponse
interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  verify_status: string;
  faculty_id: number | null;
  last_login?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface UserRegister {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  faculty_id: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  register: (
    user: UserRegister
  ) => Promise<{ success: boolean; error?: string }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const refreshUser = async () => {
    try {
      const response = await axiosInstance.get("/api/auth/me");

      const userData = response.data as User;
      if (userData) setUser(userData);
      else setUser(null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await axiosInstance.post("/api/auth/login", { email, password });
      await refreshUser();
      setIsLoading(false);
      router.refresh();
      return { success: true };
    } catch (error) {
      const errorMessage =
        (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Login failed";
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData: UserRegister) => {
    setIsLoading(true);
    setError(null);

    try {
      await axiosInstance.post("/api/auth/register", userData);

      await refreshUser();
      setIsLoading(false);
      router.refresh();
      return { success: true };
    } catch (error) {
      const errorMessage =
        (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Registration failed";
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      await axiosInstance.post("/api/auth/logout");
      router.refresh();
      setUser(null);
      setError(null);
    } catch {
      setError("Failed to Sign out");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        register,
        signIn,
        signOut,
        refreshUser,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
