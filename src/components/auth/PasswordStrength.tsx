import { cn } from "@/lib/utils";

export function PasswordStrength({ password, className }: { password?: string; className?: string }) {
  const rules = [
    { label: "At least 8 characters",     test: (p: string) => p.length >= 8 },
    { label: "Uppercase letter",   test: (p: string) => /[A-Z]/.test(p) },
    { label: "Lowercase letter",   test: (p: string) => /[a-z]/.test(p) },
    { label: "Number",         test: (p: string) => /[0-9]/.test(p) },
    { label: "Special character",test: (p: string) => /[^A-Za-z0-9]/.test(p) },
  ];
  const p = password ?? "";
  const passed = rules.filter((r) => r.test(p)).length;

  return (
    <div className={cn("space-y-1", className)} aria-live="polite">
      <div className="h-1 rounded bg-muted overflow-hidden" role="progressbar"
           aria-valuenow={passed} aria-valuemin={0} aria-valuemax={rules.length}>
        <div className="h-full w-full origin-left scale-x-0" style={{ transform: `scaleX(${passed / rules.length})` }} />
      </div>
      <ul className="grid grid-cols-2 gap-x-4 text-xs text-muted-foreground">
        {rules.map((r) => (
          <li key={r.label} className={r.test(p) ? "text-foreground" : undefined}>• {r.label}</li>
        ))}
      </ul>
    </div>
  );
}
