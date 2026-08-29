"use client";

import { useState } from "react";

type PasswordFieldProps = {
  label?: string;
  placeholder?: string;
  name?: string;
  id?: string;
  required?: boolean;
  error?: string;
  autoComplete?: string;
};

export default function PasswordField({
  label = "Password",
  placeholder,
  name = "password",
  id = "password",
  required = false,
  error,
  autoComplete = "current-password",
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="text-xs tracking-label uppercase text-stone"
      >
        {label}{required && <span className="ms-1 text-red-700" aria-hidden="true">*</span>}
      </label>
      <div className={`relative mt-2.5 border-b focus-within:border-ink ${error ? "border-red-700" : "border-line"}`}>
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="w-full bg-transparent pb-2.5 pr-12 text-base text-ink placeholder:text-stone-light focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-0 bottom-0 grid h-11 w-11 place-items-center text-stone hover:text-ink"
        >
          {visible ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.5 5.1A10.6 10.6 0 0 1 12 5c5 0 9 4 10.5 7-0.6 1.2-1.5 2.5-2.7 3.6M6.5 6.7C4.3 8.1 2.7 10 1.5 12c1.5 3 5.5 7 10.5 7 1.4 0 2.7-0.3 3.9-0.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12Z" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {error && <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-red-700">{error}</p>}
    </div>
  );
}
