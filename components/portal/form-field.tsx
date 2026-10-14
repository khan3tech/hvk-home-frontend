import * as React from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { Input, type InputProps } from "@/components/ui/input";

/** Label + required marker matching the registration form's existing style. */
export function FieldLabel({ htmlFor, children, required = true }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-ink dark:text-slate-200">
      {children} {required ? <span className="text-red-500">*</span> : null}
    </label>
  );
}

/** Password input with a show/hide toggle. */
export const PasswordInput = React.forwardRef<HTMLInputElement, Omit<InputProps, "type" | "icon">>(
  function PasswordInput(props, ref) {
    const [visible, setVisible] = React.useState(false);
    return (
      <div className="relative">
        <Input ref={ref} type={visible ? "text" : "password"} icon={KeyRound} className="pr-11" {...props} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1.5 inline-flex h-9 w-9 items-center justify-center rounded-md text-muted hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bright-blue dark:text-slate-400 dark:hover:text-white"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    );
  },
);

/** Form-level error/info line announced to assistive tech. */
export function FormMessage({ tone = "error", children }: { tone?: "error" | "success"; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={tone === "error" ? "text-sm font-semibold text-red-500 dark:text-red-400" : "text-sm font-semibold text-green-600 dark:text-green-400"}
    >
      {children}
    </p>
  );
}
