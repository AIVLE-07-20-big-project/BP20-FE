import { CircleAlert, CircleCheck, X } from "lucide-react";

export function OperationModal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  width = "max-w-xl",
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
  width?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B1220]/55 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="commerce-dialog-title"
        className={`flex max-h-[92vh] w-full ${width} flex-col overflow-hidden rounded-3xl border border-white/60 bg-card shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 id="commerce-dialog-title" className="text-lg font-bold">{title}</h2>
            {description && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/25 px-6 py-4">
          {footer}
        </div>
      </div>
    </div>
  );
}

export function FormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  min,
  max,
  hint,
  error,
  multiline,
  disabled,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  hint?: string;
  error?: string;
  multiline?: boolean;
  disabled?: boolean;
}) {
  const baseClass = `w-full rounded-xl border bg-card px-3 text-sm outline-none transition ${
    error
      ? "border-red-400 focus:border-red-500 focus:ring-3 focus:ring-red-500/10"
      : "border-border focus:border-[#246BFD] focus:ring-3 focus:ring-[#246BFD]/10"
  }`;

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-foreground">
        {label}{required && <span className="ml-0.5 text-[#D92D20]">*</span>}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={4}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className={`${baseClass} resize-none py-2.5 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className={`${baseClass} h-10 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground`}
        />
      )}
      {error && (
        <span role="alert" className="mt-1 block text-[11px] font-medium text-red-600">
          {error}
        </span>
      )}
      {hint && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  children,
  required,
  disabled,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold">
        {label}{required && <span className="ml-0.5 text-[#D92D20]">*</span>}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none transition focus:border-[#246BFD] focus:ring-3 focus:ring-[#246BFD]/10 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
      >
        {children}
      </select>
    </label>
  );
}

export function FeedbackBanner({
  error,
  notice,
}: {
  error: string;
  notice: string;
}) {
  if (!error && !notice) return null;

  return error ? (
    <div
      role="alert"
      aria-live="assertive"
      className="mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-relaxed text-red-700"
    >
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
      {error}
    </div>
  ) : (
    <div
      role="status"
      aria-live="polite"
      className="mb-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-relaxed text-emerald-700"
    >
      <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
      {notice}
    </div>
  );
}

export function ModalActions({
  saving,
  onClose,
  submitLabel,
  disabled,
  formId,
}: {
  saving: boolean;
  onClose: () => void;
  submitLabel: string;
  disabled?: boolean;
  formId?: string;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={saving}
        className="h-10 rounded-xl border border-border bg-card px-4 text-xs font-semibold hover:bg-muted disabled:opacity-50"
      >
        취소
      </button>
      <button
        type="submit"
        form={formId}
        disabled={saving || disabled}
        className="h-10 rounded-xl bg-[#246BFD] px-5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1D4ED8] disabled:opacity-50"
      >
        {saving ? "처리 중..." : submitLabel}
      </button>
    </>
  );
}
