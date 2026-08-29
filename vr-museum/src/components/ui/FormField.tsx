type FormFieldProps = {
  label: string;
  type?: string;
  placeholder?: string;
  name?: string;
  id?: string;
  required?: boolean;
  error?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
};

export default function FormField({
  label,
  type = "text",
  placeholder,
  name,
  id,
  required = false,
  error,
  autoComplete,
  inputMode,
}: FormFieldProps) {
  const fieldId = id ?? name ?? label.toLowerCase();

  return (
    <div>
      <label
        htmlFor={fieldId}
        className="text-xs tracking-label uppercase text-stone"
      >
        {label}{required && <span className="ms-1 text-red-700" aria-hidden="true">*</span>}
      </label>
      <input
        id={fieldId}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={`mt-2.5 w-full border-b bg-transparent pb-2.5 text-base text-ink placeholder:text-stone-light focus:outline-none ${error ? "border-red-700" : "border-line focus:border-ink"}`}
      />
      {error && <p id={`${fieldId}-error`} role="alert" className="mt-1.5 text-sm text-red-700">{error}</p>}
    </div>
  );
}
