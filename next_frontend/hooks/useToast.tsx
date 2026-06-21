"use client";

import React, { useCallback, useState, createContext, useContext, useEffect } from "react";
import { createPortal } from "react-dom";
import { Toast, ToastType } from "../components/UI/Toast";

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType, duration?: number) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prevToasts) => [
        ...prevToasts,
        {
          id,
          message,
          type,
          duration,
        },
      ]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider
      value={{
        showToast,
      }}
    >
      {children}
      {mounted && createPortal(
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 999999 }}>
          <div className="absolute top-4 left-4 pointer-events-auto">
            {toasts.map((toast, idx) => (
              <Toast
                key={idx}
                message={toast.message}
                type={toast.type}
                duration={toast.duration}
                onClose={() => removeToast(toast.id)}
              />
            ))}
          </div>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
