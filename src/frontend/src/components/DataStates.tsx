import { cn } from "@/lib/utils";
import { AlertTriangle, Inbox, Loader2, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

/** Layout-matched skeleton rows for dense tables. */
export function TableSkeleton({
  rows = 6,
  cols = 5,
}: { rows?: number; cols?: number }) {
  const rowIds = Array.from({ length: rows }, (_, i) => `skeleton-row-${i}`);
  const colIds = Array.from({ length: cols }, (_, i) => `skeleton-col-${i}`);
  return (
    <div data-ocid="loading_state" className="space-y-2 p-4">
      {rowIds.map((rowId) => (
        <div key={rowId} className="flex items-center gap-4">
          {colIds.map((colId) => (
            <div
              key={colId}
              className="h-4 flex-1 animate-pulse rounded bg-muted motion-reduce:animate-none"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <output
      data-ocid="loading_state"
      className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground"
    >
      <Loader2
        className="size-6 animate-spin text-primary motion-reduce:animate-none"
        aria-hidden="true"
      />
      <span className="text-sm">{label}</span>
    </output>
  );
}

export function ErrorState({
  title,
  body,
  onRetry,
  retryLabel,
}: {
  title: string;
  body: string;
  onRetry?: () => void;
  retryLabel: string;
}) {
  return (
    <div
      data-ocid="error_state"
      className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </span>
      <h3 className="font-display text-lg font-semibold text-foreground">
        {title}
      </h3>
      <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
      {onRetry && (
        <button
          type="button"
          data-ocid="error_state.retry_button"
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-2 rounded-md border border-input bg-card px-4 py-2 text-sm font-medium text-foreground transition-smooth hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          {retryLabel}
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div
      data-ocid="empty_state"
      className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="size-6" aria-hidden="true" />
      </span>
      <h3 className="font-display text-lg font-semibold text-foreground">
        {title}
      </h3>
      <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
      {action}
    </div>
  );
}

/** Page title block used by every management screen. */
export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
}: {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </header>
  );
}

/** KPI card with the signature chart stripe. */
export function KpiCard({
  label,
  value,
  tone = "default",
  icon,
}: {
  label: string;
  value: string | number;
  tone?: "default" | "accent" | "success" | "warning";
  icon?: ReactNode;
}) {
  const stripe =
    tone === "accent"
      ? "chart-stripe-accent"
      : tone === "success"
        ? "chart-stripe-success"
        : tone === "warning"
          ? "chart-stripe-warning"
          : "";
  const valueTone =
    tone === "accent"
      ? "text-accent"
      : tone === "success"
        ? "text-success"
        : tone === "warning"
          ? "text-warning"
          : "text-foreground";
  return (
    <div
      data-ocid="kpi.card"
      className={cn(
        "chart-stripe rounded-lg border border-border bg-card p-4 shadow-subtle transition-smooth hover:shadow-elevated md:p-5",
        stripe,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        {icon && (
          <span className="text-muted-foreground" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <p
        className={cn(
          "mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl",
          valueTone,
        )}
      >
        {value}
      </p>
    </div>
  );
}

/** Status pill: text + color, never color alone. */
export function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "pending" | "confirmed" | "completed" | "cancelled" | "neutral";
}) {
  const styles: Record<typeof tone, string> = {
    pending: "bg-warning/15 text-warning",
    confirmed: "bg-primary/12 text-primary",
    completed: "bg-success/15 text-success",
    cancelled: "bg-muted text-muted-foreground",
    neutral: "bg-secondary text-secondary-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[tone],
      )}
    >
      {label}
    </span>
  );
}
