type FormFieldProps = {
  label: string;
  type?: string;
  placeholder?: string;
  name?: string;
  id?: string;
};

export default function FormField({
  label,
  type = "text",
  placeholder,
  name,
  id,
}: FormFieldProps) {
  const fieldId = id ?? name ?? label.toLowerCase();

  return (
    <div>
      <label
        htmlFor={fieldId}
        className="text-[10px] tracking-label uppercase text-stone"
      >
        {label}
      </label>
      <input
        id={fieldId}
        name={name}
        type={type}
        placeholder={placeholder}
        className="mt-2.5 w-full border-b border-line bg-transparent pb-2.5 text-sm text-ink placeholder:text-stone-light focus:border-ink focus:outline-none"
      />
    </div>
  );
}
