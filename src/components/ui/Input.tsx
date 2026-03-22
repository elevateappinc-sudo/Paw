"use client";
import React, { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, className = "", id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    const baseClasses =
      "w-full rounded-xl px-4 py-3 bg-surface text-white outline-none transition-colors border";
    const stateClasses = error
      ? "border-red-500"
      : "border-border focus:border-accent";
    const disabledClasses = props.disabled ? "opacity-50 cursor-not-allowed" : "";

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${baseClasses} ${stateClasses} ${disabledClasses} ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-text-secondary">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
