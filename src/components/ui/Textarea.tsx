"use client";
import React, { forwardRef } from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, className = "", id, rows = 3, ...props }, ref) => {
    const textareaId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    const baseClasses =
      "w-full rounded-md px-4 py-3 bg-surface text-text outline-none transition-colors border resize-y";
    const stateClasses = error
      ? "border-overdue"
      : "border-border focus:border-accent";
    const disabledClasses = props.disabled ? "opacity-50 cursor-not-allowed" : "";

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-body font-semibold text-text-secondary"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={`${baseClasses} ${stateClasses} ${disabledClasses} ${className}`}
          {...props}
        />
        {error && <p className="text-label text-overdue-text">{error}</p>}
        {!error && helperText && (
          <p className="text-label text-text-secondary">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
