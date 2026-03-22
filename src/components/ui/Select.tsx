"use client";
import React, { forwardRef } from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, error, className = "", id, children, ...props }, ref) => {
    const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    const baseClasses =
      "w-full rounded-xl px-4 py-3 bg-surface text-white outline-none transition-colors border appearance-none pr-10";
    const stateClasses = error
      ? "border-red-500"
      : "border-border focus:border-accent";
    const disabledClasses = props.disabled ? "opacity-50 cursor-not-allowed" : "";

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`${baseClasses} ${stateClasses} ${disabledClasses} ${className}`}
            {...props}
          >
            {children}
          </select>
          {/* Custom chevron */}
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-text-secondary"
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-text-secondary">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
