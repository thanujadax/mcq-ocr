import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
  faExclamationTriangle,
  faInfoCircle,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow time for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <FontAwesomeIcon
            icon={faCheckCircle}
            className="h-5 w-5 text-green-400"
          />
        );
      case "error":
        return (
          <FontAwesomeIcon
            icon={faTimesCircle}
            className="h-5 w-5 text-red-400"
          />
        );
      case "warning":
        return (
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className="h-5 w-5 text-amber-400"
          />
        );
      case "info":
        return (
          <FontAwesomeIcon
            icon={faInfoCircle}
            className="h-5 w-5 text-blue-400"
          />
        );
    }
  };

  const getStyles = () => {
    const baseStyles =
      "min-w-[320px] max-w-md bg-white shadow-xl rounded-lg pointer-events-auto border-l-4 overflow-hidden transform transition-all duration-200 hover:scale-105";
    switch (type) {
      case "success":
        return `${baseStyles} border-l-green-500 shadow-green-100`;
      case "error":
        return `${baseStyles} border-l-red-500 shadow-red-100`;
      case "warning":
        return `${baseStyles} border-l-amber-500 shadow-amber-100`;
      case "info":
        return `${baseStyles} border-l-blue-500 shadow-blue-100`;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50";
      case "error":
        return "bg-red-50";
      case "warning":
        return "bg-amber-50";
      case "info":
        return "bg-blue-50";
    }
  };

  return (
    <div
      className={`transform transition-all duration-300 ease-in-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <div className={getStyles()}>
        <div className="p-4">
          <div className="flex items-start">
            <div className={`flex-shrink-0 ${getBgColor()} p-2 rounded-full`}>
              {getIcon()}
            </div>
            <div className="ml-3 flex-1 pt-0.5">
              <p className="text-sm font-medium text-gray-900 leading-relaxed">
                {message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
              >
                <span className="sr-only">Close</span>
                <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
