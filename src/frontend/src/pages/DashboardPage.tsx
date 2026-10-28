import {
  EmptyState,
  ErrorState,
  KpiCard,
  LoadingState,
  PageHeader,
} from "@/components/DataStates";
import { useAppointments, useMedicines, usePatients } from "@/hooks/useBackend";
import { vi } from "@/lib/i18n";
import { CalendarDays, ClipboardList, Pill, Users } from "lucide-react";

export function DashboardPage() {
  const patients = usePatients();
  const appointments = useAppointments();
  const medicines = useMedicines();

  const isLoading =
    patients.isLoading || appointments.isLoading || medicines.isLoading;
  const isError = patients.isError || appointments.isError || medicines.isError;

  const today = new Date();
  const appointmentsToday = (appointments.data ?? []).filter((a) => {
    const d = new Date(Number(a.scheduledAt / 1_000_000n));
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  }).length;
  const pending = (appointments.data ?? []).filter(
    (a) => a.status === "pending",
  ).length;
  const lowStock = (medicines.data ?? []).filter(
    (m) => m.stockQuantity <= 10n,
  ).length;

  return (
    <>
      <PageHeader title={vi.dashboard.title} subtitle={vi.dashboard.subtitle} />

      {isError ? (
        <ErrorState
          title={vi.common.errorTitle}
          body={vi.common.errorBody}
          retryLabel={vi.common.retry}
          onRetry={() => {
            void patients.refetch();
            void appointments.refetch();
            void medicines.refetch();
          }}
        />
      ) : isLoading ? (
        <LoadingState label={vi.common.loading} />
      ) : (
        <section
          data-ocid="dashboard.kpi.section"
          aria-label={vi.dashboard.title}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <KpiCard
            label={vi.dashboard.kpi.appointmentsToday}
            value={appointmentsToday}
            icon={<CalendarDays className="size-4" />}
          />
          <KpiCard
            label={vi.dashboard.kpi.newPatients}
            value={patients.data?.length ?? 0}
            icon={<Users className="size-4" />}
          />
          <KpiCard
            label={vi.dashboard.kpi.pendingConfirm}
            value={pending}
            tone="accent"
            icon={<ClipboardList className="size-4" />}
          />
          <KpiCard
            label={vi.dashboard.kpi.lowStock}
            value={lowStock}
            tone="warning"
            icon={<Pill className="size-4" />}
          />
        </section>
      )}

      <section className="rounded-lg border border-border bg-card shadow-subtle">
        <div className="border-b border-border px-4 py-3 md:px-6">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {vi.dashboard.recentAppointments}
          </h2>
        </div>
        {appointments.isLoading ? (
          <LoadingState label={vi.common.loading} />
        ) : (appointments.data ?? []).length === 0 ? (
          <EmptyState
            title={vi.common.emptyTitle}
            body={vi.appointments.empty}
          />
        ) : (
          <ul
            data-ocid="dashboard.appointments.list"
            className="divide-y divide-border"
          >
            {(appointments.data ?? []).slice(0, 5).map((a, index) => (
              <li
                key={a.id.toString()}
                data-ocid={`dashboard.appointments.item.${index + 1}`}
                className="chart-stripe flex items-center justify-between gap-4 px-4 py-3 md:px-6"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm text-foreground">
                    #{a.id.toString()}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.reason}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {vi.appointments.status[a.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
