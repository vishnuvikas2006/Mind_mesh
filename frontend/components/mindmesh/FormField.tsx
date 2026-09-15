"use client";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { useId, useState } from "react";

type Props = {
  label: string;
  name: string;
  placeholder: string;
  type?: "text" | "email" | "password" | "tel";
  value: string;
  onChange: (value: string) => void;
  error?: string;
  icon: LucideIcon;
  autoComplete?: string;
};

export function FormField({ label, name, placeholder, type = "text", value, onChange, error, icon: Icon, autoComplete }: Props) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const password = type === "password";
  const descriptionId = error ? `${id}-error` : undefined;

  return <div className="group min-w-0">
    <label htmlFor={id} className="mb-2 block text-sm font-semibold text-ink transition-colors group-focus-within:text-deepteal">{label}</label>
    <div className={`flex min-h-14 w-full items-center rounded-2xl border bg-white px-4 shadow-[0_1px_1px_rgba(23,62,72,0.02)] transition-colors duration-200 ${error ? "border-red-500 bg-red-50/30" : "border-[#d6e2e5] focus-within:border-deepteal focus-within:bg-[#fcfefd]"}`}>
      <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-[#6f8c99] transition-colors group-focus-within:text-deepteal" />
      <input
        id={id}
        name={name}
        type={password && visible ? "text" : type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoCapitalize={type === "email" ? "none" : undefined}
        autoCorrect={type === "email" ? "off" : undefined}
        spellCheck={type === "email" ? false : undefined}
        required
        aria-invalid={Boolean(error)}
        aria-describedby={descriptionId}
        className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[15px] leading-6 text-ink outline-none placeholder:text-[#8ca1a9] focus:outline-none"
      />
      {password && <button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Hide password" : "Show password"} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[#6f8c99] transition hover:bg-mint focus-visible:outline-none">{visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>}
    </div>
    {error && <p id={`${id}-error`} className="mt-2 text-sm leading-5 text-red-700" role="alert">{error}</p>}
  </div>;
}
