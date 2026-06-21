import React, { forwardRef, useId } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  options: SelectOption[];
  error?: string;
  hint?: string;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      error,
      hint,
      size = "md",
      fullWidth = true,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;

    const sizeClasses = {
      sm: "py-1 text-xs",
      md: "py-2 text-sm",
      lg: "py-3 text-base",
    };

    return (
      <div className={`${fullWidth ? "w-full" : ""} ${className}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`
            block appearance-none rounded-md border-gray-300 pr-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 
            ${sizeClasses[size]}
            ${
              error
                ? "border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500"
                : ""
            }
            ${fullWidth ? "w-full" : ""}
          `}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={
              error
                ? `${selectId}-error`
                : hint
                ? `${selectId}-hint`
                : undefined
            }
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <FontAwesomeIcon icon={faChevronDown} className="h-4 w-4" />
          </div>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600" id={`${selectId}-error`}>
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-2 text-sm text-gray-500" id={`${selectId}-hint`}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
